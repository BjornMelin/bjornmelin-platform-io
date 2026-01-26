---
ADR: 0006
Title: Static image optimization for Next.js static export
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0005"]
Tags: ["architecture", "performance", "images", "static-export", "nextjs"]
References:
  - "[Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports)"
  - "[Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images)"
---

## Status

Implemented (2026-01-16).

## Description

Optimize images for a strict static export by generating responsive WebP variants at build time and
serving them via a `next/image` custom loader.

## Context

This application uses `output: "export"` and is deployed as pure static assets to S3/CloudFront.
The default Next.js Image Optimization runtime is not available for static exports. The site still
needs responsive images, modern formats, and stable layouts (CLS).

## Decision Drivers

- Preserve strict static export constraints (ADR-0005).
- Improve LCP/TTI via smaller images and responsive sizing.
- Keep a small operational surface (no image runtime service required).
- Avoid vendor lock-in for image hosting.

## Alternatives

- Use the default `next/image` loader (rejected: not supported with static export).
- Use a hosted image service (e.g., Cloudinary) and a custom loader (rejected: adds third-party runtime dependency and cost).
- Use `next-export-optimize-images` (rejected: peer dependency conflicts with Next.js 16 and increases upgrade friction).
- Use unoptimized `<img>` everywhere (rejected: worse performance and UX, harder to maintain consistency).

## Decision

- Generate WebP variants at build time with `sharp` into `public/_images/`.
- Configure `next/image` with `images.loader = "custom"` and `images.loaderFile`.
- Resolve local raster images to the generated `/_images/*` paths, while leaving SVG/GIF and remote
  URLs untouched.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.2 | 3.22 |
| Application value | 0.30 | 9.3 | 2.79 |
| Maintenance & cognitive load | 0.25 | 9.1 | 2.28 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.19 / 10.0

## Constraints

- Must remain compatible with `output: "export"`.
- Build must produce a complete `out/` directory with all required images.
- No request-time image resizing/optimization is available in production.

## Design

### Variant naming

For a source at `/projects/foo.png` and width `640`, the build emits:

- `public/_images/projects/foo_640.webp`

Next export copies this to:

- `out/_images/projects/foo_640.webp`

### Loader behavior

`image-loader.ts` maps local raster sources to the corresponding WebP variant path. The mapping is
deterministic and does not require a server.

### Build integration

- `predev` and `prebuild` generate variants (developer-friendly and CI-safe).
- `bun run build` then runs `bun --bun next build` (static export) and regenerates CSP hashes.

## Consequences

### Positive Outcomes

- Smaller payloads and better responsive behavior for images in a static export.
- No runtime image service dependency.

### Negative Consequences / Trade-offs

- Images must be generated before a build; missing variants will surface as broken images in `out/`.
- Remote images remain unoptimized unless a remote loader is intentionally introduced.

## Implementation Notes

- `scripts/generate-static-image-variants.mjs`: generates variants with Sharp.
- `image-loader.ts`: custom loader for `next/image`.
- `next.config.mjs`: configures `images.loader`, `loaderFile`, `deviceSizes`, and `imageSizes`.

## Testing

- Unit: `src/__tests__/unit/image-loader.test.ts` covers loader mapping behavior.
- Build: `bun run build` produces `out/_images/**.webp` and pages reference those URLs.

## Changelog

- **1.0 (2026-01-16)**: Initial decision and implementation.
