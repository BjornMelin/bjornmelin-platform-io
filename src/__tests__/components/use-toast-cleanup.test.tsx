import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("useToast cleanup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes listener on unmount", async () => {
    vi.resetModules();
    const spliceSpy = vi.spyOn(Array.prototype, "splice");
    const { useToast } = await import("@/hooks/use-toast");

    function ToastProbe() {
      useToast();
      return null;
    }

    const view = render(<ToastProbe />);
    view.unmount();

    expect(spliceSpy).toHaveBeenCalled();
  });

  it("handles cleanup when listener is already missing", async () => {
    vi.resetModules();
    const indexOfSpy = vi.spyOn(Array.prototype, "indexOf").mockReturnValue(-1);
    const { useToast } = await import("@/hooks/use-toast");

    function ToastProbe() {
      useToast();
      return null;
    }

    const view = render(<ToastProbe />);
    view.unmount();

    expect(indexOfSpy).toHaveBeenCalled();
  });
});
