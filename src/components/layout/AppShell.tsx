"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AppConfig } from "./apps";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  apps: AppConfig[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: { role_code: string; app: string }[];
  };
  children: React.ReactNode;
  hideSidebar?: boolean; // ← add this
};

export default function AppShell({ apps, user, children, hideSidebar }: AppShellProps) {
  const pathname = usePathname();

  // Detect the active app from the current pathname
  const activeApp = apps.find((app) => pathname.startsWith(app.basePath)) ?? apps[0];

  const [currentApp, setCurrentApp] = useState<AppConfig>(activeApp);

  // Find the active page title by matching pathname to pageGroups
  const activePage = currentApp.modules
    .flatMap((m) =>
      m.pageGroups.flatMap((g) =>
        g.pages.map((p) => ({
          page: p,
          path: `${m.modulePath || currentApp.basePath}${g.groupPath}${p.pagePath}`,
        })),
      ),
    )
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.page;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!hideSidebar && (
        <Sidebar apps={apps} currentApp={currentApp} onAppChange={setCurrentApp} user={user} />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar appName={currentApp.name} pageName={activePage?.title ?? "Dashboard"} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
