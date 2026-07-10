"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

/** Groups the parts of a select control. */
const Select = SelectPrimitive.Root;

/** Groups related select items. */
const SelectGroup = SelectPrimitive.Group;

/** Displays the selected value or placeholder. */
const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = Omit<SelectPrimitive.Trigger.Props, "className"> & {
  className?: string;
};

/** Renders the button that opens the select popup. */
function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<ChevronDown className="h-4 w-4 opacity-50" />} />
    </SelectPrimitive.Trigger>
  );
}

type SelectScrollUpArrowProps = Omit<SelectPrimitive.ScrollUpArrow.Props, "className"> & {
  className?: string;
};

function SelectScrollUpArrow({ className, ...props }: SelectScrollUpArrowProps) {
  return (
    <SelectPrimitive.ScrollUpArrow
      className={cn("top-0 flex w-full cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

type SelectScrollDownArrowProps = Omit<SelectPrimitive.ScrollDownArrow.Props, "className"> & {
  className?: string;
};

function SelectScrollDownArrow({ className, ...props }: SelectScrollDownArrowProps) {
  return (
    <SelectPrimitive.ScrollDownArrow
      className={cn(
        "bottom-0 flex w-full cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

type SelectPositioningProps = Pick<
  SelectPrimitive.Positioner.Props,
  "align" | "alignItemWithTrigger" | "alignOffset" | "side" | "sideOffset"
>;

type SelectContentProps = Omit<SelectPrimitive.Popup.Props, "className"> &
  SelectPositioningProps & {
    className?: string;
  };

/** Renders positioned select options in a portal. */
function SelectContent({
  className,
  children,
  align = "start",
  alignItemWithTrigger = false,
  alignOffset,
  side = "bottom",
  sideOffset = 4,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md transition-[opacity,transform] motion-reduce:transition-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
            className,
          )}
          {...props}
        >
          <SelectScrollUpArrow />
          <SelectPrimitive.List className="w-full p-1">{children}</SelectPrimitive.List>
          <SelectScrollDownArrow />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

type SelectItemProps = Omit<SelectPrimitive.Item.Props, "className"> & {
  className?: string;
};

/** Renders an option in the select popup. */
function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-xs py-1.5 pl-2 pr-8 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="shrink-0 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" />
          </span>
        }
      />
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue };
