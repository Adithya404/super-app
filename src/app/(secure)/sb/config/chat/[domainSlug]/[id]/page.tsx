import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  assertChatOwner,
  ChatAccessDeniedError,
  ChatNotFoundError,
  getChatMeta,
  listActiveDomains,
  loadChat,
  requireDomainBySlug,
  type SabreDomain,
} from "@/lib/ai";
import { chatThreadPath } from "../../chat-path";
import { DomainChatProvider } from "../../domain-chat-context";
import Chat from "../../page-content";

interface DomainChatPageProps {
  params: Promise<{ domainSlug: string; id: string }>;
}

export default async function Page({ params }: DomainChatPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { domainSlug, id } = await params;

  let domain: SabreDomain;
  try {
    domain = await requireDomainBySlug(domainSlug);
  } catch {
    notFound();
  }

  try {
    await assertChatOwner(id, session.user.id);
    const [initialMessages, meta, domains] = await Promise.all([
      loadChat(id),
      getChatMeta(id),
      listActiveDomains(),
    ]);

    if (meta?.domainSlug && meta.domainSlug !== domainSlug) {
      redirect(chatThreadPath(meta.domainSlug, id));
    }

    if (meta && meta.domainId !== domain.domainId) {
      notFound();
    }

    return (
      <DomainChatProvider domain={domain}>
        <Chat
          domain={domain}
          domains={domains}
          chatId={id}
          initialMessages={initialMessages}
          initialTitle={meta?.title ?? null}
        />
      </DomainChatProvider>
    );
  } catch (error) {
    if (error instanceof ChatNotFoundError || error instanceof ChatAccessDeniedError) {
      notFound();
    }

    throw error;
  }
}
