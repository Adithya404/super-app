import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { requireOwnerOrAdmin, verifyChatAccess } from "@/lib/pingpal/permissions";
import { assertChatEligibleUser } from "@/lib/pingpal/users";
import { broadcastToRoom } from "@/lib/websocket/server";

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

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await params;
  const { userIds } = await req.json();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds required" }, { status: 400 });
  }

  try {
    await requireOwnerOrAdmin(session.user.id, session.user.email, roomId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await pingpalPool.connect();
  try {
    await client.query("BEGIN");

    const added: string[] = [];
    for (const userId of [...new Set(userIds as string[])]) {
      const eligible = await assertChatEligibleUser(userId, client);
      if (!eligible) continue;

      const result = await client.query(
        `INSERT INTO pingpal.room_members (room_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (room_id, user_id) DO NOTHING
         RETURNING user_id`,
        [roomId, userId],
      );
      if (result.rowCount) added.push(userId);
    }

    if (added.length) {
      const { rows: actor } = await client.query(
        `SELECT name, email FROM super.users WHERE id = $1`,
        [session.user.id],
      );
      const actorName = actor[0]?.name ?? actor[0]?.email ?? "Someone";
      await client.query(
        `INSERT INTO pingpal.messages (room_id, sender_id, content, type)
         VALUES ($1, $2, $3, 'system')`,
        [roomId, session.user.id, `${actorName} added ${added.length} member(s) to the group`],
      );
      await client.query(`UPDATE pingpal.rooms SET updated_at = NOW() WHERE id = $1`, [roomId]);
    }

    await client.query("COMMIT");

    if (added.length) {
      broadcastToRoom(roomId, { type: "member_added", roomId, userIds: added });
    }

    return NextResponse.json({ added });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add members error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId") ?? session.user.id;
  const isSelfLeave = targetUserId === session.user.id;

  if (!isSelfLeave) {
    try {
      await requireOwnerOrAdmin(session.user.id, session.user.email, roomId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { rows: membership } = await pingpalPool.query(
    `SELECT role FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, targetUserId],
  );
  if (!membership.length) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 });
  }

  if (membership[0].role === "owner" && isSelfLeave) {
    return NextResponse.json({ error: "Owner cannot leave the group" }, { status: 400 });
  }

  await pingpalPool.query(`DELETE FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`, [
    roomId,
    targetUserId,
  ]);

  broadcastToRoom(roomId, { type: "member_removed", roomId, userId: targetUserId });

  return NextResponse.json({ success: true });
}
