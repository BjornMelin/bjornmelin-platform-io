"use client";

import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Props for the {@link ExpandableText} component.
 *
 * @remarks
 * `children` provides the text content to render, and `className` is optional.
 *
 * @property children - Text content to render inside the component.
 * @property className - Optional additional CSS classes for styling.
 */
interface ExpandableTextProps {
  children: string;
  className?: string;
}

/**
 * Text component that truncates to 3 lines with a "Show more" toggle.
 * Only shows the toggle when the text is actually truncated.
 *
 * @param props - The {@link ExpandableTextProps} for {@link ExpandableText}.
 * @param props.children - String text content to be displayed.
 * @param props.className - Optional CSS class string for styling.
 * @returns A JSX.Element representing the truncatable text component.
 */
export function ExpandableText({ children, className }: ExpandableTextProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  const checkTruncation = React.useCallback(() => {
    const el = textRef.current;
    if (!el || isOpen) return;
    const isOverflowing = el.scrollHeight > el.clientHeight + 1;
    React.startTransition(() => {
      setIsTruncated(isOverflowing);
    });
  }, [isOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: children updates should re-measure truncation.
  React.useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    checkTruncation();

    const observer = new ResizeObserver(() => {
      checkTruncation();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [children, isOpen]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleContent asChild forceMount>
        <p
          ref={textRef}
          className={cn("min-w-0 break-words", className, !isOpen && "line-clamp-3")}
        >
          {children}
        </p>
      </CollapsibleContent>
      {isTruncated && (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="mt-1 inline-flex h-11 items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-6"
          >
            {isOpen ? "Show Less" : "Show More"}
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
