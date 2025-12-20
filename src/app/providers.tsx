"use client";

import { LazyMotion } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

/**
 * Lazy-loaded framer-motion features for reduced bundle size (~32KB → ~5KB).
 * Uses domAnimation which includes opacity, transform, and layout animations.
 */
const loadFeatures = () => import("@/lib/framer-features").then((mod) => mod.domAnimation());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </NextThemesProvider>
    </LazyMotion>
  );
}
