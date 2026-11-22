/* Copyright (c) 2024-present ... */

import "server-only";

import type { PoolClient } from "pg";
import type { DataSource } from "@/lib/common/ds/types";

export interface DBRow {
  _cid?: string;
  _status: "Q" | "I" | "U" | "D";
  _orig?: Record<string, unknown>;
  [key: string]: unknown;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

/**
 * Process DataSource rows (insert/update/delete) with lifecycle hooks.
 * Handles transactions, validation, and side effects.
 */
export async function postDataSource(
  client: PoolClient,
  session: Record<string, unknown>,
  ds: DataSource,
  rows: DBRow[],
): Promise<DBRow[]> {
  const results: DBRow[] = [];
  const schemaPrefix = ds.schema ? `"${ds.schema}".` : "";

  for (const row of rows) {
    // INSERT
    if (row._status === "I") {
      // Call beforeInsert hook
      let processedRowData: Record<string, unknown> = row;
      if (ds.beforeInsert) {
        const hookResult = await ds.beforeInsert({
          rows: [row],
          session,
          client: client as unknown,
        });
        const processedRows = hookResult.rows || [row];
        processedRowData = processedRows[0] as Record<string, unknown>;
      }

      const processedRow = processedRowData;

      // Build INSERT query
      const columnsToInsert: string[] = [];
      const valuesToInsert: unknown[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      ds.attributes.forEach((attr) => {
        if ("isCalculated" in attr && attr.isCalculated) return;
        if (processedRow[attr.code] !== undefined) {
          columnsToInsert.push(`"${attr.column}"`);
          valuesToInsert.push(processedRow[attr.code]);
          placeholders.push(`$${paramIndex++}`);
        }
      });

      if (columnsToInsert.length > 0) {
        const insertSql = `INSERT INTO ${schemaPrefix}"${ds.tableName}" (${columnsToInsert.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
        const res = await client.query(insertSql, valuesToInsert);
        const insertedRow = res.rows[0] as Record<string, unknown>;

        const mappedRow: DBRow = { _cid: row._cid, _status: "Q" };
        ds.attributes.forEach((attr) => {
          if ("isCalculated" in attr && attr.isCalculated) return;
          mappedRow[attr.code] = insertedRow[attr.column];
        });

        // Call afterInsert hook
        if (ds.afterInsert) {
          await ds.afterInsert({ rows: [mappedRow], session, client: client as unknown });
        }

        results.push(mappedRow);
      }
    } else if (row._status === "U") {
      // Call beforeUpdate hook
      let processedRowData: Record<string, unknown> = row;
      if (ds.beforeUpdate) {
        const hookResult = await ds.beforeUpdate({
          rows: [row],
          session,
          client: client as unknown,
        });
        const processedRows = hookResult.rows || [row];
        processedRowData = processedRows[0] as Record<string, unknown>;
      }

      const processedRow = processedRowData;

      const setClauses: string[] = [];
      const whereClauses: string[] = [];
      const valuesToUpdate: unknown[] = [];
      let paramIndex = 1;

      ds.attributes.forEach((attr) => {
        if (attr.primary || ("isCalculated" in attr && attr.isCalculated)) return;
        if (processedRow[attr.code] !== undefined) {
          setClauses.push(`"${attr.column}" = $${paramIndex++}`);
          valuesToUpdate.push(processedRow[attr.code]);
        }
      });

      ds.attributes.forEach((attr) => {
        if (!attr.primary) return;
        const keyValue =
          (row._orig as Record<string, unknown> | undefined)?.[attr.code] ??
          processedRow[attr.code];
        whereClauses.push(`"${attr.column}" = $${paramIndex++}`);
        valuesToUpdate.push(keyValue);
      });

      if (setClauses.length > 0 && whereClauses.length > 0) {
        const updateSql = `UPDATE ${schemaPrefix}"${ds.tableName}" SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")} RETURNING *`;
        const res = await client.query(updateSql, valuesToUpdate);
        const updatedRow = res.rows[0] as Record<string, unknown>;

        const mappedRow: DBRow = { _cid: row._cid, _status: "Q" };
        ds.attributes.forEach((attr) => {
          if ("isCalculated" in attr && attr.isCalculated) return;
          mappedRow[attr.code] = updatedRow[attr.column];
        });

        // Call afterUpdate hook
        if (ds.afterUpdate) {
          await ds.afterUpdate({ rows: [mappedRow], session, client: client as unknown });
        }

        results.push(mappedRow);
      }
    } else if (row._status === "D") {
      // Call beforeDelete hook
      if (ds.beforeDelete) {
        // For beforeDelete, we need previousRows (from DB)
        // Simplified: just pass the row
        await ds.beforeDelete({
          rows: [row],
          previousRows: [row],
          session,
          client: client as unknown,
        });
      }

      const primaryAttrs = ds.attributes.filter((attr) => attr.primary);
      if (primaryAttrs.length > 0) {
        const whereParts: string[] = [];
        const deleteValues: unknown[] = [];
        let deleteIndex = 1;

        for (const attr of primaryAttrs) {
          if ("isCalculated" in attr && attr.isCalculated) continue;
          const keyValue =
            (row._orig as Record<string, unknown> | undefined)?.[attr.code] ??
            (row as Record<string, unknown>)[attr.code];
          whereParts.push(`"${attr.column}" = $${deleteIndex++}`);
          deleteValues.push(keyValue);
        }

        const deleteSql = `DELETE FROM ${schemaPrefix}"${ds.tableName}" WHERE ${whereParts.join(" AND ")}`;
        await client.query(deleteSql, deleteValues);

        const mappedRow: DBRow = { _cid: row._cid, _status: "Q" };

        // Call afterDelete hook
        if (ds.afterDelete) {
          await ds.afterDelete({ rows: [mappedRow], session, client: client as unknown });
        }

        results.push(mappedRow);
      }
    }
  }

  return results;
}
