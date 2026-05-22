"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommandCopyButtonProps {
  command: string;
  label: string;
  className?: string;
}

async function writeClipboardText(command: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.");
  }
  await navigator.clipboard.writeText(command);
}

/**
 * Renders an accessible button for copying an install command.
 * @param command - Command string copied to the clipboard.
 * @param label - Accessible label suffix for the command.
 * @param className - Optional additional class names for the button.
 * @returns Copy command button element.
 */
export function CommandCopyButton({ command, label, className }: CommandCopyButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "copied" | "failed">("idle");

  React.useEffect(() => {
    if (status === "idle") return undefined;
    const timeout = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleCopy = React.useCallback(() => {
    writeClipboardText(command).then(
      () => setStatus("copied"),
      () => setStatus("failed"),
    );
  }, [command]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full md:h-9 md:w-9"
        onClick={handleCopy}
        aria-label={`Copy ${label} install command`}
      >
        {status === "copied" ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied"
          ? `${label} command copied.`
          : status === "failed"
            ? `${label} command could not be copied.`
            : ""}
      </span>
    </div>
  );
}
