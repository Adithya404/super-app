import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();

  // Check if DM already exists between these two users
  const { rows } = await pingpalPool.query(
    `SELECT r.* FROM pingpal.rooms r
     JOIN pingpal.room_members rm1 ON rm1.room_id = r.id AND rm1.user_id = $1
     JOIN pingpal.room_members rm2 ON rm2.room_id = r.id AND rm2.user_id = $2
     WHERE r.type = 'dm'
     LIMIT 1`,
    [session.user.id, targetUserId],
  );

  if (rows.length) return NextResponse.json({ room: rows[0] });

  // Create new DM
  const {
    rows: [room],
  } = await pingpalPool.query(
    `INSERT INTO pingpal.rooms (type, created_by) VALUES ('dm', $1) RETURNING *`,
    [session.user.id],
  );

  for (const userId of [session.user.id, targetUserId]) {
    await pingpalPool.query(
      `INSERT INTO pingpal.room_members (room_id, user_id, role) VALUES ($1, $2, 'member')`,
      [room.id, userId],
    );
  }

  return NextResponse.json({ room }, { status: 201 });
}
