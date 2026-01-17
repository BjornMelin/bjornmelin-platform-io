import { describe, expect, it } from "vitest";

import staticExportImageLoader from "../../../image-loader";

describe("staticExportImageLoader", () => {
  it("returns remote URLs unchanged", () => {
    expect(
      staticExportImageLoader({
        src: "https://example.com/image.png",
        width: 640,
      }),
    ).toBe("https://example.com/image.png");
  });

  it("keeps SVG assets unchanged", () => {
    expect(
      staticExportImageLoader({
        src: "/icons/logo.svg",
        width: 64,
      }),
    ).toBe("/icons/logo.svg");
  });

  it("rewrites local raster assets to pre-generated WebP variants", () => {
    expect(
      staticExportImageLoader({
        src: "/projects/portfolio.png",
        width: 1080,
      }),
    ).toBe("/_images/projects/portfolio_1080.webp");
  });

  it("strips query params when generating a variant path", () => {
    expect(
      staticExportImageLoader({
        src: "/projects/portfolio.png?v=123",
        width: 750,
      }),
    ).toBe("/_images/projects/portfolio_750.webp");
  });
});
