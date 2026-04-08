import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";

// GET — list all rooms for the current user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pingpalPool.query(
    `SELECT r.*, rm.role, rm.last_read_at,
       (SELECT COUNT(*) FROM pingpal.messages m
        WHERE m.room_id = r.id
          AND m.created_at > rm.last_read_at
          AND m.is_deleted = false) AS unread_count,
       (SELECT row_to_json(m) FROM pingpal.messages m
        WHERE m.room_id = r.id
          AND m.is_deleted = false
        ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM pingpal.rooms r
     JOIN pingpal.room_members rm ON rm.room_id = r.id
     WHERE rm.user_id = $1
     ORDER BY r.updated_at DESC`,
    [session.user.id],
  );

  return NextResponse.json({ rooms: rows });
}

// POST — create a group room
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, memberIds } = await req.json();

  // Create room
  const {
    rows: [room],
  } = await pingpalPool.query(
    `INSERT INTO pingpal.rooms (name, description, type, created_by)
     VALUES ($1, $2, 'group', $3) RETURNING *`,
    [name, description, session.user.id],
  );

  // Add creator as owner
  const allMembers = [session.user.id, ...(memberIds ?? [])];
  for (const userId of allMembers) {
    await pingpalPool.query(
      `INSERT INTO pingpal.room_members (room_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [room.id, userId, userId === session.user.id ? "owner" : "member"],
    );
  }

  return NextResponse.json({ room }, { status: 201 });
}
