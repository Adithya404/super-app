// lib/pingpal/permissions.ts
import { pingpalPool } from "@/lib/db";

export async function getRoomRole(userId: string, roomId: string) {
  const { rows } = await pingpalPool.query(
    `SELECT role FROM pingpal.room_members WHERE user_id = $1 AND room_id = $2`,
    [userId, roomId],
  );
  return rows[0]?.role ?? null;
}

export async function requireOwnerOrAdmin(userId: string, roomId: string) {
  const role = await getRoomRole(userId, roomId);
  if (!["owner", "admin"].includes(role ?? "")) {
    throw new Error("Insufficient permissions");
  }
  return role;
}
