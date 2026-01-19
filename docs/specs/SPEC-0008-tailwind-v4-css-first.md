---
spec: SPEC-0008
title: Tailwind CSS v4 (CSS-first config) integration
version: 1.0.0
date: 2026-01-19
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-001", "NFR-001"]
related_adrs: ["ADR-0005", "ADR-0009"]
notes: "Defines the Tailwind v4 integration, file contracts, and migration checklist."
---

## Summary

This spec defines the Tailwind CSS v4 integration used by this repository and documents the “CSS-first”
configuration contract to keep styling deterministic and compatible with Next.js static export.

## Integration mode

This project uses **PostCSS** for Tailwind integration (Next.js build pipeline):

- Tailwind core: `tailwindcss` (pinned)
- PostCSS integration: `@tailwindcss/postcss` (pinned)
- PostCSS runtime: `postcss` (pinned via lockfile)

## File-level contracts

- `src/app/globals.css`
  - Include `@import "tailwindcss" source("../");` as the entry point.
  - Define theme tokens via `@theme { ... }` (Tailwind v4 CSS-first).
  - Register any needed plugins via `@plugin ...`.
  - Prefer `@utility` (not `@layer utilities`) for custom utilities.
- `postcss.config.mjs`
  - Must include only `@tailwindcss/postcss` for Tailwind.
- `tailwind.config.ts`
  - Exists only for tooling compatibility; Tailwind does not load it unless `@config` is used.

## Migration checklist (v3 → v4)

### Utility renames

- `shadow-sm` → `shadow-xs`; `shadow` → `shadow-sm`
- `rounded-sm` → `rounded-xs`; `rounded` → `rounded-sm`
- `blur-sm` → `blur-xs`; `blur` → `blur-sm`
- Same pattern for `drop-shadow-*` and `backdrop-blur-*`
- `ring` → `ring-3` (explicit default width)
- `outline-none` (old behavior) → `outline-hidden`

### Removed opacity utilities

Replace `*-opacity-*` with slash modifiers:

- `bg-black/50`, `text-black/50`, `border-black/50`, `ring-black/50`, etc.

### Selector behavior changes

- Prefer `gap-*` in flex/grid instead of relying on `space-x-*` / `space-y-*` in complex layouts.
- Validate `divide-*` behavior on nested/inline children.

### Defaults changed

- `border-*` and `ring-*` defaults now use `currentColor`; prefer explicit border and ring colors.

## Build + verification

```bash
pnpm install
pnpm build
pnpm serve
```

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.3 | 3.26 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.4 | 2.35 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.24 / 10.0
