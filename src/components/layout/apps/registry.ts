import { tpApp } from "./tp";
// import { irApp } from "./ir"   ← just uncomment as you add apps

export const apps = [
  tpApp,
  // irApp,
];

// Auto-generate the base paths for proxy matcher — no manual updates needed
export const appBasePaths = Array.from(
  new Set(
    apps.flatMap((app) => [
      app.basePath,
      ...app.modules.map((mod) => mod.modulePath || app.basePath),
    ]),
  ),
);

// Auto-generate all valid paths from every app
export const validAppPaths = apps.flatMap((app) =>
  app.modules.flatMap((mod) =>
    mod.pageGroups.flatMap((group) =>
      group.pages
        .filter((p) => !p.hidden)
        .map((p) => `${mod.modulePath || app.basePath}${group.groupPath}${p.pagePath}`),
    ),
  ),
);
