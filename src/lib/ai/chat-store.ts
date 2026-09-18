import { generateId } from "ai";
import type { ChatUIMessage } from "@/lib/ai/agents/basic-agent";
import { sabrePool } from "@/lib/db";

const chatIdRegex = /^[A-Za-z0-9_-]+$/;

export const CHAT_HISTORY_PAGE_SIZE = 20;

export type ChatVisibility = "private" | "public";

export type ChatListItem = {
  chatId: string;
  title: string | null;
  updatedAt: string;
  isFavorite: boolean;
  visibility: ChatVisibility;
};

export type ChatMeta = {
  chatId: string;
  title: string | null;
  updatedAt: string;
  isFavorite: boolean;
  visibility: ChatVisibility;
  userId: string;
};

export class ChatNotFoundError extends Error {
  constructor(id: string) {
    super(`Chat not found: ${id}`);
    this.name = "ChatNotFoundError";
  }
}

export class ChatAccessDeniedError extends Error {
  constructor(id: string) {
    super(`Access denied for chat: ${id}`);
    this.name = "ChatAccessDeniedError";
  }
}

export function assertValidChatId(id: string): void {
  if (!chatIdRegex.test(id)) {
    throw new Error("Invalid chat ID");
  }
}

export async function createChat(chatId: string, userId: string): Promise<string> {
  assertValidChatId(chatId);

  await sabrePool.query(
    `INSERT INTO sb_chat (chat_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (chat_id) DO NOTHING`,
    [chatId, userId],
  );

  return chatId;
}

export async function getChatOwner(chatId: string): Promise<string | null> {
  assertValidChatId(chatId);

  const { rows } = await sabrePool.query<{ user_id: string }>(
    "SELECT user_id FROM sb_chat WHERE chat_id = $1",
    [chatId],
  );

  return rows[0]?.user_id ?? null;
}

export async function assertChatOwner(chatId: string, userId: string): Promise<void> {
  const owner = await getChatOwner(chatId);

  if (!owner) {
    throw new ChatNotFoundError(chatId);
  }

  if (owner !== userId) {
    throw new ChatAccessDeniedError(chatId);
  }
}

export async function getChatMeta(chatId: string): Promise<ChatMeta | null> {
  assertValidChatId(chatId);

  const { rows } = await sabrePool.query<{
    chat_id: string;
    user_id: string;
    title: string | null;
    updated_at: Date;
    is_favorite: boolean;
    visibility: string;
  }>(
    `SELECT chat_id, user_id, title, updated_at, is_favorite, visibility
     FROM sb_chat
     WHERE chat_id = $1`,
    [chatId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    chatId: row.chat_id,
    userId: row.user_id,
    title: row.title,
    updatedAt: row.updated_at.toISOString(),
    isFavorite: row.is_favorite,
    visibility: row.visibility === "public" ? "public" : "private",
  };
}

export async function listChats({
  userId,
  limit = CHAT_HISTORY_PAGE_SIZE,
  endingBefore,
}: {
  userId: string;
  limit?: number;
  endingBefore?: string;
}): Promise<{ chats: ChatListItem[]; hasMore: boolean }> {
  const pageSize = Math.max(1, Math.min(limit, 100));
  const fetchLimit = pageSize + 1;

  let rows: Array<{
    chat_id: string;
    title: string | null;
    updated_at: Date;
    is_favorite: boolean;
    visibility: string;
  }>;

  if (endingBefore) {
    assertValidChatId(endingBefore);

    const cursor = await sabrePool.query<{ updated_at: Date; chat_id: string }>(
      `SELECT updated_at, chat_id FROM sb_chat WHERE chat_id = $1 AND user_id = $2`,
      [endingBefore, userId],
    );

    const cursorRow = cursor.rows[0];
    if (!cursorRow) {
      return { chats: [], hasMore: false };
    }

    const result = await sabrePool.query<{
      chat_id: string;
      title: string | null;
      updated_at: Date;
      is_favorite: boolean;
      visibility: string;
    }>(
      `SELECT chat_id, title, updated_at, is_favorite, visibility
       FROM sb_chat
       WHERE user_id = $1
         AND (updated_at, chat_id) < ($2::timestamptz, $3::text)
       ORDER BY updated_at DESC, chat_id DESC
       LIMIT $4`,
      [userId, cursorRow.updated_at, cursorRow.chat_id, fetchLimit],
    );
    rows = result.rows;
  } else {
    const result = await sabrePool.query<{
      chat_id: string;
      title: string | null;
      updated_at: Date;
      is_favorite: boolean;
      visibility: string;
    }>(
      `SELECT chat_id, title, updated_at, is_favorite, visibility
       FROM sb_chat
       WHERE user_id = $1
       ORDER BY updated_at DESC, chat_id DESC
       LIMIT $2`,
      [userId, fetchLimit],
    );
    rows = result.rows;
  }

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    hasMore,
    chats: page.map((row) => ({
      chatId: row.chat_id,
      title: row.title,
      updatedAt: row.updated_at.toISOString(),
      isFavorite: row.is_favorite,
      visibility: row.visibility === "public" ? "public" : "private",
    })),
  };
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  assertValidChatId(chatId);

  const result = await sabrePool.query(
    `UPDATE sb_chat SET title = $1, updated_at = NOW() WHERE chat_id = $2`,
    [title, chatId],
  );

  if (result.rowCount === 0) {
    throw new ChatNotFoundError(chatId);
  }
}

