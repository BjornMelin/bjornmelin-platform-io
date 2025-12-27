/**
 * @fileoverview Unit tests for ThemeToggle interactions.
 */
import { render, screen, waitFor } from "@testing-library/react";
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

    // Wait for useEffect to run and set mounted to true
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /toggle theme/i })).not.toBeDisabled();
    });

    const button = screen.getByRole("button", { name: /toggle theme/i });
    // Button should have dropdown trigger attributes
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens dropdown menu when clicked after mounting", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // Wait for component to finish mounting
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /toggle theme/i })).not.toBeDisabled();
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
