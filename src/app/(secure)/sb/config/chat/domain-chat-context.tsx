"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { SabreDomain } from "@/lib/ai/domain";

const DomainChatContext = createContext<SabreDomain | null>(null);

export function DomainChatProvider({
  domain,
  children,
}: {
  domain: SabreDomain;
  children: ReactNode;
}) {
  return <DomainChatContext.Provider value={domain}>{children}</DomainChatContext.Provider>;
}

export function useDomainChat(): SabreDomain {
  const value = useContext(DomainChatContext);
  if (!value) {
    throw new Error("useDomainChat must be used within DomainChatProvider");
  }
  return value;
}

export function useDomainChatOptional(): SabreDomain | null {
  return useContext(DomainChatContext);
}
