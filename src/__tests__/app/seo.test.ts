import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // Note: sitemap uses process.env.NEXT_PUBLIC_APP_URL at module load time
  // We test the structure and logic, not the specific URL which depends on env

  it("returns sitemap entries for static routes", () => {
    const result = sitemap();

    expect(result.length).toBeGreaterThan(4);
    const routes = ["/", "/about", "/projects", "/agent-skills", "/contact"];

    routes.forEach((route, index) => {
      expect(new URL(result[index].url).pathname).toBe(route);
    });
  });

  it("sets home page priority to 1", () => {
    const result = sitemap();

    const homeEntry = result.find((entry) => new URL(entry.url).pathname === "/");
    expect(homeEntry?.priority).toBe(1);
  });

  it("sets other pages priority to 0.8", () => {
    const result = sitemap();

    const otherEntries = result.filter((entry) =>
      ["/about", "/projects", "/agent-skills", "/contact"].includes(new URL(entry.url).pathname),
    );
    otherEntries.forEach((entry) => {
      expect(entry.priority).toBe(0.8);
    });
  });

  it("sets changeFrequency for all entries", () => {
    const result = sitemap();

    expect(
      result.every(
        (entry) => entry.changeFrequency === "monthly" || entry.changeFrequency === "weekly",
      ),
    ).toBe(true);
  });

  it("includes Agent Skills Lab detail pages", () => {
    const result = sitemap();

    expect(
      result.some((entry) => new URL(entry.url).pathname === "/agent-skills/deep-researcher"),
    ).toBe(true);
  });

  it("omits lastModified until stable content dates are available", () => {
    const result = sitemap();

    result.forEach((entry) => {
      expect(entry.lastModified).toBeUndefined();
    });
  });

  it("generates consistent URL format", () => {
    const result = sitemap();

    // All URLs should have the same base
    const baseUrls = result.map((entry) => new URL(entry.url).origin);
    const uniqueBases = Array.from(new Set(baseUrls));
    expect(uniqueBases.length).toBe(1);
  });
});

describe("robots", () => {
  // Note: robots uses process.env.NEXT_PUBLIC_APP_URL at module load time
  // We test the structure and logic

  it("allows all user agents", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
      }),
    );
  });

  it("allows root path", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        allow: "/",
      }),
    );
  });

  it("disallows api and admin paths", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        disallow: ["/api/*", "/admin/*"],
      }),
    );
  });

  it("includes sitemap URL with valid format", () => {
    const result = robots();

    expect(result.sitemap).toBeDefined();
    expect(result.sitemap).toMatch(/sitemap\.xml$/);
    expect(() => new URL(result.sitemap as string)).not.toThrow();
  });
});

describe("SEO base URL normalization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds https:// to robots sitemap when NEXT_PUBLIC_APP_URL has no protocol", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    const { default: robotsModule } = await import("@/app/robots");

    expect(robotsModule().sitemap).toBe("https://example.com/sitemap.xml");
  });

  it("falls back to the default base URL when NEXT_PUBLIC_APP_URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    const { default: robotsModule } = await import("@/app/robots");

    expect(robotsModule().sitemap).toBe("https://bjornmelin.io/sitemap.xml");
  });

  it("falls back to NEXT_PUBLIC_BASE_URL for robots when NEXT_PUBLIC_APP_URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://base.example.com");
    const { default: robotsModule } = await import("@/app/robots");

    expect(robotsModule().sitemap).toBe("https://base.example.com/sitemap.xml");
  });

  it("preserves https:// when NEXT_PUBLIC_APP_URL includes protocol", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const { default: robotsModule } = await import("@/app/robots");

    expect(robotsModule().sitemap).toBe("https://example.com/sitemap.xml");
  });

  it("adds https:// to sitemap URLs when NEXT_PUBLIC_APP_URL has no protocol", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    const { default: sitemapModule } = await import("@/app/sitemap");

    const result = sitemapModule();
    expect(result[0]?.url).toContain("https://example.com/");
  });

  it("falls back to the default base URL for sitemap when NEXT_PUBLIC_APP_URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    const { default: sitemapModule } = await import("@/app/sitemap");

    const result = sitemapModule();
    expect(result[0]?.url).toContain("https://bjornmelin.io/");
  });

  it("falls back to NEXT_PUBLIC_BASE_URL for sitemap when NEXT_PUBLIC_APP_URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://base.example.com");
    const { default: sitemapModule } = await import("@/app/sitemap");

    const result = sitemapModule();
    expect(result[0]?.url).toContain("https://base.example.com/");
  });

  it("preserves https:// for sitemap URLs when NEXT_PUBLIC_APP_URL includes protocol", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const { default: sitemapModule } = await import("@/app/sitemap");

    const result = sitemapModule();
    expect(result[0]?.url).toContain("https://example.com/");
  });
});
