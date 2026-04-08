import { NextResponse } from "next/server";
import { authPool } from "@/lib/db";

export async function DELETE({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await authPool.query("select * from sessions where id=$1;", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: `Session not found` }, { status: 404 });
    }
    await authPool.query("delete from sessions where id=$1", [id]);
    return NextResponse.json(
      { success: false, message: `Session terminated`, sessionId: id },
      { status: 404 },
    );
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
