import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  assertChatOwner,
  ChatAccessDeniedError,
  ChatNotFoundError,
  getChatMeta,
  loadChat,
} from "@/lib/ai";
import Chat from "../page-content";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ChatPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  try {
    await assertChatOwner(id, session.user.id);
    const [initialMessages, meta] = await Promise.all([loadChat(id), getChatMeta(id)]);
    return (
      <Chat chatId={id} initialMessages={initialMessages} initialTitle={meta?.title ?? null} />
    );
  } catch (error) {
    if (error instanceof ChatNotFoundError || error instanceof ChatAccessDeniedError) {
      notFound();
    }

    throw error;
  }
}
