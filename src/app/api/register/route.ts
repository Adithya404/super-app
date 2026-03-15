// app/api/register/route.ts

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authPool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Check if user exists
    const { rows: userRows } = await authPool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userRows.length > 0) {
      const userId = userRows[0].id;

      // Check how they signed up — look for linked OAuth accounts
      const { rows: accountRows } = await authPool.query(
        'SELECT provider FROM accounts WHERE "userId" = $1',
        [userId],
      );

      const providers = accountRows.map((r) => r.provider);
      const hasGoogle = providers.includes("google");
      const hasCredentials = providers.includes("credentials");

      if (hasGoogle && !hasCredentials) {
        // Google-only account — nudge them to use Google
        return NextResponse.json(
          {
            error: "This email is linked to a Google account.",
            hint: "USE_GOOGLE", // use this on frontend to show Google button
          },
          { status: 409 },
        );
      }

      // Credentials account exists
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
          hint: "USE_LOGIN",
        },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await authPool.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hashed]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
