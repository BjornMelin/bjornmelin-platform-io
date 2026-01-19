---
title: Requirements registry
version: 1.0.0
date: 2026-01-19
owners: ["ai-arch"]
status: Implemented
notes: "Canonical requirement IDs referenced by specs and ADRs."
---

Specs in `docs/specs/` reference requirement IDs (e.g. `FR-101`, `NFR-501`). This file is the
canonical registry of requirement IDs and their definitions.

## Functional requirements

- **FR-001**: Document dependency versions and compatibility constraints.
- **FR-101**: Unit and integration tests cover core modules and API contracts.
- **FR-201**: E2E tests cover primary routes and core user flows.
- **FR-202**: Projects page provides filtering (category, language, min stars)
  and sorting (stars, updated, name) with correct semantics.
- **FR-203**: Projects page persists UI state to URL for deep-linking and refresh-safety.
- **FR-301**: Tailwind CSS v4 integration uses CSS-first configuration via `@theme` and `@plugin` directives in globals.css.
- **FR-302**: PostCSS pipeline integrates Tailwind v4 using the `@tailwindcss/postcss` plugin to process CSS-first configuration via `@theme` and `@plugin` directives in the Next.js build pipeline.
- **FR-401**: All pages render with responsive images in a static export.
- **FR-501**: Production deploys are fully automated via GitHub Actions.

## Non-functional requirements

- **NFR-001**: Maintain compatibility with Next.js 16 and React 19 static export.
- **NFR-101**: Tests are deterministic and CI-friendly.
- **NFR-201**: E2E tests remain stable and fast with minimal flake risk.
- **NFR-202**: Projects page remains accessible (WCAG 2.1 Level AA) with keyboard nav and ARIA labels.
- **NFR-301**: CSS output must be deterministic and reproducible across local development, CI environments, and production deployments (no non-determinism from file ordering, hashing, or environment variables).
- **NFR-401**: No runtime image optimization service required.
- **NFR-501**: CSP headers and static export artifacts never drift.
- **NFR-601**: CSP stays strict without Server Actions/nonces.
- **NFR-602**: No CloudFront Function 10 KB outages.
- **NFR-603**: Fully IaC deployable on forks.
