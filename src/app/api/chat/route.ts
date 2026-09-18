import { createAgentUIStreamResponse } from "ai";
import { auth } from "@/auth";
import { basicAgent, type ChatUIMessage } from "@/lib/ai";
import { postChatRequestSchema } from "@/lib/ai/chat-schema";
import {
  assertChatOwner,
  assertValidChatId,
  ChatAccessDeniedError,
  ChatNotFoundError,
  loadChat,
  saveChat,
} from "@/lib/ai/chat-store";

export type { ChatMessageMetadata, ChatUIMessage } from "@/lib/ai";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = postChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const { id, message } = parsed.data;

  try {
    assertValidChatId(id);
    await assertChatOwner(id, session.user.id);
  } catch (error) {
    if (error instanceof ChatNotFoundError) {
      return new Response("Chat not found", { status: 404 });
    }
    if (error instanceof ChatAccessDeniedError) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("Invalid chat ID", { status: 400 });
  }

  let history: ChatUIMessage[];
  try {
    history = await loadChat(id);
  } catch (error) {
    if (error instanceof ChatNotFoundError) {
      return new Response("Chat not found", { status: 404 });
    }
    throw error;
  }

  const incomingMessage: ChatUIMessage = {
    id: message.id,
    role: message.role,
    parts: message.parts as ChatUIMessage["parts"],
  };

  const uiMessages: ChatUIMessage[] = [...history, incomingMessage];

  return createAgentUIStreamResponse({
    agent: basicAgent,
    uiMessages,
    originalMessages: uiMessages,
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
