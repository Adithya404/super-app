import { NextResponse } from "next/server";
import { auth } from "@/auth";
// import { getSessionUser } from "@/lib/auth/get-session";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized Access" }, { status: 401 });
  }
  try {
    const data = await pool.query("SELECT * FROM super.users");
    return NextResponse.json({ success: true, data: data.rows }, { status: 201 });
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
