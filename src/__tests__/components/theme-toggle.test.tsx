import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    const lightItem = await screen.findByRole("menuitem", { name: /light/i });
    expect(lightItem).toHaveAttribute("data-theme-set", "light");
    expect(lightItem.tagName).toBe("BUTTON");
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

  it("emits a bubbling click when a theme item is activated by keyboard", async () => {
    const user = userEvent.setup();
    const themeClicks: Element[] = [];
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-theme-set]")) {
        themeClicks.push(target.closest("[data-theme-set]") as Element);
      }
    };
    document.addEventListener("click", handleClick);

    try {
      render(<ThemeToggle />);
      fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));
      const darkItem = await screen.findByRole("menuitem", { name: /dark/i });
      act(() => darkItem.focus());

      await user.keyboard("{Enter}");

      expect(themeClicks).toContain(darkItem);
    } finally {
      document.removeEventListener("click", handleClick);
    }
  });
});
