import type { Store } from "./types";

/** Shared store instances keyed by `${alias}-${datasourceId}-${page}`. */
export const STORE_CACHE = new Map<string, Store<object>>();

export function getStoreKey(props: {
  alias?: string;
  datasourceId: string;
  page?: string;
}): string {
  const alias = props.alias ?? "default";
  const page = props.page ?? "default";
  return `${alias}-${props.datasourceId}-${page}`;
}

export function getCachedStore<T extends object>(key: string): Store<T> | undefined {
  return STORE_CACHE.get(key) as Store<T> | undefined;
}

export function setCachedStore<T extends object>(key: string, store: Store<T>): void {
  STORE_CACHE.set(key, store as Store<object>);
}
