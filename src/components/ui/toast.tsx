"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/** Provides Base UI toast state and configurable limits. */
const ToastProvider = ToastPrimitive.Provider;

/** Portals the toast viewport to the document body by default. */
const ToastPortal = ToastPrimitive.Portal;

/** Returns the current Base UI toast manager. */
const useToastManager = ToastPrimitive.useToastManager;

type ToastViewportProps = Omit<ToastPrimitive.Viewport.Props, "className"> & {
  className?: string;
};

/** Renders the fixed viewport that contains notifications. */
function ToastViewport({ className, ...props }: ToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className,
      )}
      {...props}
    />
  );
}

type ToastProps = Omit<ToastPrimitive.Root.Props, "className"> & {
  className?: string;
};

/** Renders a manager-owned toast with type-driven styling. */
function Toast({ className, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "group pointer-events-auto relative w-full overflow-hidden rounded-md border border-border bg-background p-4 pr-6 text-foreground shadow-lg transition-[transform,opacity] motion-reduce:transition-none data-[swiping]:translate-x-[var(--toast-swipe-movement-x)] data-[swiping]:transition-none data-starting-style:-translate-y-full data-starting-style:opacity-0 data-ending-style:translate-x-full data-ending-style:opacity-0 sm:data-starting-style:translate-y-full data-[type=destructive]:border-destructive data-[type=destructive]:bg-destructive data-[type=destructive]:text-destructive-foreground",
        className,
      )}
      {...props}
    />
  );
}

type ToastContentProps = Omit<ToastPrimitive.Content.Props, "className"> & {
  className?: string;
};

/** Lays out the visible contents of a toast. */
function ToastContent({ className, ...props }: ToastContentProps) {
  return (
    <ToastPrimitive.Content
      className={cn("flex w-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

type ToastCloseProps = Omit<ToastPrimitive.Close.Props, "className"> & {
  className?: string;
};

/** Renders the button that dismisses a toast. */
function ToastClose({ className, ...props }: ToastCloseProps) {
  return (
    <ToastPrimitive.Close
      aria-label="Close notification"
      className={cn(
        "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-hover:opacity-100 group-data-[type=destructive]:text-red-300 hover:group-data-[type=destructive]:text-red-50 focus-visible:group-data-[type=destructive]:ring-red-400 focus-visible:group-data-[type=destructive]:ring-offset-red-600",
        className,
      )}
      {...props}
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </ToastPrimitive.Close>
  );
}

type ToastTitleProps = Omit<ToastPrimitive.Title.Props, "className"> & {
  className?: string;
};

/** Renders the accessible title of a toast. */
function ToastTitle({ className, ...props }: ToastTitleProps) {
  return (
    <ToastPrimitive.Title
      className={cn("text-sm font-semibold [&+p]:text-xs", className)}
      {...props}
    />
  );
}

type ToastDescriptionProps = Omit<ToastPrimitive.Description.Props, "className"> & {
  className?: string;
};

/** Renders the accessible description of a toast. */
function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return <ToastPrimitive.Description className={cn("text-sm opacity-90", className)} {...props} />;
}

export {
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
};
