import "server-only";

import { assertValidDomainSlug, DomainNotFoundError, type SabreDomain } from "@/lib/ai/domain";
import { sabrePool } from "@/lib/db";

export { assertValidDomainSlug, DomainNotFoundError, type SabreDomain } from "@/lib/ai/domain";

export async function getDomainBySlug(slug: string): Promise<SabreDomain | null> {
  assertValidDomainSlug(slug);

  const { rows } = await sabrePool.query<{
    domain_id: string;
    slug: string;
    name: string;
    description: string | null;
  }>(
    `SELECT domain_id, slug, name, description
     FROM sb_domain
     WHERE slug = $1 AND is_active = true`,
    [slug],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    domainId: row.domain_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  };
}

export async function getDomainById(domainId: string): Promise<SabreDomain | null> {
  const { rows } = await sabrePool.query<{
    domain_id: string;
    slug: string;
    name: string;
    description: string | null;
  }>(
    `SELECT domain_id, slug, name, description
     FROM sb_domain
     WHERE domain_id = $1 AND is_active = true`,
    [domainId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    domainId: row.domain_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  };
}

export async function listActiveDomains(): Promise<SabreDomain[]> {
  const { rows } = await sabrePool.query<{
    domain_id: string;
    slug: string;
    name: string;
    description: string | null;
  }>(
    `SELECT domain_id, slug, name, description
     FROM sb_domain
     WHERE is_active = true
     ORDER BY name`,
  );

  return rows.map((row) => ({
    domainId: row.domain_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  }));
}

export async function requireDomainBySlug(slug: string): Promise<SabreDomain> {
  const domain = await getDomainBySlug(slug);
  if (!domain) {
    throw new DomainNotFoundError(slug);
  }
  return domain;
}
