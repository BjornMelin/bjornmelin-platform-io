import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next-themes to avoid matchMedia issues
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock Toaster
vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Import after mocks
import { Providers } from "@/app/providers";

describe("Providers", () => {
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
    // Child should be inside the theme provider
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

  it("renders multiple children correctly", () => {
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
