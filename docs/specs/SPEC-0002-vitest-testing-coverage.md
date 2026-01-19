---
spec: SPEC-0002
title: Vitest testing coverage and practices
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-101", "NFR-101"]
related_adrs: ["ADR-0003", "ADR-0004"]
notes: "Defines Vitest scope, conventions, and execution practices."
---

## Summary

This spec defines Vitest coverage scope, conventions, and execution practices.

## Context

Vitest is the primary unit/integration test runner for this repository.

## Goals / Non-goals

### Goals

- Cover core logic modules with deterministic tests.
- Maintain fast, CI-friendly test execution.
- Define clear conventions for unit and integration tests.

### Non-goals

- E2E coverage (handled by Playwright per ADR-0004).

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-101:** Unit and integration tests cover core modules and API contracts.

### Non-functional requirements

- **NFR-101:** Tests are deterministic and CI-friendly.

## Constraints

- No additional constraints beyond repository test/tooling baselines.

## Design

### Scope

Vitest is used for:

- Unit tests (pure functions, schemas, utilities)
- Integration tests (multi-module workflows and API contract helpers)
- Component tests in `jsdom` when DOM behavior is required

Async Server Components are covered by Playwright E2E per ADR-0004.

### Coverage targets

- Prioritize logic-heavy modules and security utilities.
- Avoid coverage for static UI-only pages where behavior is already validated via E2E.

### Conventions

- Use behavior-driven assertions (Testing Library queries by role).
- Reset mocks after each test to prevent leakage.
- Avoid network calls and uncontrolled timers.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.2 | 3.22 |
| Application value | 0.30 | 9.0 | 2.70 |
| Maintenance & cognitive load | 0.25 | 9.1 | 2.28 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.10 / 10.0

## Acceptance criteria

- Coverage focuses on logic-heavy modules.
- Tests remain deterministic and CI-friendly.

## Testing

### Execution

```bash
pnpm test           # Watch mode (interactive)
pnpm test:coverage  # CI-friendly, single run with coverage
```

## Operational notes

### Artifacts

- Coverage output under `coverage/`.
- JUnit or blob reporters may be added later if CI requires them.

## Failure modes and mitigation

- Flaky tests → eliminate uncontrolled timers and network calls.

## Key files

- `vitest.config.ts`
- `src/__tests__/`

## References

- ADR-0003 (Vitest v4 strategy)
- ADR-0004 (testing changes)

## Changelog

- **1.0 (2026-01-16)**: Initial version.
