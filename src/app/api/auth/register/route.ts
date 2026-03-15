import { hashPassword } from "@/lib/auth/password";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const hashed = await hashPassword(password);

  const result = await pool.query(
    `
    INSERT INTO super.users(email, password_hash)
    VALUES ($1,$2)
    RETURNING id
    `,
    [email, hashed],
  );

  return Response.json({
    userId: result.rows[0].id,
  });
}
