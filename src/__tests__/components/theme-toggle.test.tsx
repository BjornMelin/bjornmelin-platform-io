import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("<ThemeToggle />", () => {
  it("renders the toggle control", () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/toggle theme/i)).toBeInTheDocument();
  });

  it("renders theme options with data attributes", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /light/i })).toHaveAttribute(
      "data-theme-set",
      "light",
    );
    expect(screen.getByRole("button", { name: /dark/i })).toHaveAttribute("data-theme-set", "dark");
    expect(screen.getByRole("button", { name: /system/i })).toHaveAttribute(
      "data-theme-set",
      "system",
    );
  });

  it("opens the menu when activated", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const summary = screen.getByText(/toggle theme/i).closest("summary");
    expect(summary).not.toBeNull();

    const details = summary?.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    await user.click(summary as HTMLElement);
    expect(details).toHaveAttribute("open");
  });
});
