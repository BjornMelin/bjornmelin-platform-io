/* @vitest-environment node */
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({ className: "mock-geist-font", variable: "mock-geist-variable" }),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/structured-data", () => ({
  default: () => null,
}));

vi.mock("@/components/theme", () => ({
  ThemeScript: () => null,
}));

vi.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => children,
}));

describe("RootLayout metadataBase", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    }
    vi.resetModules();
  });

  it("falls back when NEXT_PUBLIC_BASE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;

    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.io/");
  });

  it("falls back when NEXT_PUBLIC_BASE_URL is empty", async () => {
    process.env.NEXT_PUBLIC_APP_URL = " ";
    process.env.NEXT_PUBLIC_BASE_URL = " ";

    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.io/");
  });

  it("prefers NEXT_PUBLIC_APP_URL over NEXT_PUBLIC_BASE_URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "app.example.com";
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";

    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://app.example.com/");
  });
});
