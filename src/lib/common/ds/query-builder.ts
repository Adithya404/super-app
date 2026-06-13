// src/lib/common/ds/query-builder.ts

import { buildFiltersWhereClause, F, type Filters } from "./filters";
import type { Attribute, CalculatedAttribute, DataSource } from "./types";

export type SortDirection = "ASC" | "DESC";

export interface SortEntry<T> {
  field: keyof T & string;
  direction: SortDirection;
}

export type Sort<T> = SortEntry<T>[];

export interface Query<T extends object = Record<string, unknown>> {
  limit?: number;
  offset?: number;
  includeCount?: boolean;
  filters?: Filters<T>;
  /** @deprecated use filters */
  filter?: Filters<T>;
  match?: Partial<T>;
  /** @deprecated use match */
  data?: Partial<T>;
  sort?: Sort<T>;
  select?: string[];
}

export interface BuiltQuery {
  sql: string;
  countSql: string;
  values: unknown[];
  countValues: unknown[];
}

function isCalculatedAttribute(attr: Attribute | CalculatedAttribute): attr is CalculatedAttribute {
  return "isCalculated" in attr && attr.isCalculated;
}

function resolveColumn(ds: DataSource, field: string): string | null {
  const attr = ds.attributes.find((a) => a.code === field);
  if (!attr || isCalculatedAttribute(attr)) {
    return null;
  }
  return attr.column;
}

/** Convert simple equality match object into typed single filters. */
export function matchToFilters<T extends object>(match: Partial<T>): Filters<T> {
  return Object.entries(match as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([field, value]) => {
      const key = field as keyof T & string;
      if (typeof value === "number") {
        return F.number<T>(key, "eq", value);
      }
      if (typeof value === "boolean") {
        return F.boolean<T>(key, value);
      }
      return F.text<T>(key, "is", String(value));
    });
}

/** Normalize deprecated query property names. */
export function normalizeQuery<T extends object>(query: Query<T>): Query<T> {
  const normalized: Query<T> = { ...query };

  if (normalized.data) {
    normalized.match = { ...normalized.match, ...normalized.data };
    delete normalized.data;
  }

  if (normalized.filter) {
    normalized.filters = [...(normalized.filters ?? []), ...normalized.filter];
    delete normalized.filter;
  }

  return normalized;
}

export function mergeQueryFilters<T extends object>(
  defaultFilters: Filters<T> | undefined,
  userFilters: Filters<T> | undefined,
): Filters<T> {
  return [...(defaultFilters ?? []), ...(userFilters ?? [])];
}

export function buildDataSourceQuery<T extends object>(
  ds: DataSource,
  query: Query<T>,
): BuiltQuery {
  const normalized = normalizeQuery(query);
  const selectCodes = normalized.select?.length
    ? normalized.select
    : ds.attributes.map((attr) => attr.code);

  const selectItems = selectCodes
    .map((code) => {
      const attr = ds.attributes.find((a) => a.code === code);
      if (!attr) {
        return null;
      }
      if (isCalculatedAttribute(attr)) {
        return `${attr.column} AS "${attr.code}"`;
      }
      return `"${attr.column}" AS "${attr.code}"`;
    })
    .filter((item): item is string => item !== null);

  const schemaPrefix = ds.schema ? `"${ds.schema}".` : "";
  let sql = `SELECT ${selectItems.join(", ")} FROM ${schemaPrefix}"${ds.tableName}" x`;

  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const resolve = (field: string) => resolveColumn(ds, field);

  const matchFilters = normalized.match ? matchToFilters<T>(normalized.match) : [];
  const allFilters = [...matchFilters, ...(normalized.filters ?? [])];

  const {
    whereClause,
    values: filterValues,
    nextParamIndex,
  } = buildFiltersWhereClause(allFilters, resolve, paramIndex);

  if (whereClause) {
    whereClauses.push(whereClause);
    values.push(...filterValues);
    paramIndex = nextParamIndex;
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  if (normalized.sort?.length) {
    const orderParts = normalized.sort
      .map(({ field, direction }) => {
        const column = resolveColumn(ds, field);
        if (!column) {
          return null;
        }
        const dir = direction === "DESC" ? "DESC" : "ASC";
        return `"${column}" ${dir}`;
      })
      .filter((part): part is string => part !== null);

    if (orderParts.length > 0) {
      sql += ` ORDER BY ${orderParts.join(", ")}`;
    }
  }

  const countSql = `SELECT count(*) FROM (${sql}) total`;
  const countValues = [...values];

  const limit = normalized.limit ?? 100;
  const offset = normalized.offset ?? 0;
  sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  values.push(limit, offset);

  return { sql, countSql, values, countValues };
}

export function parseQueryFromSearchParams(searchParams: URLSearchParams): Query {
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const includeCount = searchParams.get("includeCount");
  const filtersRaw = searchParams.get("filters");
  const matchRaw = searchParams.get("match");
  const sortRaw = searchParams.get("sort");
  const queryRaw = searchParams.get("query");

  if (queryRaw) {
    return JSON.parse(queryRaw) as Query;
  }

  const query: Query = {};

  if (limit) {
    query.limit = parseInt(limit, 10);
  }
  if (offset) {
    query.offset = parseInt(offset, 10);
  }
  if (includeCount !== null) {
    query.includeCount = includeCount === "true";
  }
  if (filtersRaw) {
    query.filters = JSON.parse(filtersRaw);
  }
  if (matchRaw) {
    query.match = JSON.parse(matchRaw);
  }
  if (sortRaw) {
    query.sort = JSON.parse(sortRaw);
  }

  return query;
}
