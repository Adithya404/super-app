import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertChatOwner, ChatAccessDeniedError, ChatNotFoundError, loadChat } from "@/lib/ai";
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
    const initialMessages = await loadChat(id);
    return <Chat chatId={id} initialMessages={initialMessages} />;
  } catch (error) {
    if (error instanceof ChatNotFoundError || error instanceof ChatAccessDeniedError) {
      notFound();
    }

    throw error;
  }
}
