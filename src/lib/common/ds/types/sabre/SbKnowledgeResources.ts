export interface SbKnowledgeResources {
  resourceId: string;
  title?: string | null;
  content: string;
  domainId: string;
  createdBy?: string | null;
  createdAt?: Date | string | null;
  chunkCount?: number;
}
