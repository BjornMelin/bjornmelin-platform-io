/**
 * @fileoverview Responsive site navigation bar with theme toggle.
 */

import Link from "next/link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NavSeparator = () => (
  <span aria-hidden="true" className="text-muted-foreground/30">
    |
  </span>
);
const navLinkClassName =
  "rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Top navigation with links and a mobile menu toggle.
 *
 * @returns The site navigation bar.
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
            <Link href="/" className={navLinkClassName}>
              Home
            </Link>
            <NavSeparator />
            <Link href="/about" className={navLinkClassName}>
              About
            </Link>
            <NavSeparator />
            <Link href="/projects" className={navLinkClassName}>
              Projects
            </Link>
            {/* <NavSeparator />
            <Link
              href="/blog"
              className="text-foreground/60 hover:text-foreground"
            >
              Blog
            </Link> */}
            <NavSeparator />
            <Link href="/contact" className={navLinkClassName}>
              Contact
            </Link>
            <NavSeparator />
            <ThemeToggle />
          </div>

          <MobileNav linkClassName={navLinkClassName}>
            <ThemeToggle />
          </MobileNav>
        </div>
      </div>
    </nav>
  );
}
