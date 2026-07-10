import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "select-none text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

type LabelProps = React.ComponentProps<"label"> & VariantProps<typeof labelVariants>;

/** Renders a native label with the site label styles. */
function Label({ className, ...props }: LabelProps) {
  // biome-ignore lint/a11y/noLabelWithoutControl: Consumers provide htmlFor or nest a control.
  return <label className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
