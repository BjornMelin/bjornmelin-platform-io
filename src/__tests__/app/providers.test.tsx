import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let capturedThemeProviderProps: Record<string, unknown> = {};

vi.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    capturedThemeProviderProps = props;
    return <div data-testid="theme-provider">{children}</div>;
  },
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

import { Providers } from "@/app/providers";

describe("<Providers />", () => {
  it("renders children", () => {
    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("wraps children with ThemeProvider", () => {
    render(
      <Providers>
        <div data-testid="child">Content</div>
      </Providers>,
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toContainElement(screen.getByTestId("child"));
  });

  it("includes Toaster component", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <Providers>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </Providers>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});

describe("<Providers /> ThemeProvider config", () => {
  it("uses storageKey=theme for static export sync", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(capturedThemeProviderProps.storageKey).toBe("theme");
  });

  it("uses attribute=class for Tailwind", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(capturedThemeProviderProps.attribute).toBe("class");
  });

  it("defaults to system theme", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(capturedThemeProviderProps.defaultTheme).toBe("system");
  });

  it("enables system preference detection", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(capturedThemeProviderProps.enableSystem).toBe(true);
  });

  it("disables transitions on theme change", () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );

    expect(capturedThemeProviderProps.disableTransitionOnChange).toBe(true);
  });
});
