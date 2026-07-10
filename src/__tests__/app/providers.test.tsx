import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("nuqs/adapters/next/app", () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="nuqs-adapter">{children}</div>
  ),
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

  it("wraps children with NuqsAdapter", () => {
    render(
      <Providers>
        <div data-testid="child">Content</div>
      </Providers>,
    );

    expect(screen.getByTestId("nuqs-adapter")).toBeInTheDocument();
    expect(screen.getByTestId("nuqs-adapter")).toContainElement(screen.getByTestId("child"));
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
