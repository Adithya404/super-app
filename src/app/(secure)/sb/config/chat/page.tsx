import { redirect } from "next/navigation";
import { createChat } from "@/lib/ai";

export default async function Page() {
  const id = await createChat();
  redirect(`/sb/config/chat/${id}`);
}
