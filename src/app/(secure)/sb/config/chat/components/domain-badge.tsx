"use client";

import Link from "next/link";
import type { SabreDomain } from "@/lib/ai/domain";
import { cn } from "@/lib/utils";
import { chatBasePath } from "../chat-path";

interface DomainBadgeProps {
  domain: SabreDomain;
  domains: SabreDomain[];
  className?: string;
}

export function DomainBadge({ domain, domains, className }: DomainBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-4 pt-2 md:px-6", className)}>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">Domain</span>
      <span className="font-medium text-sm">{domain.name}</span>
      {domains.length > 1 ? (
        <nav aria-label="Switch chat domain" className="ml-2 flex flex-wrap gap-1">
          {domains.map((item) => (
            <Link
              key={item.domainId}
              href={chatBasePath(item.slug)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs transition-colors",
                item.domainId === domain.domainId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
