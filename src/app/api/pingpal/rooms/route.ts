import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { verifyChatAccess } from "@/lib/pingpal/permissions";

// GET — list all rooms for the current user (or all rooms if chat_master)
export async function GET() {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pingpalPool.query(
    `SELECT r.*, 
        rm.role, 
        rm.last_read_at,
        (SELECT COUNT(*) FROM pingpal.messages m
         WHERE m.room_id = r.id
           AND m.created_at > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
           AND m.is_deleted = false) AS unread_count,
        (SELECT row_to_json(m) FROM pingpal.messages m
         WHERE m.room_id = r.id
           AND m.is_deleted = false
         ORDER BY m.created_at DESC LIMIT 1) AS last_message
      FROM pingpal.rooms r
      LEFT JOIN pingpal.room_members rm ON rm.room_id = r.id AND rm.user_id = $1
      WHERE ($2::boolean = true OR rm.user_id IS NOT NULL)
      ORDER BY r.updated_at DESC`,
    [session.user.id, isMaster],
  );

  return NextResponse.json({ rooms: rows });
}

// POST — create a group room
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, memberIds } = await req.json();

  const client = await pingpalPool.connect();
  try {
    await client.query("BEGIN");

    // Create room
    const {
      rows: [room],
    } = await client.query(
      `INSERT INTO pingpal.rooms (name, description, type, created_by)
       VALUES ($1, $2, 'group', $3) RETURNING *`,
      [name, description, session.user.id],
    );

    // Add creator as owner
    const allMembers = [session.user.id, ...(memberIds ?? [])];
    for (const userId of allMembers) {
      await client.query(
        `INSERT INTO pingpal.room_members (room_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [room.id, userId, userId === session.user.id ? "owner" : "member"],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating group:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
