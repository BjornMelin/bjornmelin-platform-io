import { test as base, expect } from "@playwright/test";

type ConsoleMessage = {
  type: string;
  text: string;
  location?: { url?: string; lineNumber?: number; columnNumber?: number };
};

const isIgnorableConsoleError = (message: ConsoleMessage): boolean => {
  const text = message.text.toLowerCase();

  // Common local/dev noise that does not represent an app regression.
  if (text.includes("favicon.ico")) return true;
  if (text.includes("chrome-extension://")) return true;
  if (text.includes("failed to load resource") && text.includes("net::err_failed")) return true;
  if (text.includes("failed to load resource") && text.includes("net::err_network_changed")) {
    if (message.location?.url) {
      try {
        const url = new URL(message.location.url);
        if (url.pathname.startsWith("/_next/static/")) {
          return true;
        }
      } catch {
        // ignore
      }
    }
  }

  if (
    text.includes("failed to load resource") &&
    text.includes("status of 404") &&
    message.location?.url
  ) {
    try {
      const url = new URL(message.location.url);
      // Whitelist of known non-app routes or test artifacts that can 404 without being regressions.
      const whitelist = [
        "/favicon.ico",
        "/health",
        "/api/health",
        "/apple-touch-icon.png",
        "/apple-touch-icon-precomposed.png",
      ];
      if (whitelist.includes(url.pathname) || url.pathname.startsWith("/__test/")) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
};

export const test = base.extend({
  page: async ({ page }, use) => {
    const consoleErrors: ConsoleMessage[] = [];
    const pageErrors: string[] = [];

    const normalizePathname = (pathname: string): string => {
      if (pathname !== "/" && pathname.endsWith("/")) return pathname.slice(0, -1);
      return pathname;
    };

    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    page.on("console", (message) => {
      if (message.type() !== "error") return;

      const entry: ConsoleMessage = {
        type: message.type(),
        text: message.text(),
        location: message.location(),
      };

      // Navigating to an unknown route is expected to 404 and can show as a console error where
      // the failing resource URL equals the current document URL. Don't treat that as an app
      // regression, but keep catching missing asset/API 404s.
      if (
        entry.text.toLowerCase().includes("failed to load resource") &&
        entry.text.toLowerCase().includes("status of 404") &&
        entry.location?.url
      ) {
        try {
          const failingUrl = new URL(entry.location.url);
          const currentUrl = new URL(page.url());
          if (
            failingUrl.origin === currentUrl.origin &&
            normalizePathname(failingUrl.pathname) === normalizePathname(currentUrl.pathname)
          ) {
            return;
          }
        } catch {
          // ignore
        }
      }

      if (isIgnorableConsoleError(entry)) return;
      consoleErrors.push(entry);
    });

    await use(page);

    if (pageErrors.length > 0) {
      throw new Error(`Uncaught page error(s):\n- ${pageErrors.join("\n- ")}`);
    }

    if (consoleErrors.length > 0) {
      throw new Error(
        `Console error(s):\n${consoleErrors
          .map(
            (entry) =>
              `- ${entry.text}${
                entry.location?.url
                  ? ` (${entry.location.url}:${entry.location.lineNumber ?? 0}:${
                      entry.location.columnNumber ?? 0
                    })`
                  : ""
              }`,
          )
          .join("\n")}`,
      );
    }
  },
});

export { expect };
