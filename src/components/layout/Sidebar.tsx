"use client";

import {
  Activity,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  Code,
  Coffee,
  Eye,
  FileChartPie,
  FileText,
  GalleryVerticalEnd,
  GraduationCap,
  Hammer,
  LogOut,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Route,
  ScrollText,
  Settings,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  Waypoints,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { TeamSwitcher } from "./TeamSwitcher";
import { useTeamContext } from "./team-context";

// Map icon name strings to actual Lucide components
const iconMap: Record<string, LucideIcon> = {
  Route,
  Waypoints,
  ClipboardList,
  Coffee,
  MapPin,
  Calendar,
  FileText,
  GraduationCap,
  Package,
  Activity,
  BadgeCheck,
  BarChart3,
  FileChartPie,
  Settings2,
  Eye,
  GalleryVerticalEnd,
  Users,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  UserCog,
  Settings,
  ScrollText,
  SlidersHorizontal,
  Hammer,
  Code,
};

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { teams, activeTeam, setActiveTeam } = useTeamContext();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Auto-detect active team from pathname
  useEffect(() => {
    if (activeTeam) {
      if (
        activeTeam.teamPath &&
        (pathname.startsWith(`${activeTeam.teamPath}/`) || pathname === activeTeam.teamPath)
      ) {
        return;
      }
      if (
        activeTeam.modules.some(
          (m) =>
            m.modulePath && (pathname.startsWith(`${m.modulePath}/`) || pathname === m.modulePath),
        )
      ) {
        return;
      }
    }

    const matchingTeam = teams.find(
      (t) =>
        (t.teamPath && (pathname.startsWith(`${t.teamPath}/`) || pathname === t.teamPath)) ||
        t.modules.some(
          (m) =>
            m.modulePath && (pathname.startsWith(`${m.modulePath}/`) || pathname === m.modulePath),
        ) ||
        t.oneLevelNav.some(
          (nav) =>
            pathname.startsWith(`${t.teamPath}${nav.pagePath}/`) ||
            pathname === `${t.teamPath}${nav.pagePath}`,
        ) ||
        t.modules.some((m) =>
          m.pageGroups.some(
            (g) =>
              pathname.startsWith(`${m.modulePath}${g.groupPath}/`) ||
              pathname === `${m.modulePath}${g.groupPath}` ||
              g.pages.some(
                (p) =>
                  pathname.startsWith(`${m.modulePath}${g.groupPath}${p.pagePath}/`) ||
                  pathname === `${m.modulePath}${g.groupPath}${p.pagePath}`,
              ),
          ),
        ),
    );

    if (matchingTeam && matchingTeam !== activeTeam) {
      setActiveTeam(matchingTeam);
    }
  }, [pathname, activeTeam, teams, setActiveTeam]);

  if (!activeTeam) return null;

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getInitials(name?: string | null) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden bg-[#0f1117]">
      {/* Team Switcher */}
      <div className="border-white/8 border-b p-2">
        <TeamSwitcher teams={teams} activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin scrollbar-thumb-white/10 no-scrollbar flex-1 overflow-y-auto py-2">
        {/* Flat Navigation (One Level) */}
        {activeTeam.oneLevelNav.length > 0 && (
          <div className="mb-4">
            {activeTeam.oneLevelNav.map((page) => {
              const fullPath = `${activeTeam.teamPath}${page.pagePath}`;
              const isActive = pathname === fullPath || pathname.startsWith(`${fullPath}/`);
              const Icon = iconMap[page.icon] ?? FileText;

              return (
                <Link
                  key={page.pagePath}
                  href={fullPath}
                  className={`flex items-center gap-2 py-2 pr-3 pl-5 text-[13px] transition-all ${
                    isActive
                      ? "bg-white/10 font-medium text-white"
                      : "text-[#9ba3b2] hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <Icon size={16} className={isActive ? "opacity-100" : "opacity-60"} />
                  <span className="truncate">{page.title}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Hierarchical Navigation (Modules -> Groups -> Pages) */}
        {activeTeam.modules.flatMap((mod) =>
          mod.pageGroups.map((group) => {
            const groupKey = `${mod.modulePath}-${group.groupPath}-${group.title}`;
            const isCollapsed = collapsedGroups[groupKey] ?? !group.isExpanded;

            return (
              <div key={groupKey}>
                {/* Group header */}
                <Button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center justify-between bg-transparent px-3.5 pt-3 pb-1 hover:bg-white/5"
                >
                  <span className="font-semibold text-[10px] text-white/40 uppercase tracking-widest">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-white/30 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </Button>

                {/* Pages */}
                {!isCollapsed && (
                  <div className="mt-1">
                    {group.pages.map((page) => {
                      const fullPath = `${mod.modulePath}${group.groupPath}${page.pagePath}`;
                      const isActive = pathname === fullPath || pathname.startsWith(`${fullPath}/`);
                      const Icon = iconMap[page.icon] ?? FileText;

                      return (
                        <Link
                          key={page.pagePath}
                          href={fullPath}
                          className={`flex items-center gap-2 border-l-2 py-1.5 pr-3 pl-5 text-[13px] transition-all ${
                            isActive
                              ? "border-primary bg-white/10 text-white"
                              : "border-transparent text-[#9ba3b2] hover:bg-white/6 hover:text-white"
                          }`}
                        >
                          <Icon size={14} className={isActive ? "opacity-100" : "opacity-60"} />
                          <span className="truncate">{page.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </nav>

      {/* User Footer */}
      <div className="border-white/8 border-t p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-[11px] text-primary-foreground">
              {getInitials(user.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[#e2e5ec] text-[12px]">{user.name ?? "User"}</p>
            <p className="truncate text-[#9ba3b2] text-[11px]">{user.email}</p>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="h-8 w-8 rounded-full bg-transparent text-[#9ba3b2] transition-colors hover:bg-white/10 hover:text-white"
            title="Sign out"
            size="icon"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
