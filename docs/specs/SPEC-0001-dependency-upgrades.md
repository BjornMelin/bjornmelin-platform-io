---
spec: SPEC-0001
title: Dependency upgrades
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements:
  - FR-001: Document dependency versions and compatibility constraints
  - NFR-001: Maintain compatibility with Next.js 16 and React 19 static export
related_adrs: ["ADR-0002", "ADR-0003", "ADR-0004", "ADR-0005"]
notes: "Tracks dependency versions and upgrade rationale for the current release."
---

## Summary

This specification documents the current dependency baseline and compatibility
constraints following the recent upgrade pass.

## Constraints

- Next.js remains on 16.1.x
- React remains on 19.2.x
- Node.js engine remains `>=24 <25` (Node.js <25 due to Next.js 16.1.x compatibility)
- Static export (`output: "export"`) remains required

## Version baseline (pinned)

- Next.js 16.1.2
- React 19.2.3
- TypeScript 5.9.3
- pnpm 10.28.0 (Corepack)
- Zod 4.3.5
- Vitest 4.0.17
- Playwright 1.57.0
- Biome 2.3.11

*Note: All dependencies are pinned to exact versions to ensure build reproducibility and
compatibility with the static export architecture.*

## Rationale

Upgrades prioritize security fixes, compatibility with the Next.js 16.1.x App Router,
and improved DX while preserving static export constraints.

## References

- `package.json` for the authoritative versions
- `AGENTS.md` and `docs/development/README.md` for toolchain guidance
- [Zod v4 migration guide](https://zod.dev/v4/changelog) / ADR-0002 (Zod v4 strategy)
- [Vitest v4 migration notes](https://vitest.dev/guide/migration) / ADR-0003 (testing changes)
- ADR-0004 (toolchain changes) / ADR-0005 (static export constraints)
