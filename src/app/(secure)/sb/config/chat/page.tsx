import { redirect } from "next/navigation";
import { DEFAULT_DOMAIN_SLUG } from "@/lib/ai/domain";
import { chatBasePath } from "./chat-path";

export default function Page() {
  redirect(chatBasePath(DEFAULT_DOMAIN_SLUG));
}
