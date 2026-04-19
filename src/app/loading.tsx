import { Loader2 } from "lucide-react";

/**
 * Full-screen loading spinner displayed during route transitions.
 * @returns Loading indicator element.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
      <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
