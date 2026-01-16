---
spec: SPEC-0002
title: Vitest testing coverage and practices
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements:
  - FR-101: Unit and integration tests cover core modules and API logic
  - NFR-101: Tests are deterministic and CI-friendly
related_adrs: ["ADR-0003"]
notes: "Defines Vitest scope, conventions, and execution practices."
---

# Vitest testing coverage and practices

## Scope

Vitest is used for:

- Unit tests (pure functions, schemas, utilities)
- Integration tests (API handlers, multi-module workflows)
- Component tests in `jsdom` when DOM behavior is required

Async Server Components are covered by Playwright E2E per ADR-0004.

## Coverage targets

- Prioritize logic-heavy modules and security utilities.
- Avoid coverage for static UI-only pages where behavior is already validated via E2E.

## Conventions

- Use behavior-driven assertions (Testing Library queries by role).
- Reset mocks after each test to prevent leakage.
- Avoid network calls and uncontrolled timers.

## Execution

```bash
pnpm test           # Watch mode (interactive)
pnpm test:coverage  # CI-friendly, single run with coverage
```

## Artifacts

- Coverage output under `coverage/`.
- JUnit or blob reporters may be added later if CI requires them.
