"use client";

/**
 * @fileoverview Thin wrapper around next-themes ThemeProvider to keep a single
 * export location within the app and enable consistent props.
 */

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Provider component that sets up theme context for the app.
 *
 * @param children Descendant nodes to render within the provider.
 * @param props Additional ThemeProvider options (e.g., attribute, defaultTheme).
 * @returns The themed React subtree.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
