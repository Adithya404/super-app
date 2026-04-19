// src/lib/common/store/use-store.ts
import { useQuery } from "@tanstack/react-query";
import type { StoreOptions } from "../ds/types";

export function useStore(options: StoreOptions) {
  const {
    datasourceId,
    limit = 100,
    offset = 0,
    includeCount = true,
    autoQuery = true,
    filters = {},
  } = options;

  const queryKey = ["ds", datasourceId, options];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        includeCount: includeCount.toString(),
        filters: JSON.stringify(filters),
      });

      const response = await fetch(`/api/ds/${datasourceId}?${queryParams.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch data");
      }
      return response.json();
    },
    enabled: autoQuery,
  });

  return {
    data: data?.rows || [],
    count: data?.count || 0,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    datasourceId,
    options,
    refetch,
  };
}
