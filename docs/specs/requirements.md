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
- **FR-401**: All pages render with responsive images in a static export.
- **FR-501**: Production deploys are fully automated via GitHub Actions.

## Non-functional requirements

- **NFR-001**: Maintain compatibility with Next.js 16 and React 19 static export.
- **NFR-101**: Tests are deterministic and CI-friendly.
- **NFR-201**: E2E tests remain stable and fast with minimal flake risk.
- **NFR-401**: No runtime image optimization service required.
- **NFR-501**: CSP headers and static export artifacts never drift.
- **NFR-601**: CSP stays strict without Server Actions/nonces.
- **NFR-602**: No CloudFront Function 10 KB outages.
- **NFR-603**: Fully IaC deployable on forks.
