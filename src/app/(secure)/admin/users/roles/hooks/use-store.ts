import type { Roles } from "@/lib/common/ds/types/admin/Roles";
import { useStore as useBaseStore } from "@/lib/common/store/use-store";

export function useStore() {
  return useBaseStore<Roles>({
    datasourceId: "Roles",
    page: "roles-page",
    alias: "roles-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
