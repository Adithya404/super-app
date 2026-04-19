import { useStore as useBaseStore } from "@/lib/common/store/use-store";

export function useStore() {
  return useBaseStore({
    datasourceId: "Users",
    page: "users-page",
    alias: "users-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
