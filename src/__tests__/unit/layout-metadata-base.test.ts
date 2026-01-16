/* @vitest-environment node */
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter-font" }),
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
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    }
    vi.resetModules();
  });

  it("falls back when NEXT_PUBLIC_BASE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;

    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.com/");
  });
});
