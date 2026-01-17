import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast, useToast } from "@/hooks/use-toast";

const TOAST_REMOVE_DELAY_MS = 1_000_000;

describe("useToast coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers onOpenChange, dismiss-all, and cleanup paths", async () => {
    function ToastStateView() {
      const { toasts, dismiss } = useToast();
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
          <button
            type="button"
            onClick={() => {
              toasts[0]?.onOpenChange?.(true);
            }}
          >
            Keep open
          </button>
          <button type="button" onClick={() => dismiss()}>
            Dismiss all
          </button>
          <ul aria-label="toasts">
            {toasts.map((toastItem) => (
              <li key={toastItem.id}>
                {String(toastItem.title ?? "")} [{toastItem.open === false ? "closed" : "open"}]
              </li>
            ))}
          </ul>
        </div>
      );
    }

    const view = render(<ToastStateView />);
    await act(async () => {});

    act(() => {
      toast({ title: "A" });
    });

    expect(screen.getByText("A [open]")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Keep open" }).click();
    });

    expect(screen.getByText("A [open]")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Close toast" }).click();
    });

    expect(screen.getByText("A [closed]")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Dismiss all" }).click();
    });

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY_MS + 1);
    });

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    view.unmount();
  });
});
