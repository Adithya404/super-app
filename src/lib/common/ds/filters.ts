// src/lib/common/ds/filters.ts

export type StringFilterOperator = "contains" | "is" | "startsWith" | "endsWith" | "isNot";
export type NumberFilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte";
export type DateFilterOperator = "after" | "before" | "on" | "onOrAfter" | "onOrBefore";
export type BooleanFilterOperator = "is";

export interface StringSingleFilter<T> {
  kind: "single";
  field: keyof T & string;
  dataType: "Text" | "UUID";
  operator: StringFilterOperator;
  value: string;
}

export interface NumberSingleFilter<T> {
  kind: "single";
  field: keyof T & string;
  dataType: "Number";
  operator: NumberFilterOperator;
  value: number;
}

export interface BooleanSingleFilter<T> {
  kind: "single";
  field: keyof T & string;
  dataType: "Boolean";
  operator: BooleanFilterOperator;
  value: boolean;
}

export interface DateSingleFilter<T> {
  kind: "single";
  field: keyof T & string;
  dataType: "Date" | "DateTime";
  operator: DateFilterOperator;
  value: string;
}

export type SingleFilter<T> =
  | StringSingleFilter<T>
  | NumberSingleFilter<T>
  | BooleanSingleFilter<T>
  | DateSingleFilter<T>;

export interface NestedFilter<T> {
  kind: "nested";
  logic: "AND" | "OR";
  filters: Filters<T>;
}

export type FilterEntry<T> = SingleFilter<T> | NestedFilter<T>;
export type Filters<T> = FilterEntry<T>[];

type FilterSqlResult = {
  clause: string;
  values: unknown[];
  nextParamIndex: number;
};

/** Fluent helpers for building typed filters. */
export const F = {
  text<T>(
    field: keyof T & string,
    operator: StringFilterOperator,
    value: string,
  ): StringSingleFilter<T> {
    return { kind: "single", field, dataType: "Text", operator, value };
  },

  uuid<T>(field: keyof T & string, operator: "is" | "isNot", value: string): StringSingleFilter<T> {
    return { kind: "single", field, dataType: "UUID", operator, value };
  },

  number<T>(
    field: keyof T & string,
    operator: NumberFilterOperator,
    value: number,
  ): NumberSingleFilter<T> {
    return { kind: "single", field, dataType: "Number", operator, value };
  },

  boolean<T>(field: keyof T & string, value: boolean): BooleanSingleFilter<T> {
    return { kind: "single", field, dataType: "Boolean", operator: "is", value };
  },

  date<T>(
    field: keyof T & string,
    operator: DateFilterOperator,
    value: string,
  ): DateSingleFilter<T> {
    return { kind: "single", field, dataType: "Date", operator, value };
  },

  dateTime<T>(
    field: keyof T & string,
    operator: DateFilterOperator,
    value: string,
  ): DateSingleFilter<T> {
    return { kind: "single", field, dataType: "DateTime", operator, value };
  },

  and<T>(...filters: Filters<T>): NestedFilter<T> {
    return { kind: "nested", logic: "AND", filters };
  },

  or<T>(...filters: Filters<T>): NestedFilter<T> {
    return { kind: "nested", logic: "OR", filters };
  },
};

/** Accept legacy `{ field: value }` objects or the new filter array format. */
export function normalizeFilters<T>(filters: unknown): Filters<T> {
  if (Array.isArray(filters)) {
    return filters as Filters<T>;
  }

  if (filters && typeof filters === "object") {
    return Object.entries(filters as Record<string, unknown>).map(([field, value]) => {
      const key = field as keyof T & string;
      if (typeof value === "number") {
        return F.number<T>(key, "eq", value);
      }
      if (typeof value === "boolean") {
        return F.boolean<T>(key, value);
      }
      return F.text<T>(key, "is", String(value ?? ""));
    });
  }

  return [];
}

