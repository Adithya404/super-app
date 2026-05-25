import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkPageAccess, getRedirectForAppPath } from "@/lib/teams";

// Pathname prefixes that don't require authentication
const UNAUTHENTICATED_PREFIXES = [
  "/api/auth",
  "/home",
  "/_next/static",
  "/favicon.ico",
  "/images",
  "/public",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/");

  // 1. Check for unauthenticated routes (fast path)
  if (
    UNAUTHENTICATED_PREFIXES.some((prefix) => pathname.startsWith(prefix) || pathname === prefix)
  ) {
    return NextResponse.next();
  }

  // 2. Get session
  const session = await auth();

  // If there's a session and user is trying to access /auth, redirect to home/dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If there is NO session and user is trying to access /auth, allow it
  if (!session && isAuthPage) {
    return NextResponse.next();
  }

  // 3. Handle unauthenticated requests
  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ status: "ERROR", message: "Unauthorized" }, { status: 401 });
    }

    // Redirect to login with sourceUrl for page requests
    const newUrl = new URL("/auth", request.nextUrl.origin);
    const searchParams = request.nextUrl.search;
    const sourceUrl = `${pathname}${searchParams}`;
    newUrl.searchParams.set("sourceUrl", sourceUrl);
    return NextResponse.redirect(newUrl);
  }

  // 4. Check page access based on user's teams
  const teams = session.user.teams ?? [];

  if (teams.length === 0 && pathname !== "/no-access" && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  if (!pathname.startsWith("/api")) {
    // Check if pathname exactly matches a team or module base path
    const redirectPath = getRedirectForAppPath(teams, pathname);
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
    }

    const hasAccess = checkPageAccess(teams, pathname);
    if (!hasAccess) {
      const newUrl = new URL("/access-denied", request.nextUrl.origin);
      newUrl.searchParams.set("path", pathname);
      return NextResponse.redirect(newUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except standard Next.js static files and internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
