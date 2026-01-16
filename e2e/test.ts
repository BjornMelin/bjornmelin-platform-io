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
  if (
    text.includes("failed to load resource") &&
    text.includes("status of 404") &&
    message.location?.url
  ) {
    try {
      const url = new URL(message.location.url);
      // Allow the 404 route itself (no file extension) while still surfacing missing JS/CSS/assets.
      if (!url.pathname.includes(".")) return true;
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
