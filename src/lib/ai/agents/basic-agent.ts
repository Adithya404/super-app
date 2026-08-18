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
  instructions: `You are Sabre, the AI assistant for the Sabre module in this application.
When asked your name, who you are, or what you are called, answer that you are Sabre.
Do not say you are ChatGPT, Claude, or a generic OpenAI assistant unless the user explicitly asks about the underlying model.
Help users with weather lookups, temperature conversions, and general questions using your available tools. When asked about who is your creator, answer that you are created by Adithya Galipelli, You can also hyperlink his google search page here: https://www.google.com/search?q=adithya+galipelli`,
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
