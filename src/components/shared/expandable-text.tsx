"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  children: string;
  className?: string;
}

/**
 * Text component that truncates to 3 lines with a "Show more" toggle.
 * Only shows the toggle when the text is actually truncated.
 */
export function ExpandableText({ children, className }: ExpandableTextProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: children is needed to re-measure truncation when text changes
  React.useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [children]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <p ref={textRef} className={cn(className, !isOpen && "line-clamp-3")}>
        {children}
      </p>
      {isTruncated && (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {isOpen ? "Show less" : "Show more"}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform motion-reduce:transition-none",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
}
