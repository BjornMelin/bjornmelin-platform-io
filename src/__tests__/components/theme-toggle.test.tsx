import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("<ThemeToggle />", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it("renders the toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("enables button after hydration", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens dropdown menu when clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    await user.click(button);

    expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();
  });

  it("calls setTheme with correct value when menu items are clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
    mockSetTheme.mockClear();

    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
    mockSetTheme.mockClear();

    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: /system/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
