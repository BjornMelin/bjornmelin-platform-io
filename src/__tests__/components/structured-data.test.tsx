import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StructuredData, { generatePersonSchema, generateWebsiteSchema } from "@/components/structured-data";

describe("structured-data", () => {
  it("exposes generators with expected fields", () => {
    const person = generatePersonSchema();
    const site = generateWebsiteSchema();
    expect(person["@type"]).toBe("Person");
    expect(site["@type"]).toBe("WebSite");
    expect(Array.isArray((person as any).sameAs)).toBe(true);
  });

  it("renders both person and website JSON-LD", () => {
    render(<StructuredData type="both" />);
    const scripts = screen.getAllByRole("generic", { hidden: true });
    // We can query by type attribute instead (role generic for fragments), assert count by DOM query:
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLd.length).toBe(2);
    const texts = Array.from(jsonLd).map((n) => n.textContent || "").join("\n");
    expect(texts).toContain("\"@type\":\"Person\"");
    expect(texts).toContain("\"@type\":\"WebSite\"");
  });
});

