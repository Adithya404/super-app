import { mutate } from "swr";

export const CHAT_HISTORY_PAGE_SIZE = 20;
export const CHAT_HISTORY_KEY_PREFIX = "/api/chat/history";

export function chatHistoryPageUrl(options?: {
  domainSlug?: string;
  endingBefore?: string;
}): string {
  const params = new URLSearchParams({
    limit: String(CHAT_HISTORY_PAGE_SIZE),
  });
  if (options?.domainSlug) {
    params.set("domain", options.domainSlug);
  }
  if (options?.endingBefore) {
    params.set("ending_before", options.endingBefore);
  }
  return `${CHAT_HISTORY_KEY_PREFIX}?${params.toString()}`;
}

export function revalidateChatHistory() {
  return mutate(
    (key) => typeof key === "string" && key.startsWith(CHAT_HISTORY_KEY_PREFIX),
    undefined,
    { revalidate: true },
  );
}
