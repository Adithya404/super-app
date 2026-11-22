import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";
import { useStore as useBaseStore } from "@/lib/common/store";

export function useStore() {
  return useBaseStore<SbDomains>({
    datasourceId: "SbDomains",
    page: "sb-domains-page",
    alias: "sb-domains-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
    sort: [{ field: "name", direction: "ASC" }],
  });
}
