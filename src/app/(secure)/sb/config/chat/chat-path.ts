export function chatBasePath(domainSlug: string): string {
  return `/sb/config/chat/${domainSlug}`;
}

export function chatThreadPath(domainSlug: string, chatId: string): string {
  return `${chatBasePath(domainSlug)}/${chatId}`;
}

export function parseChatPathname(pathname: string): {
  domainSlug: string | null;
  chatId: string | null;
} {
  const match = pathname.match(/^\/sb\/config\/chat\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) {
    return { domainSlug: null, chatId: null };
  }
  const [, domainSlug, chatId] = match;
  return { domainSlug: domainSlug ?? null, chatId: chatId ?? null };
}
