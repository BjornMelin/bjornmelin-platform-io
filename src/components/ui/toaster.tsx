"use client";

import {
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/components/ui/toast";

/** Renders all toasts owned by the nearest Base UI toast provider. */
export function Toaster() {
  const { toasts } = useToastManager();

  return (
    <ToastPortal>
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast}>
            <ToastContent>
              <div className="grid gap-1">
                {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
              </div>
              <ToastClose />
            </ToastContent>
          </Toast>
        ))}
      </ToastViewport>
    </ToastPortal>
  );
}
