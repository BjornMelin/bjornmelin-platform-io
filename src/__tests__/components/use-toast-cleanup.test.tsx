import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("useToast cleanup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes listener from internal array on unmount", async () => {
    vi.resetModules();
    const spliceSpy = vi.spyOn(Array.prototype, "splice");
    const { useToast } = await import("@/hooks/use-toast");

    function ToastProbe() {
      useToast();
      return null;
    }

    const { unmount } = render(<ToastProbe />);
    unmount();

    expect(spliceSpy).toHaveBeenCalled();
  });

  it("gracefully handles unmount if listener index is not found", async () => {
    vi.resetModules();
    const indexOfSpy = vi.spyOn(Array.prototype, "indexOf").mockReturnValue(-1);
    const spliceSpy = vi.spyOn(Array.prototype, "splice");
    const { useToast } = await import("@/hooks/use-toast");

    function ToastProbe() {
      useToast();
      return null;
    }

    const { unmount } = render(<ToastProbe />);
    unmount();

    expect(indexOfSpy).toHaveBeenCalled();
    expect(spliceSpy).not.toHaveBeenCalled();
  });
});
