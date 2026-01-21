import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExpandableText } from "@/components/shared/expandable-text";

const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
const originalResizeObserver = window.ResizeObserver;

const setElementHeights = (scrollHeight: number, clientHeight: number) => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
};

const restoreElementHeights = () => {
  if (originalScrollHeight) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
  } else {
    delete (HTMLElement.prototype as { scrollHeight?: unknown }).scrollHeight;
  }

  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
  } else {
    delete (HTMLElement.prototype as { clientHeight?: unknown }).clientHeight;
  }
};

describe("ExpandableText", () => {
  let resizeCallbacks: ResizeObserverCallback[] = [];

  beforeEach(() => {
    resizeCallbacks = [];
    window.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    restoreElementHeights();
    window.ResizeObserver = originalResizeObserver;
  });

  it("renders the text without a toggle when not truncated", () => {
    setElementHeights(100, 100);

    render(<ExpandableText>Short text</ExpandableText>);

    expect(screen.getByText("Short text")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show more/i })).toBeNull();
  });

  it("shows the toggle when truncated and preserves it when expanded", async () => {
    const user = userEvent.setup();
    setElementHeights(200, 100);

    render(<ExpandableText>Long text that overflows</ExpandableText>);

    const paragraphBefore = screen.getByText("Long text that overflows").closest("p");
    expect(paragraphBefore).toHaveClass("line-clamp-3");

    await user.click(screen.getByRole("button", { name: /show more/i }));

    const paragraphAfter = screen.getByText("Long text that overflows").closest("p");
    expect(paragraphAfter).not.toHaveClass("line-clamp-3");
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();

    for (const callback of resizeCallbacks) {
      callback([], {} as ResizeObserver);
    }
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();
  });
});
