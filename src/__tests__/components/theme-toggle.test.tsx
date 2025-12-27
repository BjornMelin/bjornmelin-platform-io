/**
 * @fileoverview Unit tests for ThemeToggle interactions.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("ThemeToggle", () => {
  it("renders the toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("renders interactive button after hydration", async () => {
    render(<ThemeToggle />);

    // After render, useEffect runs and sets mounted to true
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const button = screen.getByRole("button", { name: /toggle theme/i });
    // Button should be interactive (not disabled) after mounting
    expect(button).not.toBeDisabled();
    // Button should have dropdown trigger attributes
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens dropdown menu when clicked after mounting", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // Wait for mounting
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    // Dropdown menu items should be visible
    expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();
  });

  // Note: Testing SSR placeholder rendering requires server-side testing
  // which is covered via integration/e2e tests.
});
