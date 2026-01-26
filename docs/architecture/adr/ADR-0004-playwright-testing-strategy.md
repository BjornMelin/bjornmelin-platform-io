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

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.1 | 3.19 |
| Application value | 0.30 | 9.2 | 2.76 |
| Maintenance & cognitive load | 0.25 | 9.1 | 2.28 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.13 / 10.0

## Consequences

- E2E tests validate behaviors that span multiple components and runtime layers.
- Environment variables needed for the contact form are provided in `webServer.env`.
- Base URL is configurable via `PLAYWRIGHT_BASE_URL`, defaulting to port 3100.

### Positive Outcomes

- E2E tests validate the application as a user experiences it.
- Async Server Component flows are covered without relying on unsupported unit test paths.

### Negative Consequences / Trade-offs

- E2E tests are slower than unit tests and should remain minimal and high-signal.

### Ongoing Maintenance & Considerations

- Add multi-browser coverage only when a real bug class justifies it.
- Prefer adding unit tests first when the behavior is not route-level.

## Constraints

- E2E should run against a predictable base URL and port; default is 3100.
- Tests must not depend on external network calls or third-party services.
- When `PLAYWRIGHT_BASE_URL` points to a non-local host, Playwright skips starting the local web
  server and runs against the provided URL.

## High-Level Architecture

- Playwright starts `next dev` via `webServer`.
- Tests run against `use.baseURL`.
- Reports are written to `playwright-report/`.

## Related Requirements

### Functional Requirements

- **FR-1:** Core routes render and navigate without runtime errors.
- **FR-2:** Contact form flow is validated end-to-end (UI + mocked API boundary).

### Non-Functional Requirements

- **NFR-1:** Suite remains stable and low-flake in CI.
- **NFR-2:** Suite runtime remains small enough to run on every PR.

## Design

### Test organization

- Keep route-level tests in `e2e/` and use role-based selectors.
- Prefer stable assertions (URL, headings, form states) over fragile DOM structure checks.

### Configuration

- `playwright.config.ts` sets `testDir`, `use.baseURL`, `webServer`, and reporting.
- `webServer` is only configured for local hosts (localhost, 127.0.0.1, ::1).
- Local runs against the dev server pin Playwright workers to 1 to avoid Next dev flake under parallel load.
- `PLAYWRIGHT_SERVER_MODE` selects the local server strategy: `dev` (default local), `static` (default on CI), or `none`.
- `PLAYWRIGHT_WORKERS` overrides worker count; otherwise CI defaults to 50% workers when using a static server.
- `PLAYWRIGHT_DEBUG_ARTIFACTS=true` enables traces/videos outside CI.
- `PLAYWRIGHT_SKIP_IMAGE_VARIANTS` can skip image variant generation during Playwright dev runs.
- CI shards Playwright runs across two jobs to reduce wall-clock time.
- CI builds the static export once and reuses it across shards to avoid redundant builds.
- Shard count is computed from CPU cores (capped at 4) to match available runner capacity.

## Implementation Notes

- Tests live in `e2e/`.
- `bun run test:e2e` runs Playwright, `bun run test:e2e:ui` opens the UI, and
  `bun run test:e2e:report` shows the HTML report.

## Testing

- Run locally: `bun run test:e2e` (uses `webServer` to start Next dev).
- In CI: run `bun run test:e2e` in headless mode and upload the HTML report on failure.

### Dependencies

- **Added**: `@playwright/test`, `playwright`.
- **Removed**: None.

## Changelog

- **1.0 (2026-01-16)**: Establish Playwright E2E suite and execution scripts.
