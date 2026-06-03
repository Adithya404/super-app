// lib/pingpal/permissions.ts
import { pingpalPool } from "@/lib/db";

// Check if user has global chat_master or chat_personnel role
export async function verifyChatAccess(email: string) {
  const { rows } = await pingpalPool.query(
    `SELECT role_code FROM super.user_roles 
     WHERE email = $1 
       AND role_code IN ('chat_personnel', 'chat_master')
       AND (end_date IS NULL OR end_date > CURRENT_DATE)
     LIMIT 1`,
    [email],
  );

  if (rows.length === 0) return { hasAccess: false, isMaster: false };
  return {
    hasAccess: true,
    isMaster: rows[0].role_code === "chat_master",
  };
}

export async function getRoomRole(userId: string, roomId: string) {
  const { rows } = await pingpalPool.query(
    `SELECT role FROM pingpal.room_members WHERE user_id = $1 AND room_id = $2`,
    [userId, roomId],
  );
  return rows[0]?.role ?? null;
}

export async function requireOwnerOrAdmin(userId: string, email: string, roomId: string) {
  const { isMaster } = await verifyChatAccess(email);
  if (isMaster) return "admin"; // bypass for chat_master

  const role = await getRoomRole(userId, roomId);
  if (!["owner", "admin"].includes(role ?? "")) {
    throw new Error("Insufficient permissions");
  }
  return role;
}
