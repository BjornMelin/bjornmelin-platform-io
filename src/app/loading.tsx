import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is appropriate for loading feedback.
    <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
      <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
