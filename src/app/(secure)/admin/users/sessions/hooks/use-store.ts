import type { Sessions } from "@/lib/common/ds/types/admin/Sessions";
import { useStore as useBaseStore } from "@/lib/common/store/use-store";

export function useStore() {
  return useBaseStore<Sessions>({
    datasourceId: "Sessions",
    page: "sessions-page",
    alias: "sessions-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
