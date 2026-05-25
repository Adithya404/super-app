// lib/sidebar/types.ts
// Client-safe types for the teams/sidebar model.
// These types intentionally omit role arrays so that
// role requirements are never exposed to the browser.

export interface PageItem {
  title: string;
  pagePath: string;
  icon: string;
  hidden?: boolean;
  parentPagePath?: string;
}

export interface PageGroup {
  title: string;
  groupPath: string;
  icon: string;
  isExpanded?: boolean;
  pages: PageItem[];
}

export interface ModuleMenuItems {
  title: string;
  modulePath: string;
  pageGroups: PageGroup[];
}

export interface Team {
  name: string;
  menuTitle?: string;
  logo: string;
  teamPath: string;
  modules: ModuleMenuItems[];
  oneLevelNav: PageItem[];
}
