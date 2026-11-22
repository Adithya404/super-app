/* Copyright (c) 2024-present ... */

import "server-only";

import type { PoolClient } from "pg";
import { buildDataSourceQuery } from "@/lib/common/ds/query-builder";
import type { DataSource, Query } from "@/lib/common/ds/types";

export interface DBRow {
  _status: "Q";
  [key: string]: unknown;
}

/**
 * Query DataSource rows with lifecycle hooks.
 * Handles preQuery transformation and postQuery processing.
 */
export async function queryDataSource(
  client: PoolClient,
  session: Record<string, unknown>,
  ds: DataSource,
  query: Query,
): Promise<DBRow[]> {
  // Call preQuery hook to modify query
  let finalQuery = query;
  if (ds.preQuery) {
    finalQuery = await ds.preQuery({ query, session, client: client as unknown });
  }

  // Build and execute SQL
  const { sql, values } = buildDataSourceQuery(ds, finalQuery);
  const result = await client.query(sql, values);

  // Add _status to rows
  let rows: DBRow[] = (result.rows as Record<string, unknown>[]).map((row) => ({
    ...row,
    _status: "Q" as const,
  })) as DBRow[];

  if (ds.postQuery) {
    const transformedRows = await ds.postQuery({
      query: finalQuery,
      rows,
      session,
      client: client as unknown,
    });
    // Re-add _status after postQuery transformation
    rows = (transformedRows as Record<string, unknown>[]).map((row) => ({
      ...row,
      _status: "Q" as const,
    })) as DBRow[];
  }

  return rows;
}
