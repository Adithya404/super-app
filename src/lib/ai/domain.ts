/** Client-safe domain types and constants (no database imports). */

export const DEFAULT_DOMAIN_SLUG = "sabre";

const domainSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SabreDomain = {
  domainId: string;
  slug: string;
  name: string;
  description: string | null;
};

export class DomainNotFoundError extends Error {
  constructor(slug: string) {
    super(`Domain not found: ${slug}`);
    this.name = "DomainNotFoundError";
  }
}

export function assertValidDomainSlug(slug: string): void {
  if (!domainSlugRegex.test(slug)) {
    throw new Error("Invalid domain slug");
  }
}
