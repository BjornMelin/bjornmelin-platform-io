---
spec: SPEC-0004
title: Static image pipeline (build-time variants + loader)
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements:
  - FR-401: All pages render with responsive images in a static export
  - NFR-401: No runtime image optimization service required
related_adrs: ["ADR-0005", "ADR-0006"]
notes: "Defines how images are generated, named, and served in a strict static export."
---

## Summary

This spec defines the build-time image variant pipeline and `next/image` loader behavior used to
keep image performance high while preserving `output: \"export\"`.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.2 | 3.22 |
| Application value | 0.30 | 9.3 | 2.79 |
| Maintenance & cognitive load | 0.25 | 9.1 | 2.28 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.19 / 10.0

## Inputs

- Source assets live in `public/` (e.g. `public/projects/*.png`).
- The pipeline targets local raster images:
  - supported: `png`, `jpg`, `jpeg`
  - passthrough: `svg`, `gif` (do not convert)

## Outputs

- Generated variants live in `public/_images/` and are copied into `out/_images/` during export.
- Output format: WebP (`.webp`).

## Variant naming

For a source `/<dir>/<name>.<ext>` and width `<w>`:

- Output: `public/_images/<dir>/<name>_<w>.webp`

Examples:

- `/projects/demo.png` @ 640 → `public/_images/projects/demo_640.webp`
- `/headshot/profile.jpg` @ 1080 → `public/_images/headshot/profile_1080.webp`

## Width set

Variant widths are derived from Next.js configuration:

- `images.deviceSizes`
- `images.imageSizes`

These values must remain in sync with `scripts/generate-static-image-variants.mjs` and `next.config.mjs`.

## Loader contract

`image-loader.ts` implements a deterministic mapping for static export:

- Local raster `src` paths map to `/_images/<src>_<width>.webp`
- Remote URLs return unchanged
- `svg` and `gif` return unchanged

The loader must remain compatible with `next/image` and the static export runtime.

## Build integration

Required scripts:

- `predev`: generate variants for local development
- `prebuild`: generate variants before static export
- `build`: `next build && pnpm generate:csp-hashes`

## Acceptance criteria

- `pnpm build` produces `out/` with:
  - `out/_images/**.webp` present for referenced raster images
  - no missing image references in rendered pages
- `pnpm dev` renders pages with images without requiring manual generation.

## Failure modes and mitigation

- Missing variant file:
  - Symptom: broken image request for `/_images/...`
  - Fix: re-run `pnpm images:generate` or `pnpm build`
- New image sizes introduced:
  - Symptom: images render but variant set is incomplete
  - Fix: update `next.config.mjs` sizes and regenerate

## Key files

- `scripts/generate-static-image-variants.mjs`
- `image-loader.ts`
- `next.config.mjs`
