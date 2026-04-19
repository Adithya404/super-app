import { useStore as useBaseStore } from "@/lib/common/store/use-store";

export function useStore() {
  return useBaseStore({
    datasourceId: "UserRoles",
    page: "user-roles-page",
    alias: "user-roles-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
