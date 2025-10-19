/**
 * @fileoverview Unit tests for structured data helpers/component.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StructuredData, {
  generatePersonSchema,
  generateWebsiteSchema,
} from "@/components/structured-data";

describe("structured-data", () => {
  it("exposes generators with expected fields", () => {
    const person = generatePersonSchema() as Record<string, unknown>;
    const site = generateWebsiteSchema() as Record<string, unknown>;
    expect(person["@type"]).toBe("Person");
    expect(site["@type"]).toBe("WebSite");
    const sameAs = person.sameAs as unknown[] | undefined;
    expect(Array.isArray(sameAs)).toBe(true);
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
  });
});
