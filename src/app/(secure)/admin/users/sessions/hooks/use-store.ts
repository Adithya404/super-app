import { useStore as useBaseStore } from "@/lib/common/store/use-store";

export function useStore() {
  return useBaseStore({
    datasourceId: "Sessions",
    page: "sessions-page",
    alias: "sessions-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
