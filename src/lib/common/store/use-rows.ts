// src/lib/common/store/use-rows.ts

export function useRows<T>(store: { data: T[] }): T[] {
  return store.data;
}
