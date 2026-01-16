---
ADR: 0003
Title: Vitest unit and integration testing strategy
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0002", "ADR-0004", "ADR-0005"]
Tags: ["testing", "vitest", "quality"]
References:
  - "[Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)"
  - "[Vitest configuration](https://vitest.dev/config)"
  - "[Vitest CLI](https://vitest.dev/guide/cli)"
---

## Context

We need fast, deterministic, and maintainable unit/integration tests that run
locally and in CI. The app uses the Next.js App Router and static export.

## Decision

Use Vitest for unit and integration tests:

- Unit tests for pure functions, schema validation, and utilities.
- Integration tests for multi-module workflows (no Next.js API Route Handlers in the web app).
- React component tests in `jsdom` when DOM behavior is required.
- Avoid testing async Server Components in Vitest; cover them via Playwright E2E.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.2 | 3.22 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.2 | 2.30 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.15 / 10.0

## Consequences

- Tests must be deterministic (no real network or timers without control).
- We prioritize behavior-based assertions over implementation details.
- CI should run `vitest run` for a non-interactive, single-pass execution.

## Implementation notes

- `vitest.config.ts` configures jsdom and path aliases.
- `pnpm test` runs Vitest in watch mode when interactive.
- Coverage is enforced in `pnpm test:coverage`.

## Status

Implemented. All new unit/integration tests must follow this strategy.
