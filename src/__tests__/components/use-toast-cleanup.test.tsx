import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

// We mock react to make useState spyable/mockable, as ESM exports are typically read-only.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: vi.fn(actual.useState),
  };
});

describe("useToast cleanup", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stops notifying the component after it unmounts", async () => {
    // Reset modules to ensure a fresh internal listeners array in the hook
    vi.resetModules();
    const React = await import("react");
    const { useToast, toast } = await import("@/hooks/use-toast");

    // Capture the mock setter that our mocked useState will return
    const stateSetter = vi.fn();
    (React.useState as unknown as Mock).mockReturnValue([{}, stateSetter]);

    function ToastProbe() {
      useToast();
      return null;
    }

    const { unmount } = render(<ToastProbe />);
    expect(React.useState).toHaveBeenCalled();
    stateSetter.mockClear();

    // Trigger an initial update - the setter should be called
    toast({ title: "First update" });
    expect(stateSetter).toHaveBeenCalled();
    stateSetter.mockClear();

    // Unmount - should trigger cleanup
    unmount();

    // Trigger another update - the setter should NOT be called
    toast({ title: "Second update" });
    expect(stateSetter).not.toHaveBeenCalled();
  });

  it("gracefully handles unmounts", async () => {
    vi.resetModules();
    const { useToast, toast } = await import("@/hooks/use-toast");

    function ToastProbe() {
      useToast();
      return null;
    }

    const { unmount } = render(<ToastProbe />);
    expect(() => unmount()).not.toThrow();

    // Verify toast calls after unmount don't cause errors
    expect(() => toast({ title: "After unmount" })).not.toThrow();
  });
});
