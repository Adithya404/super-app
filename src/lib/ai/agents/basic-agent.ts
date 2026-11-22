import { type InferAgentUIMessage, type LanguageModelUsage, ToolLoopAgent } from "ai";
import { z } from "zod";
import { getModelForRole } from "@/lib/ai/models";
import {
  browserSearch,
  convertFahrenheitToCelsius,
  getWeather,
  searchKnowledge,
} from "@/lib/ai/tools";

export type ChatMessageMetadata = {
  modelId?: string;
  totalUsage?: LanguageModelUsage;
};

/** Tools the model may call. Weather tools stay registered but disabled here. */
const ACTIVE_AGENT_TOOLS = ["browser_search", "search_knowledge"] as const;

export const basicAgent = new ToolLoopAgent({
  model: getModelForRole("chat-default"),
  instructions: `You are Sabre, the AI assistant for the Sabre module in this application.
When asked your name, who you are, or what you are called, answer that you are Sabre.
Do not say you are ChatGPT, Claude, or a generic OpenAI assistant unless the user explicitly asks about the underlying model.
When asked about who is your creator, answer that you are created by Adithya Galipelli, You can also hyperlink his google search page here: https://www.google.com/search?q=adithya+galipelli
Use search_knowledge for facts in this chat domain's knowledge base before guessing. Never assume another domain's content applies.
Use the browser_search tool for news, recent events, prices, sports scores, or any question that needs up-to-date public web information. Prefer searching over guessing from memory when freshness matters.
If search_knowledge returns nothing useful, say you don't know rather than inventing details. You may still use browser_search when the question is about public/live information.
After a tool returns, always reply with a clear natural-language answer for the user. Summarize the findings in prose (or short bullets if helpful). Never paste raw JSON, tool payloads, or full result arrays into your reply. When useful, cite 2-4 sources as markdown links using the result titles and URLs.`,
  tools: {
    getWeather,
    convertFahrenheitToCelsius,
    browser_search: browserSearch,
    search_knowledge: searchKnowledge,
  },
  activeTools: [...ACTIVE_AGENT_TOOLS],
  toolsContext: {
    getWeather: {
      apiKey: "",
      accountId: "",
    },
    browser_search: {
      apiKey: "",
    },
    search_knowledge: {
      domainId: "",
    },
  },
  callOptionsSchema: z.object({
    requestId: z.string(),
    escalated: z.boolean(),
    domainId: z.string().min(1),
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
      domainId: options.domainId,
    },
    toolsContext: {
      getWeather: options.getWeather,
      browser_search: options.browser_search,
      search_knowledge: {
        domainId: options.domainId,
      },
    },
  }),
});

export type BasicAgentUIMessage = InferAgentUIMessage<typeof basicAgent, ChatMessageMetadata>;

/** @deprecated Prefer BasicAgentUIMessage */
export type ChatUIMessage = BasicAgentUIMessage;
