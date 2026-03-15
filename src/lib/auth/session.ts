import crypto from "node:crypto";
import { pool } from "@/lib/db";

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateSessionToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `
    INSERT INTO super.sessions(user_id, session_token, expires_at)
    VALUES ($1,$2,$3)
    `,
    [userId, token, expiresAt],
  );

  return token;
}
