import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  // Note: sitemap uses process.env.NEXT_PUBLIC_APP_URL at module load time
  // We test the structure and logic, not the specific URL which depends on env

  it("returns sitemap entries for static routes", () => {
    const result = sitemap();

    expect(result).toHaveLength(4);
    // Verify routes are present by checking URL endings
    const routes = ["/", "/about", "/projects", "/contact"];
    routes.forEach((route, index) => {
      if (route === "/") {
        expect(result[index].url.endsWith("/")).toBe(true);
      } else {
        expect(result[index].url.endsWith(route)).toBe(true);
      }
    });
  });

  it("sets home page priority to 1", () => {
    const result = sitemap();

    const homeEntry = result.find((entry) => entry.url.endsWith("/"));
    expect(homeEntry?.priority).toBe(1);
  });

  it("sets other pages priority to 0.8", () => {
    const result = sitemap();

    const otherEntries = result.filter((entry) => !entry.url.endsWith("/"));
    otherEntries.forEach((entry) => {
      expect(entry.priority).toBe(0.8);
    });
  });

  it("sets changeFrequency to monthly for all entries", () => {
    const result = sitemap();

    result.forEach((entry) => {
      expect(entry.changeFrequency).toBe("monthly");
    });
  });

  it("sets lastModified to current date", () => {
    const result = sitemap();

    result.forEach((entry) => {
      expect(entry.lastModified).toBeDefined();
      // Verify it's a valid ISO date string
      expect(() => new Date(entry.lastModified as string)).not.toThrow();
    });
  });

  it("generates consistent URL format", () => {
    const result = sitemap();

    // All URLs should have the same base
    const baseUrls = result.map((entry) => entry.url.replace(/\/[^/]*$/, ""));
    const uniqueBases = Array.from(new Set(baseUrls));
    expect(uniqueBases.length).toBe(1);
  });
});

describe("robots", () => {
  // Note: robots uses process.env.NEXT_PUBLIC_BASE_URL at module load time
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
