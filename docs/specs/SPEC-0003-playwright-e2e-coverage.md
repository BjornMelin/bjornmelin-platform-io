---
spec: SPEC-0003
title: Playwright E2E coverage and practices
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-201", "NFR-201"]
related_adrs: ["ADR-0004"]
notes: "Defines Playwright scope, browser targets, and runtime configuration."
---

## Summary

This spec defines Playwright E2E coverage scope, browser targets, and execution.

## Context

Playwright provides end-to-end coverage for user flows not exercised in unit tests.

## Goals / Non-goals

### Goals

- Validate primary routes and core navigation flows.
- Ensure UI behavior matches expected user journeys.
- Keep E2E runs fast and stable.

### Non-goals

- Unit-level coverage (handled by Vitest).

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-201:** E2E tests cover primary routes and core user flows.

### Non-functional requirements

- **NFR-201:** E2E tests remain stable and fast with minimal flake risk.

## Constraints

- No additional constraints beyond repository test/tooling baselines.

## Design

### Scope

Playwright covers:

- Primary routes (`/`, `/about`, `/projects`, `/contact`, `404`)
- Navigation and filtering flows
- Contact form submission behavior and validation UI (API boundary mocked in-test)

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.1 | 3.19 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.1 | 2.28 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.10 / 10.0

### Configuration

- Base URL is `http://localhost:3100` by default.
- `PLAYWRIGHT_BASE_URL` overrides the base URL.
- `webServer` starts `next dev` on the expected port with env injected for tests.

### Browser matrix

- Chromium only by default for speed.
- Additional browsers can be enabled when required.

## Acceptance criteria

- Primary routes and core flows have E2E coverage.
- Runs remain stable with minimal flake risk.

## Testing

### Execution

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:report
```

## Operational notes

### Artifacts

- HTML report under `playwright-report/`.

## Failure modes and mitigation

- Flaky E2E → reduce test coupling and avoid non-deterministic assertions.

## Key files

- `playwright.config.ts`
- `e2e/`

## References

- ADR-0004 (testing changes)

## Changelog

- **1.0 (2026-01-16)**: Initial version.
