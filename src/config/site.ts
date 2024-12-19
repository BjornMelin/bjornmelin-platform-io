export const siteConfig = {
  name: "Bjorn Melin",
  description:
    "Personal website and blog of Bjorn Melin - Software Engineer and Tech Enthusiast",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://bjornmelin.com",
  ogImage: "https://bjornmelin.com/og.jpg",
  links: {
    twitter: "https://twitter.com/bjornmelin",
    github: "https://github.com/bjornmelin",
  },
  author: {
    name: "Bjorn Melin",
    email: "bjorn@bjornmelin.com",
  },
  nav: {
    home: "/",
    blog: "/blog",
    about: "/about",
    projects: "/projects",
    contact: "/contact",
  },
} as const;
