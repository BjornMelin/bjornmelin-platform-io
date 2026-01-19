---
ADR: 0011
Title: URL-as-state for Projects filters via nuqs
Status: Implemented
Version: 1.0
Date: 2026-01-19
Supersedes: []
Superseded-by: []
Related: ["ADR-0010"]
Tags: ["architecture", "state", "url", "nuqs", "projects"]
References:
  - "https://nuqs.47ng.com/"
---

## Status

Implemented (2026-01-19)

## Context

The Projects page supports search/filter/sort and must:

- Deep-link state (shareable URLs).
- Preserve state on refresh and back/forward navigation.
- Remain compatible with strict static export (no server runtime).
- Be testable without brittle Next router mocks.

## Decision

We use **nuqs (v2+)** for typed query string state:

- Add `NuqsAdapter` at the app root via `src/app/providers.tsx`.
- Define shared parsers in `src/lib/projects/query-state.ts` using `nuqs/server` (server-safe import).
- Use `useQueryStates` in the Projects grid Client Component to own the URL state.
- Use nuqs testing adapter (`nuqs/adapters/testing`) for component tests.

## Alternatives considered

- Manual parsing with `useSearchParams`/`useRouter` and custom validation.
- Introducing a router library (e.g., TanStack Router) for typed search params.

## Consequences

### Positive

- Single source of truth: UI state and URL stay in sync.
- Deep-linking works by construction.
- Tests can assert URL updates via the nuqs testing adapter.
- Minimal Next.js coupling; no request-time server dependency.

### Trade-offs

- Adds a dependency (`nuqs`), but replaces custom URL glue code.
- Requires root adapter wiring to avoid nested providers in feature code.
