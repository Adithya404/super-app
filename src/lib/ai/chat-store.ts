import type { ChatUIMessage } from "@/lib/ai/agents/basic-agent";
import { sabrePool } from "@/lib/db";

const chatIdRegex = /^[A-Za-z0-9_-]+$/;

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
      await client.query(
        `INSERT INTO sb_chat_message (message_id, chat_id, role, parts, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (message_id) DO UPDATE
         SET role = EXCLUDED.role,
             parts = EXCLUDED.parts,
             metadata = EXCLUDED.metadata`,
        [
          message.id,
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
