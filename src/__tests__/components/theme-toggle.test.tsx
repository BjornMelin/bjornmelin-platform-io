/**
 * @fileoverview Unit tests for ThemeToggle interactions.
 */
import { render, screen } from "@testing-library/react";
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

  // Interaction with Radix dropdown is covered via integration tests elsewhere.
});
