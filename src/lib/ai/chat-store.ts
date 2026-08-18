import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateId } from "ai";
import type { ChatUIMessage } from "@/lib/ai/agents/basic-agent";

// Treat chat IDs as opaque tokens before using them in file paths.
const chatIdRegex = /^[A-Za-z0-9_-]+$/;

export class ChatNotFoundError extends Error {
  constructor(id: string) {
    super(`Chat not found: ${id}`);
    this.name = "ChatNotFoundError";
  }
}

export function assertValidChatId(id: string): void {
  if (!chatIdRegex.test(id)) {
    throw new Error("Invalid chat ID");
  }
}

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]");
  return id;
}

function getChatFile(id: string): string {
  assertValidChatId(id);

  const chatDir = path.resolve(process.cwd(), ".chats");
  const chatFile = path.resolve(chatDir, `${id}.json`);

  // Defense in depth: keep the resolved file inside the chat directory.
  if (!chatFile.startsWith(`${chatDir}${path.sep}`)) {
    throw new Error("Invalid chat ID");
  }

  if (!existsSync(chatDir)) {
    mkdirSync(chatDir, { recursive: true });
  }

  return chatFile;
}

export async function loadChat(id: string): Promise<ChatUIMessage[]> {
  try {
    const content = await readFile(getChatFile(id), "utf8");
    const parsed: unknown = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid chat file format");
    }

    return parsed as ChatUIMessage[];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new ChatNotFoundError(id);
    }

    throw error;
  }
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: ChatUIMessage[];
}): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}
