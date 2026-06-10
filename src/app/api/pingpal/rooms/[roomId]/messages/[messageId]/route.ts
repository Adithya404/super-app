import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { MESSAGE_SELECT } from "@/lib/pingpal/message-query";
import { verifyChatAccess } from "@/lib/pingpal/permissions";
import { broadcastToRoom } from "@/lib/websocket/server";

async function getMessage(roomId: string, messageId: string) {
  const { rows } = await pingpalPool.query(
    `${MESSAGE_SELECT}
     WHERE m.room_id = $1 AND m.id = $2`,
    [roomId, messageId],
  );
  return rows[0] ?? null;
}

async function verifyMembership(roomId: string, userId: string, isMaster: boolean) {
  if (isMaster) return true;
  const { rows } = await pingpalPool.query(
    `SELECT 1 FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
  return rows.length > 0;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; messageId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId, messageId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const isMember = await verifyMembership(roomId, session.user.id, isMaster);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows: existing } = await pingpalPool.query(
    `SELECT sender_id, is_deleted FROM pingpal.messages WHERE id = $1 AND room_id = $2`,
    [messageId, roomId],
  );
  if (!existing.length || existing[0].is_deleted) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (existing[0].sender_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pingpalPool.query(
    `UPDATE pingpal.messages
     SET content = $1, is_edited = true, updated_at = NOW()
     WHERE id = $2 AND room_id = $3`,
    [content.trim(), messageId, roomId],
  );

  const message = await getMessage(roomId, messageId);
  broadcastToRoom(roomId, { type: "message_edited", message });

  return NextResponse.json({ message });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ roomId: string; messageId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId, messageId } = await params;

  const isMember = await verifyMembership(roomId, session.user.id, isMaster);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows: existing } = await pingpalPool.query(
    `SELECT sender_id, is_deleted FROM pingpal.messages WHERE id = $1 AND room_id = $2`,
    [messageId, roomId],
  );
  if (!existing.length || existing[0].is_deleted) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (existing[0].sender_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pingpalPool.query(
    `UPDATE pingpal.messages
     SET content = '', is_deleted = true, updated_at = NOW()
     WHERE id = $1 AND room_id = $2`,
    [messageId, roomId],
  );

  broadcastToRoom(roomId, { type: "message_deleted", messageId, roomId });

  return NextResponse.json({ success: true });
}
