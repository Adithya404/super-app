// src/app/api/admin/db/tables/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.roles.includes("admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);
    return NextResponse.json({ data: rows });
  } catch (error: unknown) {
    console.error("Fetch tables error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
