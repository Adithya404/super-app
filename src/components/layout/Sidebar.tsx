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
  type LucideIcon,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatHistoryPanel } from "@/app/(secure)/sb/config/chat/components/chat-sidebar";
import { Button } from "../ui/button";
import { SidebarUserFooter } from "./SidebarUserFooter";
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

export default function Sidebar() {
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

  const isSabreChat = pathname.startsWith("/sb/config/chat");

  const moduleNav = activeTeam.modules.flatMap((mod) =>
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
  );

  const oneLevelNav =
    activeTeam.oneLevelNav.length > 0 ? (
      <div className="mb-2">
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
    ) : null;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden bg-[#0f1117]">
      {/* Team Switcher */}
      <div className="border-white/8 border-b p-2">
        <TeamSwitcher teams={teams} activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
      </div>

      {isSabreChat ? (
        <>
          <div className="shrink-0 border-white/8 border-b p-2">
            <Button
              asChild
              className="w-full justify-start gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              variant="outline"
            >
              <Link href="/sb/config/chat">
                <Plus size={16} />
                New Chat
              </Link>
            </Button>
          </div>

          {/* Scrollable chat history window (Command Center pattern) */}
          <ChatHistoryPanel />

          {/* Modules stay pinned below the history window */}
          <nav className="scrollbar-thin scrollbar-thumb-white/10 no-scrollbar shrink-0 overflow-y-auto border-white/8 border-t py-2">
            {oneLevelNav}
            {moduleNav}
          </nav>
        </>
      ) : (
        <nav className="scrollbar-thin scrollbar-thumb-white/10 no-scrollbar flex-1 overflow-y-auto py-2">
          {oneLevelNav}
          {moduleNav}
        </nav>
      )}

      <SidebarUserFooter variant="dark" />
    </aside>
  );
}
