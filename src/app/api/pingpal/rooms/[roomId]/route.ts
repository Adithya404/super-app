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
    `SELECT r.*, rm.role 
     FROM pingpal.rooms r
     LEFT JOIN pingpal.room_members rm ON rm.room_id = r.id AND rm.user_id = $2
     WHERE r.id = $1`,
    [roomId, session.user.id],
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: rows[0] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await params;
  const { name, description } = await req.json();

  if (!isMaster) {
    const { rows: membership } = await pingpalPool.query(
      `SELECT role FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, session.user.id],
    );
    if (!membership.length || !["owner", "admin"].includes(membership[0].role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { rows: roomRows } = await pingpalPool.query(
    `SELECT type FROM pingpal.rooms WHERE id = $1`,
    [roomId],
  );
  if (!roomRows.length || roomRows[0].type !== "group") {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { rows } = await pingpalPool.query(
    `UPDATE pingpal.rooms
     SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [name?.trim() || null, description?.trim() ?? null, roomId],
  );

  return NextResponse.json({ room: rows[0] });
}
