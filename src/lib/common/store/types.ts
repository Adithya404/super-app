// src/lib/common/store/types.ts

import type { Filters } from "../ds/filters";
import type { Query } from "../ds/query-builder";
import type { StoreOptions } from "../ds/types";

export type RecordStatus = "I" | "U" | "D" | "N";

export type Row<T> = T & {
  _cid?: string;
  _status?: RecordStatus;
  _orig?: Partial<T>;
  _id?: string;
};
export type NewRow<T> = Partial<T> & { _cid?: string; _status?: RecordStatus };
export type DBRow<T> = T & { _id?: string };

export interface ExecuteQueryOptions<T extends object = Record<string, unknown>> {
  query?: Query<T>;
  noClear?: true;
  force?: boolean;
  handleResponse?: (rows: DBRow<T>[]) => void;
  refreshOrPagination?: boolean;
}

export interface StoreState<T extends object = Record<string, unknown>> {
  isLoading: boolean;
  isPosting: boolean;
  dbRows: Row<T>[];
  localRows: Row<T>[];
  originalRows: Record<string, Row<T>>;
  count: number;
  error: string | null;
}

/**
 * Interface representing the data store.
 * Implemented by DataStore in store.ts.
 */
export interface Store<T extends object = Record<string, unknown>> {
  data: Row<T>[];
  count: number;
  loading: boolean;
  error: string | null;
  datasourceId: string;
  options: StoreOptions<T>;
  currentRow: Row<T> | null;

  getState(): StoreState<T>;

  refresh(force?: boolean, limit?: number): Promise<void>;
  refetch(force?: boolean): Promise<unknown>;

  createNew(params?: {
    partialRecord?: NewRow<T>;
    addOnTop?: boolean;
    addAfter?: string;
    cid?: string;
    status?: RecordStatus;
  }): string;

  updateRow(id: string, partialRecord: Partial<T>, skipDirty?: boolean): void;

  beginEdit?(record: Row<T>): string;

  save(params?: {
    silent?: boolean;
    feedback?: "NONE" | string;
    batchCallback?: () => void;
    cancelBatch?: () => void;
  }): Promise<boolean>;

  isStoreDirty?(): boolean;
  isReadonly?(): boolean;
  resetStore?(): void;
  dirtyRows?(): Row<T>[];
  hasDirtyRows?(): boolean;
  hasNewRows?(): boolean;
  getFilters?(): Filters<T>;
  setFilters?(filters: Filters<T>): void;
  clearFilters?(): void;
  applyFilters?(filters?: Filters<T>): Promise<void>;
  executeQuery?(options?: ExecuteQueryOptions<T>): Promise<void>;

  alias?: string;
  displayName?: string;
  filterLocally?: boolean;
  ignorePKDuplicate?: boolean;
  key?: string;
  limit?: number;
  localStore?: boolean;
  page?: string;
  autoQuery?: boolean;

  clear?: () => Promise<void>;
  deleteFromStore?: (id: string) => void;
  deleteRow?: (id: string) => Promise<void>;
  isRowFromDB?: (id?: string) => boolean;
  rowId?: (row: Row<T>) => string;
}
