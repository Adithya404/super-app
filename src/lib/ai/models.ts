import { groq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/** Default chat model on Groq (replaces retired llama-3.3-70b-versatile) */
export const CHAT_MODEL_ID = "openai/gpt-oss-120b";

/** Context window size for openai/gpt-oss-120b on Groq */
export const CHAT_MAX_TOKENS = 131_072;

const MODEL_ROLES = {
  "chat-default": () => groq(CHAT_MODEL_ID),
  fast: () => groq("llama-3.1-8b-instant"),
} as const;

export type ModelRole = keyof typeof MODEL_ROLES;

const modelCache = new Map<ModelRole, LanguageModel>();

export function getModelForRole(role: ModelRole): LanguageModel {
  const cached = modelCache.get(role);
  if (cached) {
    return cached;
  }

  const model = MODEL_ROLES[role]();
  modelCache.set(role, model);
  return model;
}
