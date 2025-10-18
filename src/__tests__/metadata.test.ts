/* @vitest-environment node */

import { beforeEach, describe, expect, it } from "vitest";

import { generateMetadata } from "@/lib/metadata";

const toImageUrl = (input: unknown): string | undefined => {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof input === "object" && input && "url" in input) {
    const candidate = (input as { url: unknown }).url;
    if (typeof candidate === "string") {
      return candidate;
    }
    if (candidate instanceof URL) {
      return candidate.toString();
    }
  }

  return undefined;
};

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
    const openGraphImages = metadata.openGraph?.images;
    const ogImageList = Array.isArray(openGraphImages)
      ? openGraphImages
      : openGraphImages
        ? [openGraphImages]
        : [];
    const firstOgImage = ogImageList[0];
    expect(toImageUrl(firstOgImage)).toBe("/banner.png");

    const twitterImages = metadata.twitter?.images;
    const twitterImageList = Array.isArray(twitterImages)
      ? twitterImages
      : twitterImages
        ? [twitterImages]
        : [];
    expect(toImageUrl(twitterImageList[0])).toBe("/banner.png");
  });
});
