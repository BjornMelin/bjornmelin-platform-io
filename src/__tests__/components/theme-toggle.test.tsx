import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("<ThemeToggle />", () => {
  it("renders the toggle control", () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/toggle theme/i)).toBeInTheDocument();
  });

  it("renders theme options with data attributes", async () => {
    render(<ThemeToggle />);
    fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));
    expect(await screen.findByRole("menuitem", { name: /light/i })).toHaveAttribute(
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
    render(<ThemeToggle />);

    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.mouseDown(trigger);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });
});
