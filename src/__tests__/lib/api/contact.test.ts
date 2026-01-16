import { describe, expect, it } from "vitest";
import { buildContactEndpoint, safeParseUrl } from "@/lib/api/contact";

describe("buildContactEndpoint", () => {
  it("appends /contact to a base URL with a path", () => {
    expect(buildContactEndpoint("https://example.com/api")).toBe("https://example.com/api/contact");
  });

  it("appends /contact to a base URL with a trailing slash", () => {
    expect(buildContactEndpoint("https://example.com/api/")).toBe(
      "https://example.com/api/contact",
    );
  });

  it("appends /contact to a base URL without a path", () => {
    expect(buildContactEndpoint("https://example.com")).toBe("https://example.com/contact");
  });

  it("throws for invalid base URLs", () => {
    expect(() => buildContactEndpoint("not a url")).toThrow();
  });
});

describe("safeParseUrl", () => {
  it("returns a URL for valid input", () => {
    const parsed = safeParseUrl("https://example.com/path");
    expect(parsed).not.toBeNull();
    expect(parsed?.hostname).toBe("example.com");
  });

  it("returns null for invalid input", () => {
    expect(safeParseUrl("not a url")).toBeNull();
  });
});
