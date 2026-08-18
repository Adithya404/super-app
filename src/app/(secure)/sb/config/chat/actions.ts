"use server";

import { assertValidChatId, createChat } from "@/lib/ai";

export async function createChatSession(id: string): Promise<string> {
  assertValidChatId(id);
  return createChat(id);
}
