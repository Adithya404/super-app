import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHAT_HISTORY_PAGE_SIZE, listChats } from "@/lib/ai/chat-store";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const endingBefore = searchParams.get("ending_before") ?? undefined;
  const limit = limitParam ? Number.parseInt(limitParam, 10) : CHAT_HISTORY_PAGE_SIZE;

  if (Number.isNaN(limit) || limit < 1) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  const result = await listChats({
    userId: session.user.id,
    limit,
    endingBefore,
  });

  return NextResponse.json(result);
}
