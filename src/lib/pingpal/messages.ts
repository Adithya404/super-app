import type { Message } from "@/lib/pingpal/types";

export function applyReactionUpdate(
  messages: Message[],
  payload: { messageId: string; userId: string; emoji: string; removed?: boolean },
): Message[] {
  return messages.map((m) => {
    if (m.id !== payload.messageId) return m;

    const reactions = [...(m.reactions ?? [])];
    const idx = reactions.findIndex((r) => r.emoji === payload.emoji);

    if (payload.removed) {
      if (idx === -1) return m;
      const entry = reactions[idx];
      const user_ids = entry.user_ids.filter((id) => id !== payload.userId);
      if (user_ids.length === 0) {
        reactions.splice(idx, 1);
      } else {
        reactions[idx] = { ...entry, count: user_ids.length, user_ids };
      }
    } else if (idx === -1) {
      reactions.push({ emoji: payload.emoji, count: 1, user_ids: [payload.userId] });
    } else {
      const entry = reactions[idx];
      if (!entry.user_ids.includes(payload.userId)) {
        reactions[idx] = {
          ...entry,
          count: entry.count + 1,
          user_ids: [...entry.user_ids, payload.userId],
        };
      }
    }

    return { ...m, reactions };
  });
}

export function getReplyPreview(replyTo: Message["reply_to"]) {
  if (!replyTo) return null;
  if (replyTo.is_deleted) return "Deleted message";
  const preview = replyTo.content?.trim();
  if (!preview) return "Message";
  return preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
}

export function getReplySenderName(
  replyTo: Message["reply_to"],
  senderNames: Record<string, string>,
  currentUserId: string,
  replyToId?: string | null,
  messageSenderIds?: Record<string, string>,
) {
  const senderId =
    replyTo?.sender_id ??
    (replyTo?.id ? messageSenderIds?.[replyTo.id] : undefined) ??
    (replyToId ? messageSenderIds?.[replyToId] : undefined);

  if (!senderId) return "Unknown";
  if (senderId === currentUserId) return "Me";
  return senderNames[senderId] ?? "Unknown";
}
