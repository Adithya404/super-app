import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT 1 AS ok");

    return Response.json({
      status: "connected",
      db: result.rows[0],
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
