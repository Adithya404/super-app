"use server";

import { auth } from "@/auth";
import {
  assertValidChatId,
  type ChatVisibility,
  createChat,
  deleteChat,
  getChatMeta,
  setChatFavorite,
  setChatVisibility,
  updateChatTitle,
} from "@/lib/ai/chat-store";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createChatSession(id: string): Promise<string> {
  const userId = await requireUserId();
  assertValidChatId(id);
  return createChat(id, userId);
}

export async function getChatTitle(chatId: string): Promise<string | null> {
  const userId = await requireUserId();
  assertValidChatId(chatId);
  const meta = await getChatMeta(chatId);
  if (!meta || meta.userId !== userId) {
    return null;
  }
  return meta.title;
}

export async function renameChatSession(chatId: string, title: string): Promise<void> {
  const userId = await requireUserId();
  assertValidChatId(chatId);
  const meta = await getChatMeta(chatId);
  if (!meta || meta.userId !== userId) {
    throw new Error("Chat not found");
  }
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title is required");
  }
  await updateChatTitle(chatId, trimmed.slice(0, 100));
}

export async function toggleChatFavorite(chatId: string, isFavorite: boolean): Promise<void> {
  const userId = await requireUserId();
  assertValidChatId(chatId);
  await setChatFavorite(chatId, userId, isFavorite);
}

export async function setChatSessionVisibility(
  chatId: string,
  visibility: ChatVisibility,
): Promise<void> {
  const userId = await requireUserId();
  assertValidChatId(chatId);
  await setChatVisibility(chatId, userId, visibility);
}

export async function deleteChatSession(chatId: string): Promise<void> {
  const userId = await requireUserId();
  assertValidChatId(chatId);
  await deleteChat(chatId, userId);
}
