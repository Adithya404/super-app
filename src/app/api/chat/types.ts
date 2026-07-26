import type { LanguageModelUsage, UIMessage } from "ai";

export const CHAT_MODEL_ID = "llama-3.3-70b-versatile";
/** Context window size for llama-3.3-70b-versatile on Groq */
export const CHAT_MAX_TOKENS = 128_000;

export type ChatMessageMetadata = {
  modelId?: string;
  totalUsage?: LanguageModelUsage;
};

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;
