import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as ToastModule from "@/hooks/use-toast";
import { TOAST_REMOVE_DELAY } from "@/hooks/use-toast";

type ToastControls = ReturnType<typeof ToastModule.toast>;
type ToastUpdateArg = Parameters<ToastControls["update"]>[0];

describe("useToast() + toast()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a toast and enforces the global limit", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts } = toastMod.useToast();
      return (
        <ul aria-label="toasts">
          {toasts.map((toast) => (
            <li key={toast.id}>
              {String(toast.title ?? "")} [{toast.open === false ? "closed" : "open"}]
            </li>
          ))}
        </ul>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    act(() => {
      toastMod.toast({ title: "A" });
    });

    expect(screen.getByText("A [open]")).toBeInTheDocument();

    act(() => {
      toastMod.toast({ title: "B" });
    });

    expect(screen.queryByText("A [open]")).not.toBeInTheDocument();
    expect(screen.getByText("B [open]")).toBeInTheDocument();
  });

  it("supports updating an existing toast by id", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts } = toastMod.useToast();
      return (
        <ul aria-label="toasts">
          {toasts.map((toast) => (
            <li key={toast.id}>{String(toast.title ?? "")}</li>
          ))}
        </ul>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    let controls!: ToastControls;
    act(() => {
      controls = toastMod.toast({ title: "A" });
    });

    act(() => {
      controls.update({ id: controls.id, title: "Updated", open: true } as ToastUpdateArg);
    });

    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("dismisses a toast immediately and removes it after the delay", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts } = toastMod.useToast();
      return (
        <ul aria-label="toasts">
          {toasts.map((toast) => (
            <li key={toast.id}>
              {String(toast.title ?? "")} [{toast.open === false ? "closed" : "open"}]
            </li>
          ))}
        </ul>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    let controls!: ToastControls;
    act(() => {
      controls = toastMod.toast({ title: "A" });
    });

    act(() => {
      controls.dismiss();
    });

    expect(screen.getByText("A [closed]")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY + 1);
    });

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("dismisses all toasts when dismiss() is called without an id", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts, dismiss } = toastMod.useToast();
      return (
        <div>
          <button type="button" onClick={() => dismiss()}>
            Dismiss all
          </button>
          <ul aria-label="toasts">
            {toasts.map((toast) => (
              <li key={toast.id}>
                {String(toast.title ?? "")} [{toast.open === false ? "closed" : "open"}]
              </li>
            ))}
          </ul>
        </div>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    act(() => {
      toastMod.toast({ title: "A" });
    });

    expect(screen.getByText("A [open]")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Dismiss all" }).click();
    });

    expect(screen.getByText("A [closed]")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY + 1);
    });

    // Ensure empty state and that we exercised the reducer "dismiss all" path.
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("invokes onOpenChange(false) to dismiss a toast", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts } = toastMod.useToast();
      return (
        <div>
          <button
            type="button"
            onClick={() => {
              toasts[0]?.onOpenChange?.(false);
            }}
          >
            Close toast
          </button>
          <ul aria-label="toasts">
            {toasts.map((toast) => (
              <li key={toast.id}>
                {String(toast.title ?? "")} [{toast.open === false ? "closed" : "open"}]
              </li>
            ))}
          </ul>
        </div>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    act(() => {
      toastMod.toast({ title: "A" });
    });

    expect(screen.getByText("A [open]")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Close toast" }).click();
    });

    expect(screen.getByText("A [closed]")).toBeInTheDocument();
  });

  it("does not double-schedule removal for repeated dismiss calls", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      const { toasts } = toastMod.useToast();
      return (
        <ul aria-label="toasts">
          {toasts.map((toast) => (
            <li key={toast.id}>
              {String(toast.title ?? "")} [{toast.open === false ? "closed" : "open"}]
            </li>
          ))}
        </ul>
      );
    }

    render(<ToastStateView />);
    await act(async () => {});

    let controls!: ToastControls;
    act(() => {
      controls = toastMod.toast({ title: "A" });
    });

    act(() => {
      controls.dismiss();
      controls.dismiss();
    });

    expect(screen.getByText("A [closed]")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY + 1);
    });

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("cleans up listeners on unmount", async () => {
    const toastMod = await import("@/hooks/use-toast");

    function ToastStateView() {
      toastMod.useToast();
      return <div>Mounted</div>;
    }

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(<ToastStateView />);
    await act(async () => {});

    view.unmount();
    expect(screen.queryByText("Mounted")).toBeNull();

    act(() => {
      toastMod.toast({ title: "A" });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
