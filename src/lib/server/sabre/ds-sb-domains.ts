import "server-only";

import { assertValidDomainSlug } from "@/lib/ai/domain";

type DomainRow = {
  _status?: string;
  domainId?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function prepareDomainInsertRow(row: DomainRow): DomainRow {
  const slug = normalizeSlug(row.slug ?? "");
  assertValidDomainSlug(slug);
  const domainId = row.domainId?.trim() || `domain_${slug.replace(/-/g, "_")}`;
  return {
    ...row,
    domainId,
    slug,
    isActive: row.isActive ?? true,
  };
}
