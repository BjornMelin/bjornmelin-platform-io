import { render, screen } from "@testing-library/react";
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
});
