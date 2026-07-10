"use client";

import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Renders a theme chooser wired via data-theme-set.
 * @returns Theme toggle control.
 */
export function ThemeToggle() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Toggle theme"
            className="relative inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        }
      >
        <Sun
          aria-hidden="true"
          className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
        />
        <Moon
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem
            nativeButton
            render={<button type="button" data-theme-set="light" />}
            className="w-full text-left text-sm"
          >
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton
            render={<button type="button" data-theme-set="dark" />}
            className="w-full text-left text-sm"
          >
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton
            render={<button type="button" data-theme-set="system" />}
            className="w-full text-left text-sm"
          >
            System
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
