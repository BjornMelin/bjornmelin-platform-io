---
spec: SPEC-0008
title: Tailwind CSS v4 (CSS-first config) integration
version: 1.0.0
date: 2026-01-19
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-301", "FR-302", "NFR-001", "NFR-301"]
related_adrs: ["ADR-0005", "ADR-0009"]
notes: "Defines the Tailwind v4 integration, file contracts, and migration checklist."
---

## Summary

This spec defines the Tailwind CSS v4 integration used by this repository and documents the “CSS-first”
configuration contract to keep styling deterministic and compatible with Next.js static export.

## Context

Tailwind v4 requires CSS-first configuration and updated integration patterns.

## Goals / Non-goals

### Goals

- Define the Tailwind v4 integration contract used by the repo.
- Ensure CSS-first configuration is applied consistently.
- Provide a migration checklist for v3 → v4.

### Non-goals

- Supporting Tailwind v3 in parallel.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-301:** Tailwind CSS v4 integration uses CSS-first configuration via `@theme` and `@plugin` directives in globals.css.
- **FR-302:** PostCSS pipeline integrates Tailwind v4 using the `@tailwindcss/postcss` plugin to process CSS-first configuration via `@theme` and `@plugin` directives in the Next.js build pipeline.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static export.
- **NFR-301:** CSS output must be deterministic and reproducible across local development, CI environments, and production deployments.

## Constraints

- Node.js 20+ required for Tailwind v4 compatibility.
- Tailwind config must remain CSS-first.

## Design

### Integration mode

This project uses **PostCSS** for Tailwind integration (Next.js build pipeline):

- Tailwind core: `tailwindcss` (pinned)
- PostCSS integration: `@tailwindcss/postcss` (pinned)
- PostCSS runtime: `postcss` (pinned via lockfile)

**Requires Node.js 20+** for full v4 compatibility and CSS-first configuration support.

### File-level contracts

- `src/app/globals.css`
  - Include `@import "tailwindcss" source("../");` as the entry point.
  - Define theme tokens via `@theme { ... }` (Tailwind v4 CSS-first).
  - Register any needed plugins via `@plugin ...`.
  - Prefer `@utility` (not `@layer utilities`) for custom utilities.
- `postcss.config.mjs`
  - Must include `@tailwindcss/postcss` as the Tailwind processor; other PostCSS plugins may coexist.
- `tailwind.config.ts`
  - Exists only for tooling compatibility; Tailwind does not load it unless `@config` is used.

### Migration checklist (v3 → v4)

> **Tip:** Before applying manual steps, run the
> [official Tailwind v4 upgrade tool](https://tailwindcss.com/docs/upgrade-guide#automated-migration)
> to automatically handle many common migration patterns.

### Utility renames

- `shadow-sm` → `shadow-xs`; `shadow` → `shadow-sm`
- `rounded-sm` → `rounded-xs`; `rounded` → `rounded-sm`
- `blur-sm` → `blur-xs`; `blur` → `blur-sm`
- Same pattern for `drop-shadow-*` and `backdrop-blur-*`
- `ring` → `ring-3` (explicit default width)
- `outline-none` (old behavior) → `outline-hidden`
- `flex-grow-*` / `flex-shrink-*` → `grow-*` / `shrink-*`
- `overflow-ellipsis` → `text-ellipsis`
- `decoration-*` → `box-decoration-*`

### Removed opacity utilities

Replace `*-opacity-*` with slash modifiers:

- `bg-black/50`, `text-black/50`, `border-black/50`, `ring-black/50`, etc.

### Selector behavior changes

- Prefer `gap-*` in flex/grid instead of relying on `space-x-*` / `space-y-*` in complex layouts.
- Validate `divide-*` behavior on nested/inline children.

### Defaults changed

- `border-*` and `ring-*` defaults now use `currentColor`; prefer explicit border and ring colors.

### Build / Setup changes

- Config now uses CSS `@theme` directives.
- Requires the `@tailwindcss/postcss` plugin and `Node 20+`.

### Preflight changes

- Altered base styles and updated image `max-width` / `max-height` rules (potential layout shifts).

### Plugin registration

- Now uses CSS `@plugin` directives instead of JS config.

## Acceptance criteria

- CSS-first config is defined in `src/app/globals.css`.
- Tailwind v4 builds succeed under static export constraints.

## Testing

### Build + verification

```bash
pnpm install
pnpm build
pnpm test
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

## Operational notes

- Use the official migration tool before manual edits when upgrading.

## Failure modes and mitigation

- CSS-first config missing → Tailwind utilities not generated; verify `globals.css` entry point.

## Key files

- `src/app/globals.css`
- `postcss.config.mjs`
- `tailwind.config.ts`

## References

- ADR-0005 (static export constraints)
- ADR-0009 (Tailwind v4 strategy)

## Changelog

- **1.0 (2026-01-19)**: Initial version.
