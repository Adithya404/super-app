import { groq } from "@ai-sdk/groq";
import { type InferAgentUIMessage, type LanguageModelUsage, ToolLoopAgent } from "ai";
import { z } from "zod";
import { CHAT_MODEL_ID } from "@/lib/ai/models";
import { convertFahrenheitToCelsius, getWeather } from "@/lib/ai/tools";

export type ChatMessageMetadata = {
  modelId?: string;
  totalUsage?: LanguageModelUsage;
};

export const basicAgent = new ToolLoopAgent({
  model: groq(CHAT_MODEL_ID),
  instructions: "You are an expert software engineer.",
  tools: {
    getWeather,
    convertFahrenheitToCelsius,
  },
  toolsContext: {
    getWeather: {
      apiKey: "",
      accountId: "",
    },
  },
  callOptionsSchema: z.object({
    requestId: z.string(),
    escalated: z.boolean(),
    getWeather: z.object({
      apiKey: z.string(),
      accountId: z.string(),
    }),
  }),
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    temperature: options.escalated ? 0.1 : settings.temperature,
    runtimeContext: {
      requestId: options.requestId,
      escalated: options.escalated,
    },
    toolsContext: {
      getWeather: options.getWeather,
    },
  }),
});

export type BasicAgentUIMessage = InferAgentUIMessage<typeof basicAgent, ChatMessageMetadata>;

/** @deprecated Prefer BasicAgentUIMessage */
export type ChatUIMessage = BasicAgentUIMessage;
