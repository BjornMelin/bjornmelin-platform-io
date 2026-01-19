/**
 * @fileoverview Theme toggle built with native HTML -- avoids client JS bundles.
 * Theme changes are handled by ThemeScript via data-theme-set attributes.
 */

import { Moon, Sun } from "lucide-react";

/**
 * Renders a native details-based theme chooser wired via data-theme-set.
 * @returns {JSX.Element} Theme toggle control.
 */
export function ThemeToggle() {
  return (
    <details className="relative">
      <summary
        aria-label="Toggle theme"
        className="list-none rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
      >
        <Sun
          aria-hidden="true"
          className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
        />
        <Moon
          aria-hidden="true"
          className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
        />
        <span className="sr-only">Toggle theme</span>
      </summary>
      <div className="absolute right-0 mt-2 w-36 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
        <button
          type="button"
          data-theme-set="light"
          className="w-full rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          Light
        </button>
        <button
          type="button"
          data-theme-set="dark"
          className="w-full rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          Dark
        </button>
        <button
          type="button"
          data-theme-set="system"
          className="w-full rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          System
        </button>
      </div>
    </details>
  );
}
