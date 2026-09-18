"use server";

import { auth } from "@/auth";
import { assertValidChatId, createChat } from "@/lib/ai";

export async function createChatSession(id: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  assertValidChatId(id);
  return createChat(id, session.user.id);
}
