"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

/**
 * Root provider composition for the application.
 * Wraps children with NuqsAdapter for URL state management and Base UI toast context.
 *
 * @param children - React children to render within the providers.
 * @returns Provider-wrapped children element.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ToastProvider limit={1}>
        {children}
        <Toaster />
      </ToastProvider>
    </NuqsAdapter>
  );
}
