// lib/teams.ts
// Server-side teams resolver.
// Filters the full app registry by user roles, producing a client-safe
// Team[] that only contains pages the user is authorized to see.

import type { AppPage } from "@/components/layout/apps";
import { apps } from "@/components/layout/apps/registry";
import type { ModuleMenuItems, PageGroup, PageItem, Team } from "@/lib/sidebar/types";

/**
 * Converts an AppPage (with roles) into a client-safe PageItem (without roles).
 */
function toPageItem(page: AppPage): PageItem {
  return {
    title: page.title,
    pagePath: page.pagePath,
    icon: page.icon,
    hidden: page.hidden || undefined,
  };
}

/**
 * Given the full app registry and a user's role codes, returns only the
 * teams (apps) and pages the user is authorized to access.
 *
 * Rules:
 * - A page with `roles: []` (empty array) is accessible to all authenticated users.
 * - A page with `roles: ["admin"]` is only accessible if the user has the "admin" role.
 * - A page group is included only if it has at least one accessible page.
 * - A module is included only if it has at least one non-empty page group.
 * - An app becomes a team only if it has at least one accessible page.
 */
export function resolveTeamsForUser(roles: string[]): Team[] {
  const teams: Team[] = [];

  for (const app of apps) {
    const filteredModules: ModuleMenuItems[] = [];

    for (const mod of app.modules) {
      const filteredGroups: PageGroup[] = [];

      for (const group of mod.pageGroups) {
        const filteredPages = group.pages.filter(
          (page) =>
            !page.hidden && (page.roles.length === 0 || page.roles.some((r) => roles.includes(r))),
        );

        if (filteredPages.length > 0) {
          filteredGroups.push({
            title: group.title,
            groupPath: group.groupPath,
            icon: group.icon,
            isExpanded: group.isExpanded,
            pages: filteredPages.map(toPageItem),
          });
        }
      }

      if (filteredGroups.length > 0) {
        filteredModules.push({
          title: mod.title,
          modulePath: mod.modulePath,
          pageGroups: filteredGroups,
        });
      }
    }

    // Filter oneLevelNav if the app has it
    const filteredOneLevelNav: PageItem[] = (app.oneLevelNav ?? [])
      .filter(
        (page) =>
          !page.hidden && (page.roles.length === 0 || page.roles.some((r) => roles.includes(r))),
      )
      .map(toPageItem);

    // Only include the app as a team if the user can access at least one page
    if (filteredModules.length > 0 || filteredOneLevelNav.length > 0) {
      teams.push({
        name: app.name,
        logo: app.abbr, // Using abbr as the logo identifier
        teamPath: app.basePath,
        modules: filteredModules,
        oneLevelNav: filteredOneLevelNav,
      });
    }
  }

  return teams;
}

/**
 * Checks if a given pathname is accessible based on the resolved teams.
 * Used by the proxy to enforce page-level access.
 */
export function checkPageAccess(teams: Team[], pathname: string): boolean {
  // Root path and special pages are always accessible
  if (pathname === "/" || pathname === "/no-access" || pathname === "/access-denied") {
    return true;
  }

  for (const team of teams) {
    // Check oneLevelNav pages
    for (const nav of team.oneLevelNav) {
      const fullPath = `${team.teamPath}${nav.pagePath}`;
      if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
        return true;
      }
    }

    // Check module → pageGroup → page hierarchy
    for (const mod of team.modules) {
      for (const group of mod.pageGroups) {
        for (const page of group.pages) {
          const fullPath = `${mod.modulePath}${group.groupPath}${page.pagePath}`;
          if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Returns the URL of the first accessible page for the user, based on their teams.
 * Used by the home page and access-denied page for smart redirection.
 */
export function getFirstAccessiblePath(teams: Team[]): string | null {
  if (teams.length === 0) return null;

  const team = teams[0];

  // Prefer oneLevelNav if available
  if (team.oneLevelNav.length > 0) {
    return `${team.teamPath}${team.oneLevelNav[0].pagePath}`;
  }

  // Fall back to first module → first group → first page
  if (
    team.modules.length > 0 &&
    team.modules[0].pageGroups.length > 0 &&
    team.modules[0].pageGroups[0].pages.length > 0
  ) {
    const mod = team.modules[0];
    const group = mod.pageGroups[0];
    const page = group.pages[0];
    return `${mod.modulePath}${group.groupPath}${page.pagePath}`;
  }

  return null;
}

/**
 * Returns a redirect path if the pathname exactly matches a team's base path
 * or a module's base path.
 */
export function getRedirectForAppPath(teams: Team[], pathname: string): string | null {
  for (const team of teams) {
    // Match team base path
    if (pathname === team.teamPath || pathname === `${team.teamPath}/`) {
      if (team.oneLevelNav.length > 0) {
        return `${team.teamPath}${team.oneLevelNav[0].pagePath}`;
      }
      if (
        team.modules.length > 0 &&
        team.modules[0].pageGroups.length > 0 &&
        team.modules[0].pageGroups[0].pages.length > 0
      ) {
        const mod = team.modules[0];
        const group = mod.pageGroups[0];
        const page = group.pages[0];
        return `${mod.modulePath}${group.groupPath}${page.pagePath}`;
      }
    }

    // Match module base path
    for (const mod of team.modules) {
      if (pathname === mod.modulePath || pathname === `${mod.modulePath}/`) {
        if (mod.pageGroups.length > 0 && mod.pageGroups[0].pages.length > 0) {
          const group = mod.pageGroups[0];
          const page = group.pages[0];
          return `${mod.modulePath}${group.groupPath}${page.pagePath}`;
        }
      }
    }
  }

  return null;
}