export async function setChatFavorite(
  chatId: string,
  userId: string,
  isFavorite: boolean,
): Promise<void> {
  await assertChatOwner(chatId, userId);

  await sabrePool.query(`UPDATE sb_chat SET is_favorite = $1 WHERE chat_id = $2 AND user_id = $3`, [
    isFavorite,
    chatId,
    userId,
  ]);
}

export async function setChatVisibility(
  chatId: string,
  userId: string,
  visibility: ChatVisibility,
): Promise<void> {
  await assertChatOwner(chatId, userId);

  await sabrePool.query(`UPDATE sb_chat SET visibility = $1 WHERE chat_id = $2 AND user_id = $3`, [
    visibility,
    chatId,
    userId,
  ]);
}

export async function deleteChat(chatId: string, userId: string): Promise<void> {
  await assertChatOwner(chatId, userId);

  const client = await sabrePool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM sb_chat_message WHERE chat_id = $1", [chatId]);
    await client.query("DELETE FROM sb_chat WHERE chat_id = $1 AND user_id = $2", [chatId, userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loadChat(chatId: string): Promise<ChatUIMessage[]> {
  assertValidChatId(chatId);

  const chatResult = await sabrePool.query("SELECT chat_id FROM sb_chat WHERE chat_id = $1", [
    chatId,
  ]);

  if (chatResult.rowCount === 0) {
    throw new ChatNotFoundError(chatId);
  }

  const { rows } = await sabrePool.query<{
    message_id: string;
    role: string;
    parts: ChatUIMessage["parts"];
    metadata: ChatUIMessage["metadata"] | null;
  }>(
    `SELECT message_id, role, parts, metadata
     FROM sb_chat_message
     WHERE chat_id = $1
     ORDER BY created_at ASC`,
    [chatId],
  );

  return rows.map((row) => ({
    id: row.message_id,
    role: row.role as ChatUIMessage["role"],
    parts: row.parts,
    ...(row.metadata ? { metadata: row.metadata } : {}),
  }));
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: ChatUIMessage[];
}): Promise<void> {
  assertValidChatId(chatId);

  const client = await sabrePool.connect();

  try {
    await client.query("BEGIN");

    await client.query("UPDATE sb_chat SET updated_at = NOW() WHERE chat_id = $1", [chatId]);

    for (const message of messages) {
      const messageId = message.id?.trim() ? message.id : generateId();

      await client.query(
        `INSERT INTO sb_chat_message (message_id, chat_id, role, parts, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (message_id) DO UPDATE
         SET chat_id = EXCLUDED.chat_id,
             role = EXCLUDED.role,
             parts = EXCLUDED.parts,
             metadata = EXCLUDED.metadata`,
        [
          messageId,
          chatId,
          message.role,
          JSON.stringify(message.parts),
          message.metadata ? JSON.stringify(message.metadata) : null,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
