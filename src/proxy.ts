// proxy.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { appBasePaths, apps, validAppPaths } from "@/components/layout/apps/registry";
import { getUserRoles } from "@/lib/roles"; // ← use existing function

function getPageConfig(pathname: string) {
  for (const app of apps) {
    for (const mod of app.modules) {
      for (const group of mod.pageGroups) {
        for (const page of group.pages) {
          const fullPath = `${mod.modulePath || app.basePath}${group.groupPath}${page.pagePath}`;
          if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
            return page;
          }
        }
      }
    }
  }
  return null;
}

function isValidAppPath(pathname: string) {
  return validAppPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAppBasePath(pathname: string) {
  return appBasePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");
  const isAccessDenied = pathname.startsWith("/access-denied");

  if (isAuthPage || isAccessDenied) {
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL("/tp/break-policies", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (isAppBasePath(pathname) && !isValidAppPath(pathname)) {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  if (isValidAppPath(pathname)) {
    const page = getPageConfig(pathname);

    if (page && page.roles.length > 0) {
      // ✅ reuse getUserRoles instead of raw query
      const userRoles = await getUserRoles(session.user.email as string);
      const userRoleCodes = userRoles.map((r) => r.role_code);

      const hasAccess = page.roles.some((r) => userRoleCodes.includes(r));

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/access-denied",
    "/tp/:path*",
    "/ir/:path*",
    "/am/:path*",
    "/hr/:path*",
    "/dashboard/:path*",
  ],
};
