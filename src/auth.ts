// auth.ts

import { randomUUID } from "node:crypto";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authPool } from "@/lib/db";
import { getUserRoles } from "./lib/roles";

const maxAge = 30 * 24 * 60 * 60; // 30 days

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(authPool),
  session: {
    strategy: "database",
    maxAge,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    // ✅ Override encode — instead of creating a JWT,
    // save session to DB and return the sessionToken as the cookie value
    async encode({ token }) {
      if (!token?.sub) return "";

      const sessionToken = randomUUID();

      await authPool.query(
        `INSERT INTO sessions ("sessionToken", "userId", expires)
         VALUES ($1, $2, $3)
         ON CONFLICT ("sessionToken") DO NOTHING`,
        [sessionToken, token.sub, new Date(Date.now() + maxAge * 1000)],
      );

      return sessionToken;
    },

    // ✅ Override decode — just return the token as-is
    // Auth.js will use the sessionToken to look up the session in DB
    async decode({ token }) {
      if (token) {
      }
      return null; // not used with database strategy
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { rows } = await authPool.query("SELECT * FROM users WHERE email = $1", [
          credentials.email,
        ]);
        const user = rows[0];
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const roles = await getUserRoles(session.user.email);
      session.user.roles = roles;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});
