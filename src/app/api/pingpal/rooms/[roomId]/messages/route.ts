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
       m.id, 
       m.room_id, 
       m.sender_id, 
       m.content, 
       m.type, 
       m.file_url, 
       m.reply_to_id, 
       m.is_edited, 
       m.is_deleted, 
       m.created_at,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatar_url', u.image
       ) AS sender
     FROM pingpal.messages m
     LEFT JOIN super.users u ON u.id = m.sender_id
     WHERE m.room_id = $1
     ORDER BY m.created_at ASC`,
    [roomId],
  );

  return NextResponse.json({ messages: rows });
}
