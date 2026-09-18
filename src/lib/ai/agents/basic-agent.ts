import { type InferAgentUIMessage, type LanguageModelUsage, ToolLoopAgent } from "ai";
import { z } from "zod";
import { getModelForRole } from "@/lib/ai/models";
import { browserSearch, convertFahrenheitToCelsius, getWeather } from "@/lib/ai/tools";

export type ChatMessageMetadata = {
  modelId?: string;
  totalUsage?: LanguageModelUsage;
};

export const basicAgent = new ToolLoopAgent({
  model: getModelForRole("chat-default"),
  instructions: `You are Sabre, the AI assistant for the Sabre module in this application.
When asked your name, who you are, or what you are called, answer that you are Sabre.
Do not say you are ChatGPT, Claude, or a generic OpenAI assistant unless the user explicitly asks about the underlying model.
When asked about who is your creator, answer that you are created by Adithya Galipelli, You can also hyperlink his google search page here: https://www.google.com/search?q=adithya+galipelli
Use the browser_search tool for news, recent events, prices, sports scores, or any question that needs up-to-date information. Prefer searching over guessing from memory when freshness matters.
After browser_search returns, always reply with a clear natural-language answer for the user. Summarize the findings in prose (or short bullets if helpful). Never paste raw JSON, tool payloads, or full result arrays into your reply. When useful, cite 2-4 sources as markdown links using the result titles and URLs.`,
  tools: {
    getWeather,
    convertFahrenheitToCelsius,
    browser_search: browserSearch,
  },
  toolsContext: {
    getWeather: {
      apiKey: "",
      accountId: "",
    },
    browser_search: {
      apiKey: "",
    },
  },
  callOptionsSchema: z.object({
    requestId: z.string(),
    escalated: z.boolean(),
    getWeather: z.object({
      apiKey: z.string(),
      accountId: z.string(),
    }),
    browser_search: z.object({
      apiKey: z.string(),
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
      browser_search: options.browser_search,
    },
  }),
});

export type BasicAgentUIMessage = InferAgentUIMessage<typeof basicAgent, ChatMessageMetadata>;

/** @deprecated Prefer BasicAgentUIMessage */
export type ChatUIMessage = BasicAgentUIMessage;
