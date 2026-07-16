"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type ThemePreference = (typeof themeOptions)[number]["value"];

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem("theme");
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

/**
 * Renders a theme chooser wired via data-theme-set.
 * @returns Theme toggle control.
 */
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredThemePreference);

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (open) setPreference(getStoredThemePreference());
      }}
    >
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
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => {
            if (isThemePreference(value)) setPreference(value);
          }}
        >
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              closeOnClick
              nativeButton
              render={<button type="button" data-theme-set={option.value} />}
              className="w-full text-left text-sm"
            >
              <DropdownMenuRadioItemIndicator
                keepMounted
                className="flex size-4 items-center justify-center data-unchecked:invisible [&>svg]:size-4"
              >
                <Check aria-hidden="true" />
              </DropdownMenuRadioItemIndicator>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
