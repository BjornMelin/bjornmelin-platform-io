---
ADR: 0009
Title: Tailwind CSS v4 with CSS-first configuration
Status: Implemented
Version: 1.0
Date: 2026-01-19
Supersedes: []
Superseded-by: []
Related: ["ADR-0005"]
Tags: ["frontend", "tailwind", "postcss", "static-export"]
References:
  - "[Tailwind v3→v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)"
  - "[Install Tailwind using PostCSS](https://tailwindcss.com/docs/installation/using-postcss)"
  - "[Theme variables / @theme](https://tailwindcss.com/docs/theme)"
  - "[Functions & directives](https://tailwindcss.com/docs/functions-and-directives)"
  - "[Detecting classes / @source](https://tailwindcss.com/docs/detecting-classes-in-source-files)"
  - "[Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4)"
  - "[Tailwind CSS v4.1 announcement](https://tailwindcss.com/blog/tailwindcss-v4-1)"
---

## Status

Implemented (2026-01-19).

## Description

Adopt Tailwind CSS v4 with a CSS-first configuration embedded in the app’s global stylesheet and
use the dedicated PostCSS plugin package (`@tailwindcss/postcss`) for builds.

## Context

This project is a strict **Next.js static export** (ADR-0005). Styling must be:

- Build-time only (no runtime server required)
- Fast and reproducible (pinned versions + lockfile)
- Simple to maintain (minimal config surface)

Tailwind v4 introduces a CSS-first configuration model (`@theme`, `@utility`, `@source`) and moves
framework integrations into dedicated packages (e.g. `@tailwindcss/postcss`).

## Decision Drivers

- Reduce JS config surface area (KISS/YAGNI).
- Prefer Tailwind v4’s intended configuration style (CSS-first).
- Keep static export constraints intact (ADR-0005).
- Keep developer tooling compatibility (shadcn/ui expects a config file path).

## Alternatives

- A: Keep Tailwind v3 + JS config — rejected: legacy, slower, higher config surface area.
- B: Tailwind v4 with a legacy JS config (`@config ...`) — rejected: unnecessary for this repo.
- C: Vite plugin integration — rejected: Next.js uses PostCSS in this repo.

### Decision Framework

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.3 | 3.26 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.4 | 2.35 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.24 / 10.0

## Decision

We will use:

- `tailwindcss` v4 (pinned)
- `@tailwindcss/postcss` for PostCSS builds
- A CSS-first configuration in `src/app/globals.css`:
  - `@import "tailwindcss" source("../");`
  - `@theme { ... }` for theme tokens
  - `@utility ... { ... }` for custom utilities
  - `@plugin ...` for Tailwind plugins

We will keep `tailwind.config.ts` only as a **tooling compatibility stub** (not loaded by Tailwind)
for integrations that require a config path (e.g. shadcn/ui). Tailwind v4 does not auto-load config
files unless explicitly opted in via `@config`.

## Constraints

- The web app remains a strict static export (ADR-0005).
- Do not add Tailwind JS config features that are removed/unsupported in v4:
  - `separator`, `corePlugins`, `safelist` (use `@source` instead).
- Avoid preprocessors (Sass/Less/Stylus) in the Tailwind pipeline.

## Implementation Notes

- PostCSS config: `postcss.config.mjs` uses only `@tailwindcss/postcss`.
- Global styling entry point: `src/app/globals.css`.
- Tailwind config stub: `tailwind.config.ts` is for tooling only; do not opt-in via `@config`.

## Consequences

### Positive Outcomes

- Smaller and clearer configuration surface (CSS-first).
- Faster builds and fewer moving parts (no Tailwind-in-PostCSS legacy shims).
- Better alignment with Tailwind’s forward direction (v4 idioms).

### Negative Consequences / Trade-offs

- Some tools still expect a config file; we keep a stub config file for compatibility.
- Tailwind v4 has breaking class/utility changes that must be reflected in markup and docs.
