import { createAgentUIStreamResponse } from "ai";
import { basicAgent, type ChatUIMessage } from "@/lib/ai";

export type { ChatMessageMetadata, ChatUIMessage } from "@/lib/ai";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "@/lib/ai";

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  return createAgentUIStreamResponse({
    agent: basicAgent,
    uiMessages: messages,
    options: {
      requestId: "req_abc",
      escalated: false,
      getWeather: {
        apiKey: "1234567890",
        accountId: "acct_123",
      },
    },
  });
}
