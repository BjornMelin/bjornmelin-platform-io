export const navConfig = {
  main: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "Projects",
      href: "/projects",
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Contact",
      href: "/contact",
    },
  ],
  footer: [
    {
      title: "Social",
      items: [
        {
          title: "Twitter",
          href: "https://twitter.com/bjornmelin",
          external: true,
        },
        {
          title: "GitHub",
          href: "https://github.com/bjornmelin",
          external: true,
        },
        {
          title: "LinkedIn",
          href: "https://linkedin.com/in/bjornmelin",
          external: true,
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Blog",
          href: "/blog",
        },
        {
          title: "Projects",
          href: "/projects",
        },
        {
          title: "Contact",
          href: "/contact",
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          title: "Privacy",
          href: "/privacy",
        },
        {
          title: "Terms",
          href: "/terms",
        },
      ],
    },
  ],
} as const;
