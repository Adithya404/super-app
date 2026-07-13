// src/lib/common/store/store-hooks.ts

import { useEffect, useMemo, useRef } from "react";
import { useSnapshot } from "valtio";
import type { StoreOptions } from "../ds/types";
import { DataStore } from "./store";
import { getCachedStore, getStoreKey } from "./store-cache";
import type { DBRow, Row, Store } from "./types";

/**
 * Returns a shared store instance keyed by `${alias}-${datasourceId}-${page}`.
 * Same key → same instance across the app.
 */
// biome-ignore lint/suspicious/noExplicitAny: default allows untyped page hooks to infer row shape at call sites
export function useStore<T extends object = any>(options: StoreOptions<T>): Store<T> {
  const key = getStoreKey(options);
  const storeRef = useRef<DataStore<T> | null>(null);

  if (!storeRef.current || storeRef.current.key !== key) {
    const cached = getCachedStore<T>(key);
    storeRef.current = (cached as DataStore<T> | undefined) ?? new DataStore<T>(options);
  }

  const store = storeRef.current;
  store.options = options;

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        datasourceId: options.datasourceId,
        limit: options.limit,
        offset: options.offset,
        includeCount: options.includeCount,
        filters: options.filters,
        defaultFilters: options.defaultFilters,
        defaultMatch: options.defaultMatch,
        sort: options.sort,
      }),
    [
      options.datasourceId,
      options.limit,
      options.offset,
      options.includeCount,
      options.filters,
      options.defaultFilters,
      options.defaultMatch,
      options.sort,
    ],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch when query config signature changes
  useEffect(() => {
    if (options.autoQuery !== false) {
      void store.fetchData();
    }
  }, [store, options.autoQuery, querySignature]);

  return store;
}

export function useIsStoreBusy<T extends object>(store: Store<T>): boolean {
  const { isLoading, isPosting } = useSnapshot(store.getState());
  return isLoading || isPosting;
}

export function useIsStoreLoading<T extends object>(store: Store<T>): boolean {
  const { isLoading } = useSnapshot(store.getState());
  return isLoading;
}

export function useIsStorePosting<T extends object>(store: Store<T>): boolean {
  const { isPosting } = useSnapshot(store.getState());
  return isPosting;
}

function rowKey(row: { _cid?: string; _id?: string }): string {
  return row._cid ?? row._id ?? "";
}

export function useIsStoreDirty<T extends object>(store: Store<T>): boolean {
  const snap = useSnapshot(store.getState());
  if (Object.keys(snap.originalRows).length > 0) return true;
  const localRows = snap.localRows as unknown as Row<T>[];
  return localRows.some((row) => row._status === "I" || row._status === "U" || row._status === "D");
}

export function useRows<T extends object>(store: Store<T>): Row<T>[] {
  const { localRows, dbRows } = useSnapshot(store.getState());
  return [...(localRows as unknown as Row<T>[]), ...(dbRows as unknown as Row<T>[])];
}

/** Prefer for list pages — fields are treated as loaded from DB. */
export function useDBRows<T extends object>(store: Store<T>): ReadonlyArray<DBRow<T>> {
  const { dbRows } = useSnapshot(store.getState());
  return dbRows as unknown as ReadonlyArray<DBRow<T>>;
}

export function useCurrentRowId<T extends object>(store: Store<T>): string | null {
  const { currentRowId } = useSnapshot(store.getState());
  return currentRowId;
}

export function useCurrentRow<T extends object>(store: Store<T>): Row<T> | undefined {
  const snap = useSnapshot(store.getState());
  const localRows = snap.localRows as unknown as Row<T>[];
  const dbRows = snap.dbRows as unknown as Row<T>[];
  const currentRowId = snap.currentRowId;

  const proxyRow = useMemo(() => {
    if (!currentRowId) {
      return localRows.length > 0 ? localRows[0] : undefined;
    }
    return (
      localRows.find((r) => rowKey(r) === currentRowId) ??
      dbRows.find((r) => rowKey(r) === currentRowId)
    );
  }, [currentRowId, localRows, dbRows]);

  return useMemo(() => {
    if (proxyRow == null) return undefined;
    return { ...proxyRow } as Row<T>;
  }, [proxyRow]);
}

/**
 * Sync-mode current row for forms. Prevents cursor jumping while typing.
 * Always prefer this over `useCurrentRow` / `store.currentRow` in form fields.
 */
export function useCurrentRowSync<T extends object>(store: Store<T>): Row<T> | undefined {
  const snap = useSnapshot(store.getState(), { sync: true });
  const localRows = snap.localRows as unknown as Row<T>[];
  const dbRows = snap.dbRows as unknown as Row<T>[];
  const currentRowId = snap.currentRowId;

  const proxyRow = useMemo(() => {
    if (!currentRowId) {
      return localRows.length > 0 ? localRows[0] : undefined;
    }
    return (
      localRows.find((r) => rowKey(r) === currentRowId) ??
      dbRows.find((r) => rowKey(r) === currentRowId)
    );
  }, [currentRowId, localRows, dbRows]);

  return useMemo(() => {
    if (proxyRow == null) return undefined;
    return { ...proxyRow } as Row<T>;
  }, [proxyRow]);
}

export function useRowValue<T extends object, K extends keyof T>(
  store: Store<T>,
  rowId: string,
  key: K,
): T[K] | undefined {
  const snap = useSnapshot(store.getState(), { sync: true });
  const localRows = snap.localRows as unknown as Row<T>[];
  const dbRows = snap.dbRows as unknown as Row<T>[];
  const row = localRows.find((r) => rowKey(r) === rowId) ?? dbRows.find((r) => rowKey(r) === rowId);
  return row?.[key];
}

export function useStoreRowCount<T extends object>(store: Store<T>): number {
  const { count, localRows } = useSnapshot(store.getState());
  return count + localRows.length;
}

export function useStoreError<T extends object>(store: Store<T>): string | null {
  const { error } = useSnapshot(store.getState());
  return error;
}
