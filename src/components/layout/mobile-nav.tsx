"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Mobile navigation menu using a details/summary disclosure pattern.
 * Automatically closes on route changes and link clicks.
 *
 * @param props.linkClassName - CSS classes to apply to navigation links.
 * @param props.children - Additional content to render in the menu (e.g., ThemeToggle).
 * @returns The mobile navigation component.
 */
export function MobileNav({
  linkClassName,
  children,
}: {
  linkClassName: string;
  children: React.ReactNode;
}) {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const closeMenu = React.useCallback(() => {
    detailsRef.current?.removeAttribute("open");
    setIsOpen(false);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close on route changes
  React.useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  return (
    <details
      ref={detailsRef}
      className="group md:hidden"
      onToggle={() => setIsOpen(detailsRef.current?.open ?? false)}
    >
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: summary needs explicit expanded state */}
      <summary
        className="list-none rounded-md p-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
      >
        <Menu size={24} aria-hidden="true" className="block group-open:hidden" />
        <X size={24} aria-hidden="true" className="hidden group-open:block" />
      </summary>
      <div id="mobile-nav-panel" className="py-4" data-testid="mobile-nav">
        <div className="flex flex-col gap-4">
          <Link href="/" className={linkClassName} onClick={closeMenu}>
            Home
          </Link>
          <Link href="/about" className={linkClassName} onClick={closeMenu}>
            About
          </Link>
          <Link href="/projects" className={linkClassName} onClick={closeMenu}>
            Projects
          </Link>
          <Link href="/contact" className={linkClassName} onClick={closeMenu}>
            Contact
          </Link>
          <div className="flex items-center">{children}</div>
        </div>
      </div>
    </details>
  );
}
