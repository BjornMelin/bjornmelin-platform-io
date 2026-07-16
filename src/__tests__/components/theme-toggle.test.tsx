import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";

describe("<ThemeToggle />", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the toggle control", () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/toggle theme/i)).toBeInTheDocument();
  });

  it("renders theme options with data attributes", async () => {
    render(<ThemeToggle />);
    fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));
    const lightItem = await screen.findByRole("menuitemradio", { name: /light/i });
    expect(lightItem).toHaveAttribute("data-theme-set", "light");
    expect(lightItem.tagName).toBe("BUTTON");
    expect(screen.getByRole("menuitemradio", { name: /dark/i })).toHaveAttribute(
      "data-theme-set",
      "dark",
    );
    expect(screen.getByRole("menuitemradio", { name: /system/i })).toHaveAttribute(
      "data-theme-set",
      "system",
    );
    expect(screen.getByRole("menuitemradio", { name: /system/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it.each([
    ["light", "Light"],
    ["dark", "Dark"],
    ["system", "System"],
  ] as const)("marks the stored %s preference as checked", async (preference, label) => {
    localStorage.setItem("theme", preference);
    render(<ThemeToggle />);

    fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));
    const items = await screen.findAllByRole("menuitemradio");

    expect(screen.getByRole("menuitemradio", { name: label })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(items.filter((item) => item.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("falls back to System for invalid stored values", async () => {
    localStorage.setItem("theme", "invalid");
    render(<ThemeToggle />);

    fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));

    expect(await screen.findByRole("menuitemradio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("falls back to System when storage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    try {
      render(<ThemeToggle />);
      fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));

      expect(await screen.findByRole("menuitemradio", { name: "System" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    } finally {
      getItem.mockRestore();
    }
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
      const darkItem = await screen.findByRole("menuitemradio", { name: /dark/i });
      act(() => darkItem.focus());

      await user.keyboard("{Enter}");

      expect(themeClicks).toContain(darkItem);
      fireEvent.mouseDown(screen.getByRole("button", { name: /toggle theme/i }));
      expect(await screen.findByRole("menuitemradio", { name: /dark/i })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    } finally {
      document.removeEventListener("click", handleClick);
    }
  });

  it("synchronizes the selected preference across mounted toggles", async () => {
    const user = userEvent.setup();
    const persistAndBroadcast = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const value = target.closest("[data-theme-set]")?.getAttribute("data-theme-set");
      if (value !== "light" && value !== "dark" && value !== "system") return;
      localStorage.setItem("theme", value);
      document.dispatchEvent(new Event("theme-preference-change"));
    };
    document.addEventListener("click", persistAndBroadcast);

    try {
      render(
        <>
          <ThemeToggle />
          <ThemeToggle />
        </>,
      );
      const [firstTrigger, secondTrigger] = screen.getAllByRole("button", {
        name: /toggle theme/i,
      });
      if (!firstTrigger || !secondTrigger) throw new Error("Expected two theme toggles");

      fireEvent.mouseDown(firstTrigger);
      await user.click(await screen.findByRole("menuitemradio", { name: "Dark" }));
      fireEvent.mouseDown(secondTrigger);
      const items = await screen.findAllByRole("menuitemradio");

      expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(items.filter((item) => item.getAttribute("aria-checked") === "true")).toHaveLength(1);
    } finally {
      document.removeEventListener("click", persistAndBroadcast);
    }
  });

  it("removes its preference-change listener when unmounted", () => {
    const addEventListener = vi.spyOn(document, "addEventListener");
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<ThemeToggle />);
    const registration = addEventListener.mock.calls.find(
      ([eventName]) => eventName === "theme-preference-change",
    );
    if (!registration) throw new Error("Expected theme preference listener registration");

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("theme-preference-change", registration[1]);
  });
});
