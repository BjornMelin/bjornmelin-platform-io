"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toaster";

/**
 * Root provider composition for the application.
 * Wraps children with NuqsAdapter for URL state management,
 * NextThemesProvider for theme context, and renders the Toaster.
 *
 * @param children - React children to render within the providers.
 * @returns Provider-wrapped children element.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        {children}
        <Toaster />
      </NextThemesProvider>
    </NuqsAdapter>
  );
}
