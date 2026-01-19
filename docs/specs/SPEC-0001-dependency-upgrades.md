---
spec: SPEC-0001
title: Dependency upgrades
version: 1.1.0
date: 2026-01-18
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-001", "NFR-001"]
related_adrs: ["ADR-0002", "ADR-0003", "ADR-0004", "ADR-0005", "ADR-0009"]
notes: "Tracks dependency versions and upgrade rationale for the current release."
---

## Summary

This specification documents the current dependency baseline and compatibility
constraints following the recent upgrade pass.

## Context

This baseline reflects the latest completed upgrade cycle and the constraints
required to keep the static export pipeline stable.

## Goals / Non-goals

### Goals

- Document the core dependency baseline used by the repo.
- Preserve compatibility with the Next.js App Router static export.
- Reduce operational surface area by removing unused dependencies.

### Non-goals

- Defining future upgrade timelines or release policies.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-001:** Document dependency versions and compatibility constraints.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static export.

## Constraints

- Next.js remains on 16.1.x
- React remains on 19.2.x
- Node.js engine remains `>=24 <25` (validated in CI for this repository)
- Static export (`output: "export"`) remains required

## Design

### Version baseline (pinned)

- Next.js 16.1.3
- React 19.2.3
- TypeScript 5.9.3
- Tailwind CSS 4.1.18
- @tailwindcss/postcss 4.1.18
- pnpm 10.28.0 (Corepack)
- Zod 4.3.5
- Vitest 4.0.17
- Playwright 1.57.0
- Biome 2.3.11

*Note: `pnpm-lock.yaml` is the source of truth for reproducible installs. This
spec lists the intentional baseline versions for the core toolchain.*

### Reproducibility note

The lockfile is the source of truth for reproducible installs. Core runtime
dependencies are pinned, while many non-core dependencies use ranges and are
resolved via `pnpm-lock.yaml`.

### Rationale

Upgrades prioritize security fixes, compatibility with the Next.js 16.1.x App Router,
and improved DX while preserving static export constraints.

This baseline also removes unused dependencies to reduce the operational surface area (example:
`framer-motion` was removed after it was no longer referenced in app code).

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.0 | 3.15 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.03 / 10.0

## Acceptance criteria

- `package.json` and `pnpm-lock.yaml` reflect the intended core dependency baseline.
- Static export remains compatible with the pinned toolchain.

## Testing

- Not applicable (documentation-only spec).

## Operational notes

- Follow the standard upgrade workflow and re-run `pnpm install` before `pnpm build`.

## Failure modes and mitigation

- Dependency drift → Re-run `pnpm install` and validate lockfile changes in CI.

## Key files

- `package.json`
- `pnpm-lock.yaml`

## References

- `package.json` for the authoritative versions
- `AGENTS.md` and `docs/development/README.md` for toolchain guidance
- [Zod v4 migration guide](https://zod.dev/v4/changelog) / ADR-0002 (Zod v4 strategy)
- [Vitest v4 migration notes](https://vitest.dev/guide/migration) / ADR-0003 (testing changes)
- ADR-0004 (toolchain changes) / ADR-0005 (static export constraints)

## Changelog

- **1.1 (2026-01-18)**: Current baseline and constraints.
