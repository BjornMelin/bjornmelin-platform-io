/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateMetadata } from "@/lib/metadata";
import { PROFILE } from "@/lib/profile";

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
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    }
  });

  it("returns default metadata when optional fields are omitted", () => {
    const metadata = generateMetadata({});

    expect(metadata.title).toBe(`${PROFILE.name} - ${PROFILE.shortTitle}`);
    expect(metadata.description).toBe(PROFILE.summary);
    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.io/");
    expect(metadata.alternates?.canonical).toBe("https://bjornmelin.io");
    expect(metadata.openGraph?.url).toBe("https://bjornmelin.io");
  });

  it("applies overrides and propagates image data when provided", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com/";

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
    expect(metadata.openGraph?.url).toBe("https://example.com/about");
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

  it("prefers NEXT_PUBLIC_APP_URL over NEXT_PUBLIC_BASE_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "app.example.com";
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";

    const metadata = generateMetadata({ path: "/agent-skills" });

    expect(metadata.metadataBase?.toString()).toBe("https://app.example.com/");
    expect(metadata.alternates?.canonical).toBe("https://app.example.com/agent-skills");
    expect(metadata.openGraph?.url).toBe("https://app.example.com/agent-skills");
  });

  it("falls back to NEXT_PUBLIC_BASE_URL when NEXT_PUBLIC_APP_URL is malformed", () => {
    process.env.NEXT_PUBLIC_APP_URL = "not a url";
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";

    const metadata = generateMetadata({ path: "/agent-skills" });

    expect(metadata.metadataBase?.toString()).toBe("https://base.example.com/");
    expect(metadata.alternates?.canonical).toBe("https://base.example.com/agent-skills");
    expect(metadata.openGraph?.url).toBe("https://base.example.com/agent-skills");
  });

  it("falls back when NEXT_PUBLIC_BASE_URL is malformed", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "not a url";

    const metadata = generateMetadata({ path: "/agent-skills" });

    expect(metadata.metadataBase?.toString()).toBe("https://bjornmelin.io/");
    expect(metadata.alternates?.canonical).toBe("https://bjornmelin.io/agent-skills");
    expect(metadata.openGraph?.url).toBe("https://bjornmelin.io/agent-skills");
  });
});
