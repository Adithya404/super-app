import { NextResponse } from "next/server";
// import { getSessionUser } from "@/lib/auth/get-session";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // const session = await getSessionUser();
    const data = await pool.query("SELECT * FROM super.roles");
    console.info("data", data);
    return NextResponse.json({ success: true, data: data.rows }, { status: 201 });
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
