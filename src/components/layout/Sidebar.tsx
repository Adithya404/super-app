"use client";

import {
  Activity,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronDown,
  //   ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Coffee,
  Eye,
  FileChartPie,
  FileText,
  GalleryVerticalEnd,
  GraduationCap,
  LogOut,
  type LucideIcon,
  MapPin,
  Package,
  Route,
  Settings2,
  Waypoints,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "../ui/button";
import type { AppConfig } from "./apps";

// Map icon name strings from config to actual Lucide components
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
};

type SidebarProps = {
  apps: AppConfig[];
  currentApp: AppConfig;
  onAppChange: (app: AppConfig) => void;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: { role_code: string; app: string }[];
  };
};

export default function Sidebar({ apps, currentApp, onAppChange, user }: SidebarProps) {
  const pathname = usePathname();
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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
      {/* App Switcher */}
      <div className="relative border-white/8 border-b p-2">
        <Button
          onClick={() => setAppDropdownOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md bg-white/7 px-2 py-1.5 font-medium text-sm text-white transition-colors hover:bg-white/12"
        >
          {/* App color dot / abbr badge */}
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-bold text-[10px] text-white"
            style={{ background: currentApp.color }}
          >
            {currentApp.abbr}
          </span>
          <span className="flex-1 truncate text-left text-xs">{currentApp.name}</span>
          <ChevronsUpDown size={13} className="shrink-0 opacity-40" />
        </Button>

        {/* Dropdown */}
        {appDropdownOpen && (
          <div className="absolute top-full right-2 left-2 z-50 mt-1 overflow-hidden rounded-lg border border-white/12 bg-[#1a1d27] py-1 shadow-xl">
            {apps.map((app) => (
              <Button
                key={app.key}
                onClick={() => {
                  onAppChange(app);
                  setAppDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/7 ${
                  currentApp.key === app.key ? "bg-white/8 text-white" : "text-[#9ba3b2]"
                }`}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold text-[9px] text-white"
                  style={{ background: app.color }}
                >
                  {app.abbr}
                </span>
                {app.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin scrollbar-thumb-white/10 no-scrollbar flex-1 overflow-y-auto py-2">
        {currentApp.modules.flatMap((mod) =>
          mod.pageGroups.map((group) => {
            const groupKey = `${currentApp.key}-${group.groupPath}`;
            const isCollapsed = collapsedGroups[groupKey] ?? !group.isExpanded;
            const userRoleCodes =
              user.roles
                ?.filter((r) => r.app === currentApp.key || r.app === "*") // ← add || r.app === "*"
                .map((r) => r.role_code) ?? [];

            // Filter hidden pages
            const visiblePages = group.pages.filter(
              (p) =>
                !p.hidden &&
                (p.roles.length === 0 || // no restriction = everyone sees it
                  p.roles.some((r) => userRoleCodes.includes(r))),
            );

            return (
              <div key={groupKey}>
                {/* Group header */}
                <Button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center justify-between bg-accent-background px-3.5 pt-3 pb-1"
                >
                  <span className="font-semibold text-[10px] text-white/30 uppercase tracking-widest">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={10}
                    className={`text-white/25 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </Button>

                {/* Pages */}
                {!isCollapsed && (
                  <div>
                    {visiblePages.map((page) => {
                      const fullPath = `${currentApp.basePath}${group.groupPath}${page.pagePath}`;
                      const isActive = pathname === fullPath || pathname.startsWith(`${fullPath}/`);
                      const Icon = iconMap[page.icon] ?? FileText;

                      return (
                        <Link
                          key={page.pagePath}
                          href={fullPath}
                          className={`flex items-center gap-2 border-l-2 py-1.5 pr-3 pl-5 text-[13px] transition-all ${
                            isActive
                              ? "border-indigo-400 bg-white/10 text-white"
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
          {/* Avatar */}
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-semibold text-[11px] text-white">
              {getInitials(user.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[#e2e5ec] text-[12px]">{user.name ?? "User"}</p>
            <p className="truncate text-[#9ba3b2] text-[11px]">{user.email}</p>
          </div>

          <Button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="text-[#9ba3b2] transition-colors hover:text-white"
            title="Sign out"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
