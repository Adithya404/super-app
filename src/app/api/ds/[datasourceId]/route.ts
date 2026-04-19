// src/app/api/ds/[datasourceId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataSource } from "@/lib/common/ds/registry";
import { pool } from "@/lib/db";
// import type { CalculatedAttribute } from "@/lib/common/ds/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasourceId: string }> },
) {
  try {
    const { datasourceId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ds = getDataSource(datasourceId);
    if (!ds) {
      return NextResponse.json(
        { message: `DataSource ${datasourceId} not found` },
        { status: 404 },
      );
    }

    // Check permissions
    const userRoles = session.user.roles || [];
    const hasAccess = ds.access.some(
      (acc) => userRoles.includes(acc.roleCode) && (acc.type === "Full" || acc.type === "ReadOnly"),
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const includeCount = searchParams.get("includeCount") === "true";
    const filtersRaw = searchParams.get("filters");
    const filters = filtersRaw ? JSON.parse(filtersRaw) : {};

    // Build SQL Select clause
    const selectItems: string[] = [];
    ds.attributes.forEach((attr) => {
      // If it's a calculated attribute (raw SQL), use it as is but alias it
      if ("isCalculated" in attr && attr.isCalculated) {
        selectItems.push(`${attr.column} AS "${attr.code}"`);
      } else {
        selectItems.push(`"${attr.column}" AS "${attr.code}"`);
      }
    });

    const schemaPrefix = ds.schema ? `"${ds.schema}".` : "";
    let sql = `SELECT ${selectItems.join(", ")} FROM ${schemaPrefix}"${ds.tableName}" x`;

    // Build WHERE clause (Simple filtering)
    const whereClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      const attr = ds.attributes.find((a) => a.code === key);
      if (attr && !("isCalculated" in attr)) {
        whereClauses.push(`"${attr.column}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Add Pagination
    const countSql = `SELECT count(*) FROM (${sql}) total`;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    // Execute query
    const result = await pool.query(sql, values);

    let totalCount = 0;
    if (includeCount) {
      const countResult = await pool.query(countSql, values.slice(0, values.length - 2));
      totalCount = parseInt(countResult.rows[0].count, 10);
    }

    return NextResponse.json({
      rows: result.rows,
      count: totalCount,
    });
  } catch (error: unknown) {
    console.error("DataStore API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
