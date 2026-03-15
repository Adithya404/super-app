import type { AppConfig } from ".";

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
          title: "Operations",
          groupPath: "/operations",
          icon: "Settings2",
          isExpanded: true,
          pages: [
            {
              title: "Tours",
              pagePath: "/tours",
              icon: "Route",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Site and Guard Assignments",
              pagePath: "/site-guard-assignments",
              icon: "Waypoints",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
          ],
        },
        {
          title: "Configuration",
          groupPath: "/config",
          icon: "Settings2",
          isExpanded: true,
          pages: [
            {
              title: "Activity Templates",
              pagePath: "/activity-templates",
              icon: "ClipboardList",
              roles: ["tour_admin"],
              hidden: false,
            },
            {
              title: "Break Policy Template",
              pagePath: "/break-policies",
              icon: "Coffee",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Geofence",
              pagePath: "/geofence",
              icon: "MapPin",
              roles: ["tour_admin", "regional_admin"],
              hidden: false,
            },
            {
              title: "Schedule Templates",
              pagePath: "/schedule-templates",
              icon: "Calendar",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
          ],
        },
        {
          title: "Resources",
          groupPath: "/resources",
          icon: "GalleryVerticalEnd",
          isExpanded: true,
          pages: [
            {
              title: "Post Order Template",
              pagePath: "/post-orders",
              icon: "FileText",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Knowledge Posts",
              pagePath: "/knowledge-posts",
              icon: "GraduationCap",
              roles: ["tour_admin"],
              hidden: false,
            },
            {
              title: "Manage Assets",
              pagePath: "/assets",
              icon: "Package",
              roles: ["tour_admin"],
              hidden: false,
            },
          ],
        },
        {
          title: "Monitoring",
          groupPath: "/monitoring",
          icon: "Eye",
          isExpanded: true,
          pages: [
            {
              title: "Break Log",
              pagePath: "/break-log",
              icon: "Coffee",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Activity Execution",
              pagePath: "/activity-execution",
              icon: "Activity",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Asset Log",
              pagePath: "/key-log",
              icon: "Package",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Acknowledgements",
              pagePath: "/acknowledgement",
              icon: "BadgeCheck",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
          ],
        },
        {
          title: "Reports",
          groupPath: "/reporting",
          icon: "BarChart3",
          isExpanded: true,
          pages: [
            {
              title: "Tour Report",
              pagePath: "/tour-schedule-txn",
              icon: "FileText",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "Tour Compliance",
              pagePath: "/tour-compliance",
              icon: "FileChartPie",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
            {
              title: "GPS Tracking",
              pagePath: "/gps-log",
              icon: "MapPin",
              roles: ["tour_admin", "regional_admin", "site_supervisor"],
              hidden: false,
            },
          ],
        },
      ],
    },
  ],
};
