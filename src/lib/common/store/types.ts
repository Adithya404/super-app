// src/lib/common/store/types.ts

import type { StoreOptions } from "../ds/types";

export type RecordStatus = "I" | "U" | "D" | "N";

// Base row types based on the reference provided
export type Row<T> = T & {
  _cid?: string;
  _status?: RecordStatus;
  _orig?: Partial<T>;
  _id?: string;
};
export type NewRow<T> = Partial<T> & { _cid?: string; _status?: RecordStatus };
export type DBRow<T> = T & { _id?: string };

/**
 * Interface representing the data store.
 * Based on the reference Store<T> structure provided.
 * Contains both currently implemented hooks-based fields and optional fields for full compatibility.
 */
export interface Store<T extends object = Record<string, unknown>> {
  // Properties actively managed and returned by useStore
  data: Row<T>[];
  count: number;
  loading: boolean;
  error: string | null;
  datasourceId: string;
  options: StoreOptions;

  // The currently focused row for forms (e.g. Add New)
  currentRow: Row<T> | null;

  // Implemented methods
  refetch(force?: boolean): Promise<unknown>;
  createNew(params?: {
    partialRecord?: NewRow<T>;
    addOnTop?: boolean;
    addAfter?: string;
    cid?: string;
    status?: RecordStatus;
  }): string;

  updateRow(id: string, partialRecord: Partial<T>, skipDirty?: boolean): void;

  save(params?: {
    silent?: boolean;
    feedback?: "NONE" | string;
    batchCallback?: () => void;
    cancelBatch?: () => void;
  }): Promise<boolean>;

  // Optional properties from the reference Store to maintain compatibility
  alias?: string;
  displayName?: string;
  filterLocally?: boolean;
  ignorePKDuplicate?: boolean;
  key?: string;
  limit?: number;
  localStore?: boolean;
  page?: string;
  autoQuery?: boolean;

  // Optional compatibility methods
  clear?: () => Promise<void>;
  resetStore?: () => void;
  deleteFromStore?: (id: string) => void;
  deleteRow?: (id: string) => Promise<void>;
  isRowFromDB?: (id?: string) => boolean;
  rowId?: (row: Row<T>) => string;
}
