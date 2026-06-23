"use client";

import { usePathname } from "next/navigation";
import type { Team } from "@/lib/sidebar/types";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import { SidebarSlotProvider, useSidebarSlot } from "./sidebar-slot";
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
function AppShellInner({ children, hideSidebar }: Pick<AppShellProps, "children" | "hideSidebar">) {
  const pathname = usePathname();
  const { activeTeam } = useTeamContext();
  const { sidebar: slotSidebar } = useSidebarSlot();
  const leftSidebar = slotSidebar ?? (!hideSidebar ? <Sidebar /> : null);

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
      {leftSidebar}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar appName={activeTeam?.name ?? "Super Portal"} pageName={activePageName} />
        <main className={cn("flex-1", slotSidebar ? "overflow-hidden" : "overflow-y-auto")}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <TeamProvider teams={props.teams ?? []}>
      <SidebarSlotProvider>
        <AppShellInner hideSidebar={props.hideSidebar}>{props.children}</AppShellInner>
      </SidebarSlotProvider>
    </TeamProvider>
  );
}
