/**
 * @fileoverview Responsive site navigation bar with theme toggle.
 */

import Link from "next/link";
import * as React from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type MobileNavIcon = "home" | "user" | "briefcase" | "mail";

const NavSeparator = () => (
  <span aria-hidden="true" className="text-muted-foreground/30">
    |
  </span>
);
const navLinkClassName =
  "rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const navItems = [
  {
    href: "/",
    label: "Home",
    description: "Overview and highlights",
    icon: "home" as MobileNavIcon,
  },
  {
    href: "/about",
    label: "About",
    description: "Bio and expertise",
    icon: "user" as MobileNavIcon,
  },
  {
    href: "/projects",
    label: "Projects",
    description: "GitHub repos, open-source, and experiments",
    icon: "briefcase" as MobileNavIcon,
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Let's build together",
    icon: "mail" as MobileNavIcon,
  },
];

/**
 * Renders the site navigation bar.
 * @returns Navigation bar element.
 */
export function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="rounded-xs text-xl font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Bjorn Melin | Portfolio
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            {navItems.map((item, index) => (
              <React.Fragment key={item.href}>
                <Link href={item.href} className={navLinkClassName}>
                  {item.label}
                </Link>
                {index < navItems.length - 1 ? <NavSeparator /> : null}
              </React.Fragment>
            ))}
            {/* <NavSeparator />
            <Link
              href="/blog"
              className="text-foreground/60 hover:text-foreground"
            >
              Blog
            </Link> */}
            <NavSeparator />
            <ThemeToggle />
          </div>

          <MobileNav linkClassName={navLinkClassName} items={navItems}>
            <ThemeToggle />
          </MobileNav>
        </div>
      </div>
    </nav>
  );
}
