// src/components/layout/apps/adminModules.ts
import type { AppModule } from ".";

export const adminModules: AppModule[] = [
  {
    title: "Admin",
    modulePath: "/admin",
    pageGroups: [
      {
        title: "User Management",
        groupPath: "/users",
        icon: "Users",
        isExpanded: true,
        pages: [
          {
            title: "All Users",
            pagePath: "/list",
            icon: "Users",
            roles: ["admin"],
            hidden: false,
          },
          {
            title: "Roles",
            pagePath: "/roles",
            icon: "ShieldCheck",
            roles: ["admin"],
            hidden: false,
          },
          {
            title: "User Roles",
            pagePath: "/user-roles",
            icon: "UserCog",
            roles: ["admin"],
            hidden: false,
          },
          {
            title: "Sessions",
            pagePath: "/sessions",
            icon: "UserCog",
            roles: ["admin"],
            hidden: false,
          },
          {
            title: "Migrations",
            pagePath: "/migrations",
            icon: "UserCog",
            roles: ["admin"],
            hidden: false,
          },
        ],
      },
      {
        title: "System",
        groupPath: "/system",
        icon: "Settings",
        isExpanded: true,
        pages: [
          {
            title: "Audit Logs",
            pagePath: "/audit-logs",
            icon: "ScrollText",
            roles: ["admin"],
            hidden: false,
          },
          {
            title: "App Config",
            pagePath: "/app-config",
            icon: "SlidersHorizontal",
            roles: ["admin"],
            hidden: false,
          },
        ],
      },
      {
        title: "Developer Tools",
        groupPath: "/system",
        icon: "Hammer",
        isExpanded: true,
        pages: [
          {
            title: "Code Generate",
            pagePath: "/code-generate",
            icon: "Code",
            roles: ["admin"],
            hidden: false,
          },
        ],
      },
    ],
  },
];
