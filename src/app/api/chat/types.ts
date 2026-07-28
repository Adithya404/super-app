/**
 * Chat API types — re-exported from `@/lib/ai` so existing imports keep working.
 * Prefer importing from `@/lib/ai` in new code.
 */

export type {
  BasicAgentUIMessage,
  ChatMessageMetadata,
  ChatUIMessage,
} from "@/lib/ai/agents/basic-agent";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "@/lib/ai/models";
