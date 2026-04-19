"use client";

import * as React from "react";
import { TechBadge } from "@/components/shared/tech-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ProjectTagsOverflowProps {
  hiddenTags: string[];
}

/**
 * Renders overflow project tags with an SSR-safe fallback before the popover hydrates.
 *
 * @param props - Component properties.
 * @param props.hiddenTags - Tags hidden from the inline card row.
 * @returns Overflow tags trigger or static fallback badge.
 */
export function ProjectTagsOverflow({ hiddenTags }: ProjectTagsOverflowProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const hiddenCount = hiddenTags.length;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (hiddenCount === 0) {
    return null;
  }

  if (!isMounted) {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-border/60 bg-muted/70 px-3 text-[11px] font-medium text-foreground/80 md:h-8 md:px-2 md:py-0.5">
        +{hiddenCount}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 items-center rounded-full border border-border/60 bg-muted/70 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-8 md:px-2 md:py-0.5"
          aria-label={`Show ${hiddenCount} more tags`}
          title="Show all tags"
        >
          +{hiddenCount}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" side="top" align="start">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tags
          </p>
          <div className="max-h-44 overflow-auto pr-1">
            <div className="flex flex-wrap gap-2">
              {hiddenTags.map((tag) => (
                <TechBadge key={tag} name={tag} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
