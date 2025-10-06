/* @vitest-environment node */

import { beforeEach, describe, expect, it } from "vitest";

import { generateMetadata } from "@/lib/metadata";

describe("generateMetadata", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it("returns default metadata when optional fields are omitted", () => {
    const metadata = generateMetadata({});

    expect(metadata.title).toBe("Bjorn Melin - AWS Solutions Architect & Full Stack Developer");
    expect(metadata.description).toContain("AWS Solutions Architect");
    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.com/");
    expect(metadata.alternates?.canonical).toBe("https://bjornmelin.com");
  });

  it("applies overrides and propagates image data when provided", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";

    const metadata = generateMetadata({
      title: "About",
      description: "About page",
      path: "/about",
      image: "/banner.png",
    });

    expect(metadata.title).toBe("About | Bjorn Melin");
    expect(metadata.description).toBe("About page");
    expect(metadata.metadataBase?.toString()).toBe("https://example.com/");
    expect(metadata.alternates?.canonical).toBe("https://example.com/about");
    expect(metadata.openGraph?.images?.[0]?.url).toBe("/banner.png");
    expect(metadata.twitter?.images?.[0]).toBe("/banner.png");
  });
});
