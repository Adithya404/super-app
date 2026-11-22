import type { SbKnowledgeResources } from "@/lib/common/ds/types/sabre/SbKnowledgeResources";
import { useStore as useBaseStore } from "@/lib/common/store";

export function useStore() {
  return useBaseStore<SbKnowledgeResources>({
    datasourceId: "SbKnowledgeResources",
    page: "sb-knowledge-page",
    alias: "sb-knowledge-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
    sort: [{ field: "createdAt", direction: "DESC" }],
  });
}

export function useDomainsLookupStore() {
  return useBaseStore({
    datasourceId: "SbDomains",
    page: "sb-knowledge-domains-lookup",
    alias: "sb-knowledge-domains",
    limit: 100,
    autoQuery: true,
    sort: [{ field: "name", direction: "ASC" }],
  });
}
