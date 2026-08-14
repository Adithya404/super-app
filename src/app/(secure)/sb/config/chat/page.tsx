import { createChat } from "@/lib/ai";
import { redirect } from "next/navigation";

export default async function Page() {
  const id = await createChat(); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page, see below
}
