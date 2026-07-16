"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Groups the parts of a sheet dialog. */
const Sheet = SheetPrimitive.Root;

/** Opens the associated sheet dialog. */
const SheetTrigger = SheetPrimitive.Trigger;

/** Portals sheet content to the document body by default. */
const SheetPortal = SheetPrimitive.Portal;

type SheetOverlayProps = Omit<SheetPrimitive.Backdrop.Props, "className"> & {
  className?: string;
};

/** Renders the dimmed backdrop behind a sheet. */
function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-[60] bg-black/80 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  "fixed z-[60] gap-4 overscroll-contain border-border bg-background p-6 shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none data-ending-style:duration-200",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-starting-style:-translate-y-full data-ending-style:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 border-t data-starting-style:translate-y-full data-ending-style:translate-y-full",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-starting-style:-translate-x-full data-ending-style:-translate-x-full sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-starting-style:translate-x-full data-ending-style:translate-x-full sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type SheetContentProps = Omit<SheetPrimitive.Popup.Props, "className"> &
  VariantProps<typeof sheetVariants> & {
    className?: string;
  };

/**
 * Renders the positioned sheet panel and its close button.
 * @param props - Sheet content properties.
 * @returns Positioned Base UI dialog popup element.
 */
function SheetContent({ side = "right", className, children, ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup className={cn(sheetVariants({ side }), className)} {...props}>
        <SheetPrimitive.Close
          aria-label="Close"
          className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

/**
 * Renders the header area of a sheet.
 * @param props - Sheet header properties.
 * @returns Styled sheet header element.
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
  );
}

type SheetTitleProps = Omit<SheetPrimitive.Title.Props, "className"> & { className?: string };

/**
 * Renders the accessible title for a sheet.
 * @param props - Sheet title properties.
 * @returns Accessible Base UI dialog title element.
 */
function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <SheetPrimitive.Title
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

type SheetDescriptionProps = Omit<SheetPrimitive.Description.Props, "className"> & {
  className?: string;
};

/**
 * Renders the accessible description for a sheet.
 * @param props - Sheet description properties.
 * @returns Accessible Base UI dialog description element.
 */
function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger };
