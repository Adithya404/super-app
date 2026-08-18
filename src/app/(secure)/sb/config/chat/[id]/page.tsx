import { loadChat } from "@/lib/ai";
import Chat from "../page-content";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ChatPageProps) {
  const { id } = await params;
  const initialMessages = await loadChat(id);
  return <Chat chatId={id} initialMessages={initialMessages} />;
}
