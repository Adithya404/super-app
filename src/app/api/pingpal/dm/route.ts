import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { verifyChatAccess } from "@/lib/pingpal/permissions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId } = await req.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  // Calculate dm_pair_key (LEAST(a, b) || '::' || GREATEST(a, b))
  // We can do this directly in SQL for precision.
  const { rows } = await pingpalPool.query(
    `SELECT r.* FROM pingpal.rooms r
     WHERE r.type = 'dm' 
       AND r.dm_pair_key = LEAST($1::text, $2::text) || '::' || GREATEST($1::text, $2::text)
     LIMIT 1`,
    [session.user.id, targetUserId],
  );

  if (rows.length) return NextResponse.json({ room: rows[0] });

  // Create new DM, use Postgres transactions just to be safe
  const client = await pingpalPool.connect();
  try {
    await client.query("BEGIN");

    const {
      rows: [room],
    } = await client.query(
      `INSERT INTO pingpal.rooms (type, created_by, dm_pair_key) 
       VALUES ('dm', $1, LEAST($1::text, $2::text) || '::' || GREATEST($1::text, $2::text)) 
       RETURNING *`,
      [session.user.id, targetUserId],
    );

    for (const userId of [session.user.id, targetUserId]) {
      await client.query(
        `INSERT INTO pingpal.room_members (room_id, user_id, role) VALUES ($1, $2, 'member')`,
        [room.id, userId],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating DM:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
