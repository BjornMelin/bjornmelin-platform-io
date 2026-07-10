"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

/** Groups the parts of a popover. */
const Popover = PopoverPrimitive.Root;

/** Opens the associated popover. */
const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverPositioningProps = Pick<
  PopoverPrimitive.Positioner.Props,
  "align" | "alignOffset" | "side" | "sideOffset"
>;

type PopoverContentProps = Omit<PopoverPrimitive.Popup.Props, "className"> &
  PopoverPositioningProps & {
    className?: string;
  };

/** Renders positioned popover content in a portal. */
function PopoverContent({
  className,
  align = "center",
  alignOffset,
  side,
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-72 origin-(--transform-origin) rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transition-[opacity,transform] motion-reduce:transition-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
