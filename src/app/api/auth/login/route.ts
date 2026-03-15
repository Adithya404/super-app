import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const result = await pool.query(
    `
    SELECT id, password_hash
    FROM super.users
    WHERE email = $1
    `,
    [email],
  );

  if (result.rowCount === 0) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const user = result.rows[0];

  const valid = await verifyPassword(user.password_hash, password);

  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const token = await createSession(user.id);

  setSessionCookie(token);

  return Response.json({ success: true });
}
