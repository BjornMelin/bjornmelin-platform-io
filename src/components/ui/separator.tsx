"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

type SeparatorProps = Omit<SeparatorPrimitive.Props, "className"> & { className?: string };

/**
 * Renders an accessible horizontal or vertical separator.
 * @param props - Separator properties, including orientation and class names.
 * @returns Styled Base UI separator element.
 */
function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
