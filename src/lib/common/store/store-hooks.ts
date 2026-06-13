// src/lib/common/store/store-hooks.ts

import { useEffect, useMemo, useRef } from "react";
import { useSnapshot } from "valtio";
import type { StoreOptions } from "../ds/types";
import { DataStore } from "./store";
import type { Row, Store } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: default allows untyped page hooks to infer row shape at call sites
export function useStore<T extends object = any>(options: StoreOptions<T>): Store<T> {
  const storeRef = useRef<DataStore<T> | null>(null);

  if (!storeRef.current || storeRef.current.datasourceId !== options.datasourceId) {
    storeRef.current = new DataStore<T>(options);
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

export function useRows<T extends object>(store: Store<T>): Row<T>[] {
  const { localRows, dbRows } = useSnapshot(store.getState());
  return [...localRows, ...dbRows] as Row<T>[];
}
