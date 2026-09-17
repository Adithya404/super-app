import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized Access" }, { status: 401 });
  }
  if (!session.user.roles?.includes("admin")) {
    return NextResponse.json({ success: false, message: "Forbidden Access" }, { status: 403 });
  }

  try {
    const data = await pool.query("SELECT * FROM super.user_roles");
    return NextResponse.json({ success: true, data: data.rows }, { status: 200 });
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
