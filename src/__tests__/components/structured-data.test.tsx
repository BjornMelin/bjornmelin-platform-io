/**
 * @fileoverview Unit tests for structured data helpers/component.
 */

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StructuredData, {
  createSchemaKey,
  generatePersonSchema,
  generateWebsiteSchema,
} from "@/components/structured-data";
import { PROFILE } from "@/lib/profile";
import { ProfileSchema } from "@/lib/schemas/profile";

describe("structured-data", () => {
  it("exposes generators with expected fields", () => {
    const person = generatePersonSchema() as Record<string, unknown>;
    const site = generateWebsiteSchema() as Record<string, unknown>;
    expect(person["@type"]).toBe("Person");
    expect(site["@type"]).toBe("WebSite");
    const sameAs = person.sameAs as unknown[] | undefined;
    expect(sameAs).toEqual([
      PROFILE.socialUrls.github,
      PROFILE.socialUrls.linkedin,
      PROFILE.socialUrls.orcid,
      PROFILE.socialUrls.coursera,
    ]);
  });

  it("rejects non-HTTPS profile identity URLs", () => {
    expect(() =>
      ProfileSchema.parse({
        ...PROFILE,
        socialUrls: { ...PROFILE.socialUrls, github: "http://github.com/bjornmelin" },
      }),
    ).toThrow();
  });

  it("uses the canonical public site URL for schema URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://bjornmelin.io/");

    const person = generatePersonSchema() as Record<string, unknown>;
    const site = generateWebsiteSchema() as Record<string, unknown>;

    expect(person.url).toBe("https://bjornmelin.io");
    expect(site.url).toBe("https://bjornmelin.io");
  });

  it("renders both person and website JSON-LD", () => {
    render(<StructuredData type="both" />);
    // We can query by type attribute instead (role generic for fragments), assert count by DOM query:
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLd.length).toBe(2);
    const texts = Array.from(jsonLd)
      .map((n) => n.textContent || "")
      .join("\n");
    expect(texts).toContain('"@type":"Person"');
    expect(texts).toContain('"@type":"WebSite"');
    expect(texts).not.toContain("bjornmelin.com");
  });

  it("renders only person JSON-LD", () => {
    render(<StructuredData type="person" />);
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLd.length).toBe(1);
    const text = jsonLd[0]?.textContent ?? "";
    expect(text).toContain('"@type":"Person"');
    expect(text).not.toContain('"@type":"WebSite"');
  });

  it("renders only website JSON-LD", () => {
    render(<StructuredData type="website" />);
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLd.length).toBe(1);
    const text = jsonLd[0]?.textContent ?? "";
    const schema = JSON.parse(text) as Record<string, unknown>;
    expect(schema["@type"]).toBe("WebSite");
  });

  it("creates schema keys with and without type/name metadata", () => {
    const withType = createSchemaKey({ "@type": "Person", name: "Bjorn" });
    expect(withType).toContain("Person-Bjorn-");

    const withoutType = createSchemaKey({ foo: "bar" });
    expect(withoutType).toMatch(/^[a-f0-9]{12}$/);
  });
});
