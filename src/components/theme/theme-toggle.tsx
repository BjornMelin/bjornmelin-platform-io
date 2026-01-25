"use client";

/**
 * @fileoverview Theme toggle built with a dropdown menu.
 * Theme changes are handled by ThemeScript via data-theme-set attributes.
 */

import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Renders a theme chooser wired via data-theme-set.
 * @returns {JSX.Element} Theme toggle control.
 */
export function ThemeToggle() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle theme"
          className="relative rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Sun
            aria-hidden="true"
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
          />
          <Moon
            aria-hidden="true"
            className="absolute left-2 top-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem asChild>
          <button type="button" data-theme-set="light" className="w-full text-left text-sm">
            Light
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button type="button" data-theme-set="dark" className="w-full text-left text-sm">
            Dark
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button type="button" data-theme-set="system" className="w-full text-left text-sm">
            System
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
