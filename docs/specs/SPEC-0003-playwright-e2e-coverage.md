---
spec: SPEC-0003
title: Playwright E2E coverage and practices
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements:
  - FR-201: E2E tests cover primary routes and core user flows
  - NFR-201: E2E tests remain stable and fast with minimal flake risk
related_adrs: ["ADR-0004"]
notes: "Defines Playwright scope, browser targets, and runtime configuration."
---

## Scope

Playwright covers:

- Primary routes (`/`, `/about`, `/projects`, `/contact`, `404`)
- Navigation and filtering flows
- Contact form submission behavior and validation UI

## Configuration

- Base URL is `http://localhost:3100` by default.
- `PLAYWRIGHT_BASE_URL` overrides the base URL.
- `webServer` starts `next dev` on the expected port with env injected for tests.

## Browser matrix

- Chromium only by default for speed.
- Additional browsers can be enabled when required.

## Execution

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:report
```

## Artifacts

- HTML report under `playwright-report/`.
