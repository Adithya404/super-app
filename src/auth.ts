// auth.ts

import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authPool } from "@/lib/db";
import { getUserRoles } from "./lib/roles";
import { resolveTeamsForUser } from "./lib/teams";

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

      const sessionToken = crypto.randomUUID();

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
    async signIn({ user, account, profile }) {
      // Only gate OAuth/OIDC providers — credentials are already validated in authorize()
      if (account?.type === "oidc" || account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // Check if user exists in super.users
        const { rows } = await authPool.query("SELECT id FROM users WHERE email = $1", [email]);

        if (rows.length === 0) {
          // User not in super.users — reject sign-in (prevents auto-creation)
          return "/auth?error=not-registered";
        }

        // Auto-sync profile data from Google OIDC id_token
        await authPool.query(
          `UPDATE users
           SET
             name            = COALESCE($1, name),
             image           = COALESCE($2, image),
             "emailVerified" = CASE WHEN $3 THEN NOW() ELSE "emailVerified" END
           WHERE email = $4`,
          [
            profile?.name ?? user.name ?? null,
            profile?.picture ?? user.image ?? null,
            profile?.email_verified ?? false,
            email,
          ],
        );
      }

      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      const roles = await getUserRoles(session.user.email);
      session.user.roles = roles;
      session.user.teams = resolveTeamsForUser(roles);
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});
