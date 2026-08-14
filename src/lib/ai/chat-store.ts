import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateId } from "ai";

// Treat chat IDs as opaque tokens before using them in file paths.
const chatIdRegex = /^[A-Za-z0-9_-]+$/;

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]");
  return id;
}

function getChatFile(id: string): string {
  if (!chatIdRegex.test(id)) {
    throw new Error("Invalid chat ID");
  }

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
