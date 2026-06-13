/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: store row typing */
import { proxy } from "valtio";
import type { Filters } from "../ds/filters";
import type { Query } from "../ds/query-builder";
import { mergeQueryFilters, normalizeQuery } from "../ds/query-builder";
import type { StoreOptions } from "../ds/types";
import type {
  DBRow,
  ExecuteQueryOptions,
  NewRow,
  RecordStatus,
  Row,
  Store,
  StoreState,
} from "./types";

function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

type ChildStoreEntry = {
  config: { store: Store<object> };
};

export class DataStore<T extends object = any> implements Store<T> {
  readonly datasourceId: string;
  options: StoreOptions<T>;

  private readonly _state: StoreState<T>;
  private readonly _childStoreEntries: ChildStoreEntry[] = [];

  constructor(options: StoreOptions<T>) {
    this.options = options;
    this.datasourceId = options.datasourceId;
    this._state = proxy<StoreState<T>>({
      isLoading: false,
      isPosting: false,
      dbRows: [],
      localRows: [],
      originalRows: {},
      count: 0,
      error: null,
    });
  }

  getState = (): StoreState<T> => this._state;

  get data(): Row<T>[] {
    return [...this._state.localRows, ...this._state.dbRows];
  }

  get count(): number {
    return this._state.count + this._state.localRows.length;
  }

  get loading(): boolean {
    return this._state.isLoading;
  }

  get error(): string | null {
    return this._state.error;
  }

  get currentRow(): Row<T> | null {
    return this._state.localRows.length > 0 ? this._state.localRows[0] : null;
  }

  rowId = (row: Row<T>): string => row._cid ?? (row._id as string | undefined) ?? "";

  list = (): Row<T>[] => this.data;

  currentRowId = (): string => {
    const row = this.currentRow;
    return row ? this.rowId(row) : "";
  };

  originalRows = (): Record<string, Row<T>> => this._state.originalRows;

  isDirtyStatus = (status?: RecordStatus): boolean => {
    if (!status || status === "N") {
      return false;
    }
    return status === "I" || status === "U" || status === "D";
  };

  dirtyRows = (): Row<T>[] =>
    this._state.localRows.filter((row) => this.isDirtyStatus(row._status));

  hasDirtyRows = (): boolean => this.dirtyRows().length > 0;

  hasNewRows = (): boolean =>
    this._state.localRows.some((row) => row._status === "I" || row._status === "N");

  isStoreDirty = (): boolean => {
    if (!isEmptyObject(this.originalRows())) {
      return true;
    }
    if (this.hasDirtyRows()) {
      return true;
    }
    for (const entry of this._childStoreEntries) {
      if (entry.config.store.isStoreDirty?.()) {
        return true;
      }
    }
    return false;
  };

  isUpdatable = (): boolean => true;

  isInsertable = (): boolean => true;

  isDeletable = (): boolean => true;

  isReadonly = (): boolean => !this.isUpdatable() && !this.isInsertable() && !this.isDeletable();

  confirm = async (): Promise<boolean> =>
    window.confirm("You have unsaved changes. Discard them and refresh?");

  resetStore = (): void => {
    for (const entry of this._childStoreEntries) {
      entry.config.store.resetStore?.();
    }

    if (!this.isStoreDirty() && !this.hasNewRows()) {
      return;
    }

    this._state.localRows = [];
    this._state.originalRows = {};
  };

  getFilters = (): Filters<T> => this.options.filters ?? [];

  setFilters = (filters: Filters<T>): void => {
    this.options.filters = filters;
  };

  clearFilters = (): void => {
    this.options.filters = [];
  };

  getSort = () => this.options.sort;

  buildQueryParams = (query: Query<T>): URLSearchParams => {
    const params = new URLSearchParams();

    if (query.limit !== undefined) {
      params.set("limit", query.limit.toString());
    }
    if (query.offset !== undefined) {
      params.set("offset", query.offset.toString());
    }
    if (query.includeCount !== undefined) {
      params.set("includeCount", query.includeCount.toString());
    }
    if (query.filters?.length) {
      params.set("filters", JSON.stringify(query.filters));
    }
    if (query.match && Object.keys(query.match).length > 0) {
      params.set("match", JSON.stringify(query.match));
    }
    if (query.sort?.length) {
      params.set("sort", JSON.stringify(query.sort));
    }

    return params;
  };

