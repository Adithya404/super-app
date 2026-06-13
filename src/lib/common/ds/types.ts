// src/lib/common/ds/types.ts

import type { Filters } from "./filters";
import type { Sort } from "./query-builder";

export type {
  BooleanFilterOperator,
  DateFilterOperator,
  FilterEntry,
  Filters,
  NestedFilter,
  NumberFilterOperator,
  SingleFilter,
  StringFilterOperator,
} from "./filters";
export {
  buildFiltersWhereClause,
  F,
  normalizeFilters,
} from "./filters";
export type { Query, Sort, SortDirection, SortEntry } from "./query-builder";
export {
  buildDataSourceQuery,
  matchToFilters,
  mergeQueryFilters,
  normalizeQuery,
  parseQueryFromSearchParams,
} from "./query-builder";

export type DataType = "Text" | "Number" | "Boolean" | "Date" | "DateTime" | "UUID" | "JSON";

export interface Attribute {
  code: string;
  name: string;
  type: DataType;
  column: string;
  primary?: boolean;
  optional?: boolean;
  maxLength?: number;
  defaultValue?: unknown;
}

export interface CalculatedAttribute extends Omit<Attribute, "column"> {
  column: string; // This will hold the SQL snippet
  isCalculated: true;
}

export interface Access {
  roleCode: string;
  type: "Full" | "ReadOnly" | "None";
}

export interface DataSource {
  id: string;
  tableName: string;
  schema?: string;
  attributes: Array<Attribute | CalculatedAttribute>;
  access: Access[];
}

export interface StoreOptions<T extends object = Record<string, unknown>> {
  datasourceId: string;
  page?: string;
  alias?: string;
  limit?: number;
  offset?: number;
  includeCount?: boolean;
  autoQuery?: boolean;
  /** User filters persisted from the last executeQuery call. */
  filters?: Filters<T>;
  /** Filters always merged into every query (not persisted as user filters). */
  defaultFilters?: Filters<T>;
  /** Simple equality match always merged into every query. */
  defaultMatch?: Partial<T>;
  sort?: Sort<T>;
}
