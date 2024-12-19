export const dashboardConfig = {
  mainNav: [
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "Admin",
      href: "/admin",
    },
  ],
  sidebarNav: [
    {
      title: "Blog Posts",
      href: "/admin/blog",
      icon: "post",
    },
    {
      title: "Projects",
      href: "/admin/projects",
      icon: "project",
    },
    {
      title: "Media",
      href: "/admin/media",
      icon: "media",
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: "chart",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: "settings",
    },
  ],
} as const;
