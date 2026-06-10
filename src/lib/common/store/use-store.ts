/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/common/store/use-store.ts
/** biome-ignore-all lint/suspicious/noExplicitAny: <abc */
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { StoreOptions } from "../ds/types";
import type { Store } from "./types";

export function useStore<T extends object = any>(options: StoreOptions): Store<T> {
  const {
    datasourceId,
    limit = 100,
    offset = 0,
    includeCount = true,
    autoQuery = true,
    filters = {},
  } = options;

  const queryKey = ["ds", datasourceId, options];

  const [localRows, setLocalRows] = useState<any[]>([]);

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

  const createNew = useCallback(({ partialRecord = {} }: { partialRecord?: any } = {}) => {
    const _cid = crypto.randomUUID();
    const newRow = { ...partialRecord, _cid, _status: "I" };
    setLocalRows((prev) => [newRow, ...prev]);
    return _cid;
  }, []);

  const updateRow = useCallback((_cid: string, updates: any) => {
    setLocalRows((prev) => prev.map((row) => (row._cid === _cid ? { ...row, ...updates } : row)));
  }, []);

  const beginEdit = useCallback((record: any) => {
    const _cid = crypto.randomUUID();
    const { _cid: _omitCid, _status: _omitStatus, _orig: _omitOrig, ...rest } = record;
    const editRow = { ...rest, _cid, _status: "U", _orig: { ...rest } };
    setLocalRows([editRow]);
    return _cid;
  }, []);

  const save = useCallback(async () => {
    const dirtyRecords = localRows.filter((r) => r._status !== "N");
    if (dirtyRecords.length === 0) return true;

    try {
      const response = await fetch(`/api/ds/${datasourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: dirtyRecords }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      setLocalRows([]);
      await refetch();
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  }, [localRows, datasourceId, refetch]);

  const combinedRows = [...localRows, ...(data?.rows || [])];

  // Expose the currently editing/newest row if any (useful for Add New forms)
  const currentRow = localRows.length > 0 ? localRows[0] : null;

  return {
    data: combinedRows,
    count: (data?.count || 0) + localRows.length,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    datasourceId,
    options,
    refetch: async (_force?: boolean) => refetch(),
    createNew,
    updateRow,
    beginEdit,
    save,
    currentRow,
  };
}
