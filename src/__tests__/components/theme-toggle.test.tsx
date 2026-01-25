import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("<ThemeToggle />", () => {
  it("renders the toggle control", () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/toggle theme/i)).toBeInTheDocument();
  });

  it("renders theme options with data attributes", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(screen.getByRole("menuitem", { name: /light/i })).toHaveAttribute(
      "data-theme-set",
      "light",
    );
    expect(screen.getByRole("menuitem", { name: /dark/i })).toHaveAttribute(
      "data-theme-set",
      "dark",
    );
    expect(screen.getByRole("menuitem", { name: /system/i })).toHaveAttribute(
      "data-theme-set",
      "system",
    );
  });

  it("opens the menu when activated", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
