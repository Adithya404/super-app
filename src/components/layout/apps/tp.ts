import type { AppConfig } from ".";
import { adminModules } from "./adminModules";

export const tpApp: AppConfig = {
  key: "tp",
  name: "Tours & Patrols",
  abbr: "T&P",
  color: "#6366f1",
  basePath: "/tp",
  modules: [
    {
      title: "Tours & Patrols",
      modulePath: "/tp",
      pageGroups: [
        {
          title: "Configuration",
          groupPath: "/config",
          icon: "Settings2",
          isExpanded: true,
          pages: [
            {
              title: "Break Policy Template",
              pagePath: "/break-policies",
              icon: "Coffee",
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
