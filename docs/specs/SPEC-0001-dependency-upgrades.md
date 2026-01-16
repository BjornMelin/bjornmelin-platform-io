---
spec: SPEC-0001
title: Dependency upgrades
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements:
  - FR-001: Document dependency versions and compatibility constraints
  - NFR-001: Maintain compatibility with Next.js 14 and React 18 static export
related_adrs: ["ADR-0002", "ADR-0003", "ADR-0004", "ADR-0005"]
notes: "Tracks dependency versions and upgrade rationale for the current release."
---

# Dependency upgrades

## Summary

This specification documents the current dependency baseline and compatibility
constraints following the recent upgrade pass.

## Constraints

- Next.js remains on 14.2.x
- React remains on 18.3.x
- Node.js engine remains `>=24 <25`
- Static export (`output: \"export\"`) remains required

## Version baseline (selected)

- Next.js 14.2.35
- React 18.3.1
- TypeScript 5.9.3
- pnpm 10.28.0 (Corepack)
- Zod 4.3.5
- Vitest 4.0.x
- Playwright 1.57.x
- Biome 2.3.x

## Rationale

Upgrades prioritize security fixes, compatibility with the Next.js 14 App Router,
and improved DX while preserving static export constraints.

## References

- `package.json` for the authoritative versions
- `AGENTS.md` and `docs/development/README.md` for toolchain guidance
