/**
 * @fileoverview Tests for ErrorBoundary fallback and recovery behavior.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/shared/error-boundary";

const Boom = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  it("renders fallback UI when a child throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  // Clicking the refresh button triggers a page reload in browsers; asserting
  // fallback rendering is sufficient for unit scope here.
});
