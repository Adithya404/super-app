export interface SbDomains {
  domainId: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: Date | string | null;
}
