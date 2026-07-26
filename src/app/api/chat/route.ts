import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
} from "ai";
import { z } from "zod";
import { CHAT_MODEL_ID, type ChatUIMessage } from "./types";

export type { ChatMessageMetadata, ChatUIMessage } from "./types";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "./types";

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  const result = streamText({
    // model: groq("openai/gpt-oss-20b"),
    model: groq(CHAT_MODEL_ID),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      weather: tool({
        description: "Get the weather in a location (fahrenheit)",
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: "Convert a temperature in fahrenheit to celsius",
        inputSchema: z.object({
          temperature: z.number().describe("The temperature in fahrenheit to convert"),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
      // browser_search: groq.tools.browserSearch({}),
    },
    toolChoice: "auto",
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            modelId: `groq:${CHAT_MODEL_ID}`,
            totalUsage: part.totalUsage,
          };
        }
      },
    }),
  });
}
