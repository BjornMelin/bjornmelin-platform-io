import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <output className="flex items-center justify-center min-h-screen" aria-live="polite">
      <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </output>
  );
}
