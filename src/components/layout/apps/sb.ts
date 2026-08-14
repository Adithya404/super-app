import type { AppConfig } from ".";
import { adminModules } from "./adminModules";

export const sbApp: AppConfig = {
  key: "sb",
  name: "Sabre",
  abbr: "SB",
  color: "#6366f1",
  basePath: "/sb",
  modules: [
    {
      title: "Sabre",
      modulePath: "/sb",
      pageGroups: [
        {
          title: "Configuration",
          groupPath: "/config",
          icon: "Settings2",
          isExpanded: true,
          pages: [
            {
              title: "Chat",
              pagePath: "/chat",
              icon: "MessageSquare",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
          ],
        },
      ],
    },
    ...adminModules,
  ],
};
