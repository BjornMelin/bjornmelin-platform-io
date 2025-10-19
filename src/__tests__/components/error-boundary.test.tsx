/**
 * @fileoverview Tests for ErrorBoundary fallback and recovery behavior.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorBoundary } from "@/components/shared/error-boundary";

const Boom = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
  });

  // Clicking the refresh button triggers a page reload in browsers; asserting
  // fallback rendering is sufficient for unit scope here.
});
