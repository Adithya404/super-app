/* Copyright (c) 2024-present ... */

export interface SbKnowledgeResource {
  resourceId: string;
  title: string;
  content: string;
  domainId: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  chunkCount?: number;
}
