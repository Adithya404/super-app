import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { MESSAGE_SELECT } from "@/lib/pingpal/message-query";
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
    `${MESSAGE_SELECT}
     WHERE m.room_id = $1
     ORDER BY m.created_at ASC`,
    [roomId],
  );

  return NextResponse.json({ messages: rows });
}
