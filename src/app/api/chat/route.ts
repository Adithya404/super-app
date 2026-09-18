import { createAgentUIStreamResponse, generateId } from "ai";
import { auth } from "@/auth";
import { basicAgent, type ChatUIMessage } from "@/lib/ai";
import { postChatRequestSchema } from "@/lib/ai/chat-schema";
import {
  assertChatOwner,
  assertValidChatId,
  ChatAccessDeniedError,
  ChatNotFoundError,
  getChatMeta,
  loadChat,
  saveChat,
  updateChatTitle,
} from "@/lib/ai/chat-store";
import {
  fallbackTitleFromPrompt,
  generateTitleFromUserMessage,
} from "@/lib/ai/generate-chat-title";

export type { ChatMessageMetadata, ChatUIMessage } from "@/lib/ai";
export { CHAT_MAX_TOKENS, CHAT_MODEL_ID } from "@/lib/ai";

function extractTextFromParts(parts: ChatUIMessage["parts"]): string {
  return parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

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

  const meta = await getChatMeta(id);
  const needsTitle = !meta?.title;
  const incomingText = extractTextFromParts(message.parts as ChatUIMessage["parts"]);

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
    generateMessageId: generateId,
    options: {
      requestId: id,
      escalated: false,
      getWeather: {
        apiKey: "1234567890",
        accountId: "acct_123",
      },
    },
    onFinish: async ({ messages: finalMessages }) => {
      await saveChat({ chatId: id, messages: finalMessages });

      if (needsTitle && incomingText) {
        const title =
          (await generateTitleFromUserMessage(incomingText)) ||
          fallbackTitleFromPrompt(incomingText);
        await updateChatTitle(id, title);
      }
    },
  });
}
