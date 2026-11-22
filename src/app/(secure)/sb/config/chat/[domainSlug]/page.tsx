import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  assertChatOwner,
  ChatAccessDeniedError,
  ChatNotFoundError,
  DEFAULT_DOMAIN_SLUG,
  getChatMeta,
  getDomainBySlug,
  listActiveDomains,
} from "@/lib/ai";
import { chatThreadPath } from "../chat-path";
import { DomainChatProvider } from "../domain-chat-context";
import Chat from "../page-content";

interface NewDomainChatPageProps {
  params: Promise<{ domainSlug: string }>;
}

export default async function Page({ params }: NewDomainChatPageProps) {
  const { domainSlug } = await params;
  const domain = await getDomainBySlug(domainSlug);

  if (domain) {
    const domains = await listActiveDomains();
    return (
      <DomainChatProvider domain={domain}>
        <Chat domain={domain} domains={domains} isNewChat />
      </DomainChatProvider>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  try {
    await assertChatOwner(domainSlug, session.user.id);
    const meta = await getChatMeta(domainSlug);
    const slug = meta?.domainSlug ?? DEFAULT_DOMAIN_SLUG;
    redirect(chatThreadPath(slug, domainSlug));
  } catch (error) {
    if (error instanceof ChatNotFoundError || error instanceof ChatAccessDeniedError) {
      notFound();
    }
    throw error;
  }
}
