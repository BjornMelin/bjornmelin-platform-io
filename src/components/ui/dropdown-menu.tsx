"use client";

import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

/** Groups the parts of a dropdown menu. */
const DropdownMenu = DropdownMenuPrimitive.Root;

/** Opens the associated dropdown menu. */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/** Groups related dropdown menu items. */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

type DropdownMenuPositioningProps = Pick<
  DropdownMenuPrimitive.Positioner.Props,
  "align" | "alignOffset" | "side" | "sideOffset"
>;

type DropdownMenuContentProps = Omit<DropdownMenuPrimitive.Popup.Props, "className"> &
  DropdownMenuPositioningProps & {
    className?: string;
  };

/**
 * Renders positioned dropdown menu content in a portal.
 * @param props - Dropdown menu content properties.
 * @returns Positioned dropdown menu popup element.
 */
function DropdownMenuContent({
  className,
  align = "start",
  alignOffset,
  side = "bottom",
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[70] outline-none"
      >
        <DropdownMenuPrimitive.Popup
          className={cn(
            "z-[70] min-w-32 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-[opacity,transform] motion-reduce:transition-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
            className,
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Positioner>
    </DropdownMenuPrimitive.Portal>
  );
}

type DropdownMenuItemProps = Omit<DropdownMenuPrimitive.Item.Props, "className"> & {
  className?: string;
  inset?: boolean;
};

/**
 * Renders an interactive dropdown menu item.
 * @param props - Dropdown menu item properties.
 * @returns Styled Base UI menu item element.
 */
function DropdownMenuItem({ className, inset, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-xs px-2 py-1.5 text-sm outline-hidden transition-colors data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
};
