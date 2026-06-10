import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { verifyChatAccess } from "@/lib/pingpal/permissions";
import { assertChatEligibleUser } from "@/lib/pingpal/users";

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
  // const roomQuery = `SELECT r.*,
  //       rm.role,
  //       rm.last_read_at,
  //       (SELECT COUNT(*) FROM pingpal.messages m
  //        WHERE m.room_id = r.id
  //          AND m.created_at > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
  //          AND m.is_deleted = false) AS unread_count,
  //       (SELECT row_to_json(m) FROM pingpal.messages m
  //        WHERE m.room_id = r.id
  //          AND m.is_deleted = false
  //        ORDER BY m.created_at DESC LIMIT 1) AS last_message
  //     FROM pingpal.rooms r
  //     LEFT JOIN pingpal.room_members rm ON rm.room_id = r.id AND rm.user_id = $1
  //     WHERE ($2::boolean = true OR rm.user_id IS NOT NULL)
  //     ORDER BY r.updated_at DESC`;
  //   const roomQuery = `SELECT
  //     r.*,

  //     CASE
  //         WHEN r.type = 'dm' THEN (
  //             SELECT u.name
  //             FROM pingpal.room_members rm2
  //             JOIN super.users u ON u.id = rm2.user_id
  //             WHERE rm2.room_id = r.id
  //               AND rm2.user_id <> $1
  //             LIMIT 1
  //         )
  //         ELSE r.name
  //     END AS display_name,

  //     rm.role,
  //     rm.last_read_at,

  //     (
  //         SELECT COUNT(*)
  //         FROM pingpal.messages m
  //         WHERE m.room_id = r.id
  //           AND m.created_at > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
  //           AND m.is_deleted = false
  //     ) AS unread_count,

  //     (
  //         SELECT row_to_json(m)
  //         FROM pingpal.messages m
  //         WHERE m.room_id = r.id
  //           AND m.is_deleted = false
  //         ORDER BY m.created_at DESC
  //         LIMIT 1
  //     ) AS last_message

  // FROM pingpal.rooms r
  // LEFT JOIN pingpal.room_members rm
  //     ON rm.room_id = r.id
  //    AND rm.user_id = $1

  // WHERE ($2::boolean = true OR rm.user_id IS NOT NULL)

  // ORDER BY r.updated_at DESC;`;

  const roomQuery = `SELECT
    r.*,
    COALESCE(dm_user.name, r.name) AS display_name,
    COALESCE(dm_user.image, r.avatar_url) AS avatar_url,

    rm.role,
    rm.last_read_at,

    (
        SELECT COUNT(*)
        FROM pingpal.messages m
        WHERE m.room_id = r.id
          AND m.created_at > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
          AND m.is_deleted = false
    ) AS unread_count,

    (
        SELECT row_to_json(m)
        FROM pingpal.messages m
        WHERE m.room_id = r.id
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message

FROM pingpal.rooms r

LEFT JOIN pingpal.room_members rm
    ON rm.room_id = r.id
   AND rm.user_id = $1

LEFT JOIN LATERAL (
    SELECT
        u.id,
        u.name,
        u.image
    FROM pingpal.room_members rm2
    JOIN super.users u
        ON u.id = rm2.user_id
    WHERE r.type = 'dm'
      AND rm2.room_id = r.id
      AND rm2.user_id <> $1
    LIMIT 1
) dm_user ON true

WHERE ($2::boolean = true OR rm.user_id IS NOT NULL)

ORDER BY r.updated_at DESC;`;
  const { rows } = await pingpalPool.query(roomQuery, [session.user.id, isMaster]);

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

    const {
      rows: [room],
    } = await client.query(
      `INSERT INTO pingpal.rooms (name, description, type, created_by)
       VALUES ($1, $2, 'group', $3) RETURNING *`,
      [name, description, session.user.id],
    );

    const allMembers = [...new Set([session.user.id, ...(memberIds ?? [])])];
    for (const userId of allMembers) {
      const eligible = await assertChatEligibleUser(userId, client);
      if (!eligible) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `User ${userId} is not eligible for PingPal chat` },
          { status: 400 },
        );
      }
      await client.query(
        `INSERT INTO pingpal.room_members (room_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (room_id, user_id) DO NOTHING`,
        [room.id, userId, userId === session.user.id ? "owner" : "member"],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ room: { ...room, display_name: room.name } }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating group:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
