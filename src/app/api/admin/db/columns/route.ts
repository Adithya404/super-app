// src/app/api/admin/db/columns/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user.roles.includes("admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const schema = searchParams.get("schema") || "public";

  if (!table) {
    return NextResponse.json({ message: "Table name required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        character_maximum_length, 
        column_default,
        (
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = $1 AND tc.table_name = $2 AND kcu.column_name = c.column_name AND tc.constraint_type = 'PRIMARY KEY'
          )
        ) as is_primary
      FROM information_schema.columns c
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `,
      [schema, table],
    );
    return NextResponse.json({ data: rows });
  } catch (error: unknown) {
    console.error("Fetch columns error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
