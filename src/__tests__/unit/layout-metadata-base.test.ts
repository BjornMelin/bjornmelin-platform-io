/* @vitest-environment node */
import { describe, expect, it, vi } from "vitest";

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
  it("falls back when NEXT_PUBLIC_BASE_URL is unset", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_BASE_URL;

    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.com/");
  });
});
