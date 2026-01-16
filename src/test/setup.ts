import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import * as React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "@/mocks/node";
import { applyDefaultTestEnv } from "./setup-env";

/**
 * Configure the global test environment prior to each spec.
 */
applyDefaultTestEnv();

/**
 * Mock `next/navigation` for client component tests.
 *
 * Next's router is integration-tested via E2E; unit tests only need stable URL access and
 * predictable `replace()` behavior.
 */
vi.mock("next/navigation", () => {
  let currentSearchParams = new URLSearchParams(window.location.search);

  const getUrl = (href: string) => {
    const base = "http://localhost";
    try {
      return new URL(href, base);
    } catch {
      return new URL(base);
    }
  };

  return {
    __esModule: true,
    usePathname: () => window.location.pathname,
    useSearchParams: () => currentSearchParams,
    useRouter: () => ({
      push: (href: string) => {
        const url = getUrl(href);
        window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
        currentSearchParams = new URLSearchParams(url.search);
      },
      replace: (href: string) => {
        const url = getUrl(href);
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        currentSearchParams = new URLSearchParams(url.search);
      },
      prefetch: async () => {},
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => {},
    }),
  };
});

/**
 * Mock `next/image` to a plain `img` element for deterministic unit tests.
 *
 * Next's Image component behavior (loader, srcset generation, layout) is covered by Next itself
 * and should be validated via Playwright for integration fidelity.
 */
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const {
      alt,
      src,
      fill: _fill,
      priority: _priority,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      loader: _loader,
      quality: _quality,
      sizes: _sizes,
      ...imgProps
    } = props as Record<string, unknown>;

    return React.createElement("img", {
      alt: (alt as string) ?? "",
      src: src as string,
      ...imgProps,
    });
  },
}));

// Provide a jsdom-safe matchMedia for libraries relying on it (e.g., next-themes)
if (typeof window !== "undefined" && !("matchMedia" in window)) {
  // @ts-expect-error augment test environment
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

/**
 * Start MSW server before all tests
 * Use 'error' to catch any missing handlers
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  applyDefaultTestEnv();
});

/**
 * Ensure isolation by clearing mocks, MSW handlers, and DOM state between specs.
 */
afterEach(() => {
  vi.unstubAllEnvs();
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  vi.resetAllMocks();
});

/**
 * Clean up MSW server after all tests
 */
afterAll(() => {
  server.close();
});
