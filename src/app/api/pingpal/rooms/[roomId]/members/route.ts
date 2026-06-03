import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { verifyChatAccess } from "@/lib/pingpal/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await params;

  if (!isMaster) {
    const { rows: membership } = await pingpalPool.query(
      `SELECT 1 FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, session.user.id],
    );
    if (!membership.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { rows } = await pingpalPool.query(
    `SELECT 
       rm.user_id,
       rm.role,
       u.email,
       u.name,
       u.image as avatar_url,
       COALESCE(up.is_online, false) as is_online
     FROM pingpal.room_members rm
     JOIN super.users u ON u.id = rm.user_id
     LEFT JOIN pingpal.user_presence up ON up.user_id = rm.user_id
     WHERE rm.room_id = $1`,
    [roomId],
  );

  return NextResponse.json({ members: rows });
}
