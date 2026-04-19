import { useStore } from "@/lib/common/store/use-store";

export function useMigrationsStore() {
  return useStore({
    datasourceId: "Migrations",
    page: "migrations-page",
    alias: "migrations-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
