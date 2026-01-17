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

const resetSearchParams = () => {
  currentSearchParams = new URLSearchParams(window.location.search);
};

let currentSearchParams = new URLSearchParams(window.location.search);

/**
 * Mock `next/navigation` for client component tests.
 *
 * Next's router is integration-tested via E2E; unit tests only need stable URL access and
 * predictable `replace()` behavior.
 */
vi.mock("next/navigation", () => {
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
      back: () => {
        window.history.back();
        resetSearchParams();
      },
      forward: () => {
        window.history.forward();
        resetSearchParams();
      },
      refresh: () => {},
    }),
  };
});

/**
 * Mock `next/link` to a plain anchor that prevents jsdom navigation noise.
 *
 * jsdom does not implement full document navigation and logs:
 * "Not implemented: navigation to another Document" when clicking real anchors.
 *
 * Unit tests should assert hrefs and local click handlers (e.g. closing menus),
 * while route-level navigation remains covered by Playwright.
 */
vi.mock("next/link", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const {
      href,
      children,
      onClick,
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      passHref: _passHref,
      legacyBehavior: _legacyBehavior,
      locale: _locale,
      as: _as,
      ...anchorProps
    } = props as Record<string, unknown>;

    const resolvedHref =
      typeof href === "string" ? href : href instanceof URL ? href.toString() : "#";

    return React.createElement(
      "a",
      {
        ...(anchorProps as Record<string, unknown>),
        href: resolvedHref,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          if (typeof onClick === "function") {
            (onClick as (event: React.MouseEvent<HTMLAnchorElement>) => void)(event);
          }
        },
      },
      children as React.ReactNode,
    );
  },
}));

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

    const resolvedSrc = typeof src === "string" ? src : ((src as { src?: string }).src ?? "");

    return React.createElement("img", {
      alt: (alt as string) ?? "",
      src: resolvedSrc,
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
  resetSearchParams();
});

/**
 * Ensure isolation by clearing mocks, MSW handlers, and DOM state between specs.
 */
afterEach(() => {
  vi.unstubAllEnvs();
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Clean up MSW server after all tests
 */
afterAll(() => {
  server.close();
});
