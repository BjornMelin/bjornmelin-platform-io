"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import {
  DEFAULT_FLAGS,
  FeatureFlagProvider,
  LocalStorageFeatureFlagStore,
} from "@/lib/feature-flags/client-exports";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [featureFlagStore] = useState(() => {
    // Initialize with default flags
    const store = new LocalStorageFeatureFlagStore();
    // Load default flags on first run
    if (typeof window !== "undefined") {
      DEFAULT_FLAGS.forEach((flag) => {
        store.set(flag).catch(console.error);
      });
    }
    return store;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FeatureFlagProvider
          config={{
            store: featureFlagStore,
            enableCache: true,
            cacheTimeout: 60000, // 1 minute
          }}
        >
          {children}
          <Toaster />
        </FeatureFlagProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
