import { clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
  clearSessionCookie();
  return Response.json({ success: true });
}
