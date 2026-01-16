/**
 * @fileoverview Tests for ErrorBoundary fallback and recovery behavior.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/shared/error-boundary";

describe("ErrorBoundary", () => {
  it("derives error state from thrown error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const state = ErrorBoundary.getDerivedStateFromError(new Error("boom"));
      expect(state).toEqual({ hasError: true });
    } finally {
      consoleError.mockRestore();
    }
  });

  it("renders fallback UI when hasError is true", () => {
    class TestBoundary extends ErrorBoundary {
      public state = { hasError: true };
    }

    render(
      <TestBoundary>
        <div>Child</div>
      </TestBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
  });

  // Clicking the refresh button triggers a page reload in browsers; asserting
  // fallback rendering is sufficient for unit scope here.
});