  executeQuery = async (
    {
      query = {},
      noClear,
      force = false,
      handleResponse,
      refreshOrPagination = false,
    }: ExecuteQueryOptions<T> = { query: {} },
  ): Promise<void> => {
    if (!noClear && !refreshOrPagination && !force && this.isStoreDirty() && !this.isReadonly()) {
      const confirmed = await this.confirm();
      if (!confirmed) {
        return;
      }
      this.resetStore();
    }

    const mergedQuery = normalizeQuery({ ...query });

    if (!mergedQuery.limit) {
      mergedQuery.limit = this.options.limit ?? 100;
    }
    if (mergedQuery.offset === undefined) {
      mergedQuery.offset = this.options.offset ?? 0;
    }
    if (mergedQuery.includeCount === undefined) {
      mergedQuery.includeCount = this.options.includeCount ?? true;
    }
    if (!mergedQuery.sort?.length) {
      mergedQuery.sort = this.getSort();
    }

    const queryMatch = mergedQuery.match;
    const queryFilters = mergedQuery.filters;
    const userFilters = queryFilters ?? this.options.filters ?? [];

    if (this.options.defaultMatch || queryMatch) {
      mergedQuery.match = { ...this.options.defaultMatch, ...queryMatch };
    }

    mergedQuery.filters = mergeQueryFilters(this.options.defaultFilters, userFilters);

    this._state.isLoading = true;
    this._state.error = null;

    try {
      const response = await fetch(
        `/api/ds/${this.datasourceId}?${this.buildQueryParams(mergedQuery).toString()}`,
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch data");
      }

      const result = await response.json();
      const rows = (result.rows ?? []) as DBRow<T>[];

      if (handleResponse) {
        handleResponse(rows);
      } else {
        this._state.dbRows = rows as Row<T>[];
        this._state.count = result.count ?? 0;
      }

      if (queryFilters !== undefined) {
        this.setFilters(queryFilters);
      }
      this.options.limit = mergedQuery.limit;
      this.options.offset = mergedQuery.offset;
      if (mergedQuery.sort) {
        this.options.sort = mergedQuery.sort;
      }
    } catch (err) {
      this._state.error = err instanceof Error ? err.message : String(err);
    } finally {
      this._state.isLoading = false;
    }
  };

  applyFilters = async (filters?: Filters<T>): Promise<void> => {
    await this.executeQuery({
      query: {
        filters: filters ?? this.getFilters(),
        offset: 0,
      },
    });
  };

  fetchData = async (limit?: number): Promise<void> => {
    await this.executeQuery({
      query: {
        limit: limit ?? this.options.limit,
        offset: this.options.offset,
        includeCount: this.options.includeCount,
        filters: this.getFilters(),
      },
      refreshOrPagination: true,
    });
  };

  refresh = async (_force = true, limit?: number): Promise<void> => {
    await this.executeQuery({
      query: { limit: limit ?? this.options.limit, offset: this.options.offset },
      force: _force,
      refreshOrPagination: true,
    });
  };

  refetch = async (force?: boolean): Promise<void> => {
    await this.refresh(force ?? true);
  };

  createNew = ({ partialRecord = {} }: { partialRecord?: NewRow<T> } = {}): string => {
    const _cid = crypto.randomUUID();
    const newRow = { ...partialRecord, _cid, _status: "I" as RecordStatus };
    this._state.localRows = [newRow as Row<T>, ...this._state.localRows];
    return _cid;
  };

  updateRow = (_cid: string, updates: Partial<T>): void => {
    this._state.localRows = this._state.localRows.map((row) =>
      row._cid === _cid ? { ...row, ...updates } : row,
    );
  };

  beginEdit = (record: Row<T>): string => {
    const _cid = crypto.randomUUID();
    const id = this.rowId(record);
    const { _cid: _omitCid, _status: _omitStatus, _orig: _omitOrig, ...rest } = record;
    const editRow = { ...rest, _cid, _status: "U" as RecordStatus, _orig: { ...rest } };
    this._state.localRows = [editRow as Row<T>];
    if (id) {
      this._state.originalRows = { ...this._state.originalRows, [id]: record };
    }
    return _cid;
  };

  save = async (): Promise<boolean> => {
    const dirtyRecords = this.dirtyRows();
    if (dirtyRecords.length === 0) {
      return true;
    }

    this._state.isPosting = true;

    try {
      const response = await fetch(`/api/ds/${this.datasourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: dirtyRecords }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      this.resetStore();
      await this.fetchData();
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    } finally {
      this._state.isPosting = false;
    }
  };
}
