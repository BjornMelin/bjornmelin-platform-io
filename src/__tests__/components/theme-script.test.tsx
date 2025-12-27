import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeScript } from "@/components/theme/theme-script";

describe("<ThemeScript />", () => {
  it("renders a script element", () => {
    const { container } = render(<ThemeScript />);
    expect(container.querySelector("script")).toBeInTheDocument();
  });

  it("contains theme initialization IIFE", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script?.innerHTML).toContain("(function()");
    expect(script?.innerHTML).toContain("getTheme");
    expect(script?.innerHTML).toContain("applyTheme");
  });

  it("reads theme from localStorage", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script?.innerHTML).toContain("localStorage.getItem('theme')");
  });

  it("checks system preference via matchMedia", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script?.innerHTML).toContain("matchMedia('(prefers-color-scheme: dark)')");
  });

  it("toggles dark class on documentElement", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script?.innerHTML).toContain("classList.toggle('dark'");
  });

  it("listens for system preference changes", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script?.innerHTML).toContain("addEventListener('change'");
  });
});

describe("theme initialization logic", () => {
  let mockLocalStorage: Record<string, string>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  const createMatchMediaResult = (matches: boolean) => ({
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  beforeEach(() => {
    mockLocalStorage = {};
    mockMatchMedia = vi.fn(() => createMatchMediaResult(false));

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const classList = new Set<string>();
    vi.stubGlobal("document", {
      ...document,
      documentElement: {
        ...document.documentElement,
        classList: {
          add: (className: string) => classList.add(className),
          remove: (className: string) => classList.delete(className),
          toggle: (className: string, force?: boolean) => {
            if (force === true) {
              classList.add(className);
              return true;
            }
            if (force === false) {
              classList.delete(className);
              return false;
            }
            if (classList.has(className)) {
              classList.delete(className);
              return false;
            }
            classList.add(className);
            return true;
          },
          contains: (className: string) => classList.has(className),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Equivalent to inline script's getTheme function
  const getTheme = (): "dark" | "light" => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") return "dark";
      if (stored === "light") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  };

  // Equivalent to inline script's applyTheme function
  const applyTheme = (theme: "dark" | "light") => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  describe("getTheme()", () => {
    it("returns dark when stored theme is dark", () => {
      mockLocalStorage.theme = "dark";
      expect(getTheme()).toBe("dark");
    });

    it("returns light when stored theme is light", () => {
      mockLocalStorage.theme = "light";
      expect(getTheme()).toBe("light");
    });

    it("returns dark when stored theme is system and system prefers dark", () => {
      mockLocalStorage.theme = "system";
      mockMatchMedia.mockReturnValue(createMatchMediaResult(true));
      expect(getTheme()).toBe("dark");
    });

    it("returns system preference when no stored theme", () => {
      mockMatchMedia.mockReturnValue(createMatchMediaResult(true));
      expect(getTheme()).toBe("dark");

      mockMatchMedia.mockReturnValue(createMatchMediaResult(false));
      expect(getTheme()).toBe("light");
    });

    it("returns light when localStorage throws", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("localStorage unavailable");
        },
      });
      expect(getTheme()).toBe("light");
    });
  });

  describe("applyTheme()", () => {
    it("adds dark class when theme is dark", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes dark class when theme is light", () => {
      document.documentElement.classList.add("dark");
      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("toggles correctly between themes", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("system preference change handler", () => {
    // Equivalent to inline script's change event handler
    const handleSystemPreferenceChange = (e: { matches: boolean }) => {
      try {
        const stored = localStorage.getItem("theme");
        if (stored === "system" || !stored) {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch {
        // Silently ignore errors
      }
    };

    it("applies dark when system changes to dark and theme is system", () => {
      mockLocalStorage.theme = "system";
      handleSystemPreferenceChange({ matches: true });
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("applies light when system changes to light and theme is system", () => {
      mockLocalStorage.theme = "system";
      document.documentElement.classList.add("dark");
      handleSystemPreferenceChange({ matches: false });
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("applies theme when no stored preference", () => {
      handleSystemPreferenceChange({ matches: true });
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("ignores system change when user explicitly chose dark", () => {
      mockLocalStorage.theme = "dark";
      document.documentElement.classList.add("dark");
      handleSystemPreferenceChange({ matches: false });
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("ignores system change when user explicitly chose light", () => {
      mockLocalStorage.theme = "light";
      handleSystemPreferenceChange({ matches: true });
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });
});

describe("theme barrel exports", () => {
  it("exports ThemeScript", async () => {
    const themeModule = await import("@/components/theme");
    expect(themeModule.ThemeScript).toBeDefined();
    expect(typeof themeModule.ThemeScript).toBe("function");
  });

  it("exports ThemeProvider", async () => {
    const themeModule = await import("@/components/theme");
    expect(themeModule.ThemeProvider).toBeDefined();
  });

  it("exports ThemeToggle", async () => {
    const themeModule = await import("@/components/theme");
    expect(themeModule.ThemeToggle).toBeDefined();
  });
});