function buildStringClause(
  column: string,
  operator: StringFilterOperator,
  value: string,
  paramIndex: number,
): FilterSqlResult {
  const col = `"${column}"`;
  switch (operator) {
    case "contains":
      return {
        clause: `${col} ILIKE $${paramIndex}`,
        values: [`%${value}%`],
        nextParamIndex: paramIndex + 1,
      };
    case "startsWith":
      return {
        clause: `${col} ILIKE $${paramIndex}`,
        values: [`${value}%`],
        nextParamIndex: paramIndex + 1,
      };
    case "endsWith":
      return {
        clause: `${col} ILIKE $${paramIndex}`,
        values: [`%${value}`],
        nextParamIndex: paramIndex + 1,
      };
    case "isNot":
      return {
        clause: `${col} <> $${paramIndex}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
    default:
      return { clause: `${col} = $${paramIndex}`, values: [value], nextParamIndex: paramIndex + 1 };
  }
}

function buildNumberClause(
  column: string,
  operator: NumberFilterOperator,
  value: number,
  paramIndex: number,
): FilterSqlResult {
  const col = `"${column}"`;
  const ops: Record<NumberFilterOperator, string> = {
    eq: "=",
    neq: "<>",
    gt: ">",
    lt: "<",
    gte: ">=",
    lte: "<=",
  };
  return {
    clause: `${col} ${ops[operator]} $${paramIndex}`,
    values: [value],
    nextParamIndex: paramIndex + 1,
  };
}

function buildDateClause(
  column: string,
  dataType: "Date" | "DateTime",
  operator: DateFilterOperator,
  value: string,
  paramIndex: number,
): FilterSqlResult {
  const col = dataType === "Date" ? `"${column}"::date` : `"${column}"`;
  const cast = dataType === "Date" ? "::date" : "";
  switch (operator) {
    case "after":
      return {
        clause: `${col} > $${paramIndex}${cast}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
    case "before":
      return {
        clause: `${col} < $${paramIndex}${cast}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
    case "onOrAfter":
      return {
        clause: `${col} >= $${paramIndex}${cast}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
    case "onOrBefore":
      return {
        clause: `${col} <= $${paramIndex}${cast}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
    default:
      return {
        clause: `${col} = $${paramIndex}${cast}`,
        values: [value],
        nextParamIndex: paramIndex + 1,
      };
  }
}

function buildSingleFilterSql<T>(
  filter: SingleFilter<T>,
  resolveColumn: (field: string) => string | null,
  paramIndex: number,
): FilterSqlResult | null {
  const column = resolveColumn(filter.field);
  if (!column) {
    return null;
  }

  switch (filter.dataType) {
    case "Text":
    case "UUID":
      return buildStringClause(column, filter.operator, filter.value, paramIndex);
    case "Number":
      return buildNumberClause(column, filter.operator, filter.value, paramIndex);
    case "Boolean":
      return {
        clause: `"${column}" = $${paramIndex}`,
        values: [filter.value],
        nextParamIndex: paramIndex + 1,
      };
    case "Date":
    case "DateTime":
      return buildDateClause(column, filter.dataType, filter.operator, filter.value, paramIndex);
    default:
      return null;
  }
}

function buildFilterEntrySql<T>(
  entry: FilterEntry<T>,
  resolveColumn: (field: string) => string | null,
  paramIndex: number,
): FilterSqlResult | null {
  if (entry.kind === "nested") {
    const parts: string[] = [];
    const values: unknown[] = [];
    let idx = paramIndex;

    for (const child of entry.filters) {
      const result = buildFilterEntrySql(child, resolveColumn, idx);
      if (result) {
        parts.push(result.clause);
        values.push(...result.values);
        idx = result.nextParamIndex;
      }
    }

    if (parts.length === 0) {
      return null;
    }

    return {
      clause: `(${parts.join(` ${entry.logic} `)})`,
      values,
      nextParamIndex: idx,
    };
  }

  return buildSingleFilterSql(entry, resolveColumn, paramIndex);
}

export function buildFiltersWhereClause<T>(
  filters: Filters<T> | unknown,
  resolveColumn: (field: string) => string | null,
  startParamIndex = 1,
): { whereClause: string; values: unknown[]; nextParamIndex: number } {
  const normalized = normalizeFilters<T>(filters);
  const parts: string[] = [];
  const values: unknown[] = [];
  let paramIndex = startParamIndex;

  for (const entry of normalized) {
    const result = buildFilterEntrySql(entry, resolveColumn, paramIndex);
    if (result) {
      parts.push(result.clause);
      values.push(...result.values);
      paramIndex = result.nextParamIndex;
    }
  }

  return {
    whereClause: parts.join(" AND "),
    values,
    nextParamIndex: paramIndex,
  };
}
