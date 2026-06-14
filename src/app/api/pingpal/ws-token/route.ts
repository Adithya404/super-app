import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWsToken, WS_TOKEN_TTL_SECONDS } from "@/lib/websocket/token";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await createWsToken(session.user.id);

  return NextResponse.json({
    token,
    expiresIn: WS_TOKEN_TTL_SECONDS,
  });
}
