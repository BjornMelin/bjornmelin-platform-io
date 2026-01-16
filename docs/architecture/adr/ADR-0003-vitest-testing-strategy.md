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

# ADR 0003: Vitest unit and integration testing strategy

## Context

We need fast, deterministic, and maintainable unit/integration tests that run
locally and in CI. The app uses the Next.js App Router and static export.

## Decision

Use Vitest for unit and integration tests:

- Unit tests for pure functions, schema validation, and utilities.
- Integration tests for API handlers and multi-module workflows.
- React component tests in `jsdom` when DOM behavior is required.
- Avoid testing async Server Components in Vitest; cover them via Playwright E2E.

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
