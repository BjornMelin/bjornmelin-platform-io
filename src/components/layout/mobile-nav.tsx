"use client";

import { Briefcase, Home, Mail, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation menu using a sheet overlay.
 * Automatically closes on route changes and link clicks.
 *
 * @param props.linkClassName - CSS classes to apply to navigation links.
 * @param props.items - Navigation items to render in the mobile menu.
 * @param props.children - Additional content to render in the menu (e.g., ThemeToggle).
 * @returns The mobile navigation component.
 */
export function MobileNav({
  linkClassName,
  items,
  children,
}: {
  linkClassName: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
    icon: "home" | "user" | "briefcase" | "mail";
  }>;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close on route changes
  React.useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  const mobileLinkClassName = cn(
    linkClassName,
    "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  const mobileThemeWrapperClassName = cn(
    "flex w-full items-center justify-between rounded-md px-3 py-3 text-base",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-within:outline-hidden focus-within:ring-2 focus-within:ring-ring",
    "focus-within:ring-offset-2 focus-within:ring-offset-background",
  );

  const normalizedPathname = pathname?.replace(/\/$/, "") || "/";
  const iconMap = React.useMemo(
    () => ({
      home: Home,
      user: User,
      briefcase: Briefcase,
      mail: Mail,
    }),
    [],
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="rounded-md p-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[85vw] max-w-[360px] overflow-y-auto overscroll-contain sm:w-80"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Explore Bjorn's portfolio.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Main
        </div>
        <nav
          aria-label="Mobile primary"
          className="mt-3 flex flex-col gap-2"
          data-testid="mobile-nav"
        >
          {items.map((item) => {
            const isActive =
              normalizedPathname === (item.href === "/" ? "/" : item.href.replace(/\/$/, ""));
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  mobileLinkClassName,
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
                )}
                onClick={closeMenu}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground transition-colors",
                    isActive
                      ? "border-border bg-background text-foreground"
                      : "group-hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span
                    className={cn(
                      "text-xs text-muted-foreground transition-colors",
                      isActive ? "text-accent-foreground/80" : "group-hover:text-foreground/70",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
        <Separator className="my-4" />
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Preferences
        </div>
        <div className="mt-3">
          <div className={mobileThemeWrapperClassName}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Theme</span>
              <span className="text-xs text-muted-foreground">Light, dark, or system</span>
            </div>
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
