import { createAgentUIStreamResponse } from "ai";
import { basicAgent, type ChatUIMessage } from "@/lib/ai";
import { assertValidChatId, saveChat } from "@/lib/ai/chat-store";

export type { ChatMessageMetadata, ChatUIMessage } from "@/lib/ai";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "@/lib/ai";

export async function POST(req: Request) {
  const { id, messages }: { id?: string; messages?: ChatUIMessage[] } = await req.json();

  if (!id || !messages) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    assertValidChatId(id);
  } catch {
    return new Response("Invalid chat ID", { status: 400 });
  }

  return createAgentUIStreamResponse({
    agent: basicAgent,
    uiMessages: messages,
    originalMessages: messages,
    options: {
      requestId: id,
      escalated: false,
      getWeather: {
        apiKey: "1234567890",
        accountId: "acct_123",
      },
    },
    onFinish: ({ messages: finalMessages }) => {
      void saveChat({ chatId: id, messages: finalMessages });
    },
  });
}
