// proxy.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");
  const isProtectedPage = pathname.startsWith("/dashboard");

  if (session && isAuthPage) {
    // Already signed in, don't let them see /auth again
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session && isProtectedPage) {
    // Not signed in, kick them to /auth
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};
