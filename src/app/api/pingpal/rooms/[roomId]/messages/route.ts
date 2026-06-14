import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import {
  MESSAGES_PAGE_SIZE,
  UNREAD_CONTEXT_AFTER,
  UNREAD_CONTEXT_BEFORE,
} from "@/lib/pingpal/constants";
import { MESSAGE_SELECT } from "@/lib/pingpal/message-query";
import { verifyChatAccess } from "@/lib/pingpal/permissions";

async function verifyRoomAccess(roomId: string, userId: string, isMaster: boolean) {
  if (!isMaster) {
    const { rows: membership } = await pingpalPool.query(
      `SELECT 1 FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId],
    );
    if (!membership.length) return false;
  }
  return true;
}

async function getReadMeta(roomId: string, userId: string) {
  const { rows } = await pingpalPool.query(
    `SELECT rm.last_read_at,
            (
              SELECT m.id
              FROM pingpal.messages m
              WHERE m.room_id = $1
                AND m.created_at > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
                AND m.is_deleted = false
              ORDER BY m.created_at ASC
              LIMIT 1
            ) AS first_unread_message_id
     FROM pingpal.room_members rm
     WHERE rm.room_id = $1 AND rm.user_id = $2`,
    [roomId, userId],
  );
  return {
    lastReadAt: rows[0]?.last_read_at ?? null,
    firstUnreadMessageId: rows[0]?.first_unread_message_id ?? null,
  };
}

async function resolveFirstUnreadFromCount(roomId: string, unreadCount: number) {
  if (unreadCount <= 0) return null;
  const { rows } = await pingpalPool.query(
    `SELECT id FROM pingpal.messages
     WHERE room_id = $1 AND is_deleted = false
     ORDER BY created_at DESC
     OFFSET $2
     LIMIT 1`,
    [roomId, unreadCount - 1],
  );
  return rows[0]?.id ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess, isMaster } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await params;
  const allowed = await verifyRoomAccess(roomId, session.user.id, isMaster);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const after = searchParams.get("after");
  const aroundUnread = searchParams.get("aroundUnread") === "true";
  const unreadCountParam = Number.parseInt(searchParams.get("unreadCount") ?? "0", 10) || 0;
  const limit = Math.min(
    Number.parseInt(searchParams.get("limit") ?? String(MESSAGES_PAGE_SIZE), 10) ||
      MESSAGES_PAGE_SIZE,
    100,
  );

  const { lastReadAt, firstUnreadMessageId: dbFirstUnread } = await getReadMeta(
    roomId,
    session.user.id,
  );

  let firstUnreadMessageId = dbFirstUnread;
  if (!firstUnreadMessageId && unreadCountParam > 0) {
    firstUnreadMessageId = await resolveFirstUnreadFromCount(roomId, unreadCountParam);
  }

  let rows: Record<string, unknown>[] = [];
  let hasMore = false;
  let hasMoreNewer = false;

  if (before) {
    const { rows: older } = await pingpalPool.query(
      `${MESSAGE_SELECT}
       WHERE m.room_id = $1
         AND m.created_at < (SELECT created_at FROM pingpal.messages WHERE id = $2)
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [roomId, before, limit + 1],
    );

    hasMore = older.length > limit;
    rows = (hasMore ? older.slice(0, limit) : older).reverse();
  } else if (after) {
    const { rows: newer } = await pingpalPool.query(
      `${MESSAGE_SELECT}
       WHERE m.room_id = $1
         AND m.created_at > (SELECT created_at FROM pingpal.messages WHERE id = $2)
       ORDER BY m.created_at ASC
       LIMIT $3`,
      [roomId, after, limit + 1],
    );

    hasMoreNewer = newer.length > limit;
    rows = hasMoreNewer ? newer.slice(0, limit) : newer;
  } else if (aroundUnread && firstUnreadMessageId) {
    const { rows: windowRows } = await pingpalPool.query(
      `${MESSAGE_SELECT}
       WHERE m.room_id = $1
         AND m.created_at >= COALESCE(
           (
             SELECT sub.created_at
             FROM (
               SELECT msg.created_at
               FROM pingpal.messages msg
               WHERE msg.room_id = $1
                 AND msg.created_at <= (
                   SELECT fu.created_at FROM pingpal.messages fu WHERE fu.id = $2
                 )
                 AND msg.is_deleted = false
               ORDER BY msg.created_at DESC
               OFFSET $3
               LIMIT 1
             ) sub
           ),
           (SELECT fu.created_at FROM pingpal.messages fu WHERE fu.id = $2)
         )
         AND m.created_at <= COALESCE(
           (
             SELECT sub.created_at
             FROM (
               SELECT msg.created_at
               FROM pingpal.messages msg
               WHERE msg.room_id = $1
                 AND msg.created_at >= (
                   SELECT fu.created_at FROM pingpal.messages fu WHERE fu.id = $2
                 )
                 AND msg.is_deleted = false
               ORDER BY msg.created_at ASC
               OFFSET $4
               LIMIT 1
             ) sub
           ),
           (SELECT MAX(msg.created_at) FROM pingpal.messages msg WHERE msg.room_id = $1 AND msg.is_deleted = false)
         )
       ORDER BY m.created_at ASC`,
      [roomId, firstUnreadMessageId, UNREAD_CONTEXT_BEFORE, UNREAD_CONTEXT_AFTER],
    );
    rows = windowRows;

    if (rows.length > 0) {
      const oldest = rows[0] as { created_at: string };
      const newest = rows[rows.length - 1] as { created_at: string };

      const { rows: olderCount } = await pingpalPool.query(
        `SELECT COUNT(*)::int AS cnt FROM pingpal.messages m
         WHERE m.room_id = $1 AND m.created_at < $2 AND m.is_deleted = false`,
        [roomId, oldest.created_at],
      );
      const { rows: newerCount } = await pingpalPool.query(
        `SELECT COUNT(*)::int AS cnt FROM pingpal.messages m
         WHERE m.room_id = $1 AND m.created_at > $2 AND m.is_deleted = false`,
        [roomId, newest.created_at],
      );
      hasMore = (olderCount[0]?.cnt ?? 0) > 0;
      hasMoreNewer = (newerCount[0]?.cnt ?? 0) > 0;
    }
  } else {
    const { rows: latest } = await pingpalPool.query(
      `${MESSAGE_SELECT}
       WHERE m.room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [roomId, limit + 1],
    );

    hasMore = latest.length > limit;
    rows = (hasMore ? latest.slice(0, limit) : latest).reverse();
    hasMoreNewer = false;
  }

  return NextResponse.json({
    messages: rows,
    hasMore,
    hasMoreNewer,
    lastReadAt,
    firstUnreadMessageId,
  });
}
