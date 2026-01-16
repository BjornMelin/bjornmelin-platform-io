---
ADR: 0004
Title: Playwright end-to-end testing strategy
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0003", "ADR-0005"]
Tags: ["testing", "playwright", "e2e"]
References:
  - "[Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)"
  - "[Playwright test configuration](https://playwright.dev/docs/test-configuration)"
  - "[Playwright webServer](https://playwright.dev/docs/test-webserver)"
---

# ADR 0004: Playwright end-to-end testing strategy

## Status

Implemented (2026-01-16).

## Description

Use Playwright for end-to-end coverage of primary routes and core user flows,
including async Server Component behavior that is not reliably unit-testable in Vitest.

## Context

E2E tests are required to validate route-level behavior, browser navigation,
and async Server Components that cannot be reliably unit-tested in Vitest.

## Decision Drivers

- Catch route-level regressions (navigation, rendering, client interactivity).
- Validate behaviors that span multiple components/modules.
- Keep suites fast and low-flake (default to Chromium only).

## Alternatives

- Only unit tests (rejected: misses runtime navigation and browser-only behavior).
- Cypress (rejected: current stack and tooling already standardized on Playwright).
- Multi-browser by default (rejected: increases runtime and flake risk without clear value today).

## Decision

Use Playwright for E2E coverage:

- Cover primary routes and critical flows (navigation, projects, contact form).
- Run against a local Next.js dev server started via Playwright `webServer`.
- Use a single browser project (Chromium) by default to keep the suite fast,
  with the option to enable additional browsers if needed.

## Consequences

- E2E tests validate behaviors that span multiple components and runtime layers.
- Environment variables needed for the contact form are provided in `webServer.env`.
- Base URL is configurable via `PLAYWRIGHT_BASE_URL`, defaulting to port 3100.

## Constraints

- E2E should run against a predictable base URL and port; default is 3100.
- Tests must not depend on external network calls or third-party services.

## High-Level Architecture

- Playwright starts `next dev` via `webServer`.
- Tests run against `use.baseURL`.
- Reports are written to `playwright-report/`.

## Related Requirements

### Functional Requirements

- **FR-1:** Core routes render and navigate without runtime errors.
- **FR-2:** Contact form flow is validated end-to-end (UI + route handler behavior).

### Non-Functional Requirements

- **NFR-1:** Suite remains stable and low-flake in CI.
- **NFR-2:** Suite runtime remains small enough to run on every PR.

## Design

### Test organization

- Keep route-level tests in `e2e/` and use role-based selectors.
- Prefer stable assertions (URL, headings, form states) over fragile DOM structure checks.

### Configuration

- `playwright.config.ts` sets `testDir`, `use.baseURL`, `webServer`, and reporting.

## Implementation Notes

- Tests live in `e2e/`.
- `pnpm test:e2e` runs Playwright, `pnpm test:e2e:ui` opens the UI, and
  `pnpm test:e2e:report` shows the HTML report.

## Testing

- Run locally: `pnpm test:e2e` (uses `webServer` to start Next dev).
- In CI: run `pnpm test:e2e` in headless mode and upload the HTML report on failure.

## Consequences

### Positive Outcomes

- E2E tests validate the application as a user experiences it.
- Async Server Component flows are covered without relying on unsupported unit test paths.

### Negative Consequences / Trade-offs

- E2E tests are slower than unit tests and should remain minimal and high-signal.

### Ongoing Maintenance & Considerations

- Add multi-browser coverage only when a real bug class justifies it.
- Prefer adding unit tests first when the behavior is not route-level.

### Dependencies

- **Added**: `@playwright/test`, `playwright`.
- **Removed**: None.

## Changelog

- **1.0 (2026-01-16)**: Establish Playwright E2E suite and execution scripts.
