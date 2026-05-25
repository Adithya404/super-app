"use client";

import { usePathname } from "next/navigation";
import type { Team } from "@/lib/sidebar/types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { TeamProvider, useTeamContext } from "./team-context";

type AppShellProps = {
  teams: Team[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
  children: React.ReactNode;
  hideSidebar?: boolean;
};

// We split this into an inner component so we can use the useTeamContext hook
function AppShellInner({ user, children, hideSidebar }: Omit<AppShellProps, "teams">) {
  const pathname = usePathname();
  const { activeTeam } = useTeamContext();

  // Find the active page title
  let activePageName = "Dashboard";
  if (activeTeam) {
    // Check oneLevelNav
    const navMatch = activeTeam.oneLevelNav.find(
      (p) =>
        pathname === `${activeTeam.teamPath}${p.pagePath}` ||
        pathname.startsWith(`${activeTeam.teamPath}${p.pagePath}/`),
    );
    if (navMatch) {
      activePageName = navMatch.title;
    } else {
      // Check modules
      const moduleMatch = activeTeam.modules
        .flatMap((m) =>
          m.pageGroups.flatMap((g) =>
            g.pages.map((p) => ({
              title: p.title,
              path: `${m.modulePath}${g.groupPath}${p.pagePath}`,
            })),
          ),
        )
        .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

      if (moduleMatch) {
        activePageName = moduleMatch.title;
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!hideSidebar && <Sidebar user={user} />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar appName={activeTeam?.name ?? "Super Portal"} pageName={activePageName} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <TeamProvider teams={props.teams}>
      <AppShellInner user={props.user} hideSidebar={props.hideSidebar}>
        {props.children}
      </AppShellInner>
    </TeamProvider>
  );
}
