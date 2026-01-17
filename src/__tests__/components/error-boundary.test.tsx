/**
 * @fileoverview Tests for ErrorBoundary fallback and recovery behavior.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/shared/error-boundary";

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("catches errors thrown by children and renders the fallback UI", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function Boom(): never {
      throw new Error("boom");
    }

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("renders a refresh button in the fallback UI", () => {
    class TestBoundary extends ErrorBoundary {
      public state = { hasError: true };
    }

    render(
      <TestBoundary>
        <div>Child</div>
      </TestBoundary>,
    );

    const button = screen.getByRole("button", { name: /refresh page/i });
    expect(button).toHaveAttribute("type", "button");
  });

  it("reloads the page when the refresh button is clicked", async () => {
    const user = userEvent.setup();
    const reloadSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload: reloadSpy });

    class TestBoundary extends ErrorBoundary {
      public state = { hasError: true };
    }

    render(
      <TestBoundary>
        <div>Child</div>
      </TestBoundary>,
    );

    await user.click(screen.getByRole("button", { name: /refresh page/i }));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
