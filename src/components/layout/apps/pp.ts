// components/layout/apps/pingpal.ts
import type { AppConfig } from ".";

export const ppApp: AppConfig = {
  key: "pp",
  name: "PingPal",
  abbr: "PP",
  color: "#0ea5e9",
  basePath: "/pp",
  modules: [
    {
      title: "PingPal",
      modulePath: "/pp",
      pageGroups: [
        {
          title: "Messaging",
          groupPath: "/messaging",
          icon: "MessageSquare",
          isExpanded: true,
          pages: [
            {
              title: "Direct Messages",
              pagePath: "/dm",
              icon: "MessageCircle",
              roles: ["chat_personnel"], // all authenticated users
              hidden: false,
            },
            {
              title: "Group Chats",
              pagePath: "/groups",
              icon: "Users",
              roles: ["chat_personnel"],
              hidden: false,
            },
          ],
        },
      ],
    },
  ],
};
