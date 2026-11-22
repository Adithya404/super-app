// src/app/api/ds/[datasourceId]/route.ts
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildDataSourceQuery, parseQueryFromSearchParams } from "@/lib/common/ds/query-builder";
import { getDataSource } from "@/lib/common/ds/registry";
import { pool } from "@/lib/db";
import { postDataSource, UserError } from "@/lib/server/ds/postDataSource";
import { queryDataSource } from "@/lib/server/ds/queryDataSource";

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

    const userRoles = session.user.roles || [];
    const hasAccess = ds.access.some(
      (acc) => userRoles.includes(acc.roleCode) && (acc.type === "Full" || acc.type === "ReadOnly"),
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = parseQueryFromSearchParams(searchParams);
    const includeCount = query.includeCount ?? searchParams.get("includeCount") === "true";

    const client = await pool.connect();
    try {
      // Use queryDataSource which calls preQuery and postQuery hooks
      const rows = await queryDataSource(
        client,
        session as unknown as Record<string, unknown>,
        ds,
        query,
      );

      let totalCount = 0;
      if (includeCount) {
        const { countSql, countValues } = buildDataSourceQuery(ds, query);
        const countResult = await client.query(countSql, countValues);
        totalCount = parseInt(countResult.rows[0].count, 10);
      }

      return NextResponse.json({
        rows,
        count: totalCount,
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("DataStore API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(
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

    const userRoles = session.user.roles || [];
    const hasAccess = ds.access.some(
      (acc) => userRoles.includes(acc.roleCode) && acc.type === "Full",
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const rows = body.rows || [];

    if (!Array.isArray(rows)) {
      return NextResponse.json({ message: "Invalid request format" }, { status: 400 });
    }

    // Special handling for Users (password hashing)
    if (datasourceId === "Users") {
      for (const row of rows) {
        if (row.password) {
          row.password = await bcrypt.hash(row.password as string, 12);
        }
        if (typeof row.email === "string") {
          row.email = row.email.toLowerCase();
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Use postDataSource which calls all hooks
      const results = await postDataSource(
        client,
        session as unknown as Record<string, unknown>,
        ds,
        rows,
      );

      await client.query("COMMIT");
      return NextResponse.json(results);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("DataStore API POST Error:", error);

    // If UserError, send it directly (validation message)
    if (error instanceof UserError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
