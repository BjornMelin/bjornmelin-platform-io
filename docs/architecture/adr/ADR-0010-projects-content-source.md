---
ADR: 0010
Title: Projects canonical content source
Status: Implemented
Version: 1.0
Date: 2026-01-19
Supersedes: []
Superseded-by: []
Related: ["ADR-0005", "ADR-0011"]
Tags: ["architecture", "content", "projects"]
References:
  - "docs/architecture/adr/ADR-0011-url-state-nuqs.md"
---

## Status

Implemented (2026-01-19)

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.0 | 3.15 |
| Application value | 0.30 | 9.5 | 2.85 |
| Maintenance & cognitive load | 0.25 | 9.2 | 2.30 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.2 / 10.0

## Context

The Projects page must work under strict static export (`output: "export"`) and deploy to S3/CloudFront.
All Projects data must be available at build time and must remain stable, typed, and testable.

Historically, the repo used a hand-curated `src/data/projects.ts` array and a generated JSON under `docs/`.
We need a single canonical source that:

- Is safe for static export (no runtime fetching).
- Has a validation boundary (Zod) to protect the UI from generator changes.
- Supports light curation without editing the generated file.
- Produces a lean view model to avoid shipping unnecessary data into Client Components.

## Decision

We adopt a canonical Projects content pipeline:

- Canonical dataset lives at `src/content/projects/projects.generated.json` (generated; not edited by hand).
- A curated overrides layer lives at `src/content/projects/overrides.ts` (presentation only).
- The generated JSON is validated at the boundary with Zod (`src/lib/schemas/github-projects.ts`).
- A normalized view model is produced in `src/data/projects.ts` and exported for UI consumption.

## Alternatives considered

- Keep canonical data under `docs/` and import it from there.
- Convert the generated JSON to a TypeScript module exporting constants.
- Put the JSON in `public/` and fetch client-side.

## Consequences

### Positive

- Static-export safe: all data is bundled at build time.
- Safer evolution: generator can add fields without breaking runtime, thanks to `z.looseObject()` and `.catchall(z.unknown())`.
- Faster UI iteration: presentation changes do not require editing the generated file.
- Smaller client payload: Client Components receive a pre-normalized model with only needed fields.
- GitHub repository facts can be refreshed automatically without adding runtime API routes or serverless handlers.

### Trade-offs

- Requires keeping overrides keyed by stable project `id`.
- Any schema-breaking generator changes fail fast at build/test time.
- Repository metrics are current as of the last generated-data refresh, not fetched at request time.

## GitHub metrics refresh

Issue #151 originally proposed live API routes and serverless caching. That design conflicts with this repository's
mandatory static export deployment. The implemented architecture keeps the same user-facing value with a scheduled
and manually runnable generation step instead:

- `scripts/refresh-projects-github-metadata.ts` discovers public owner repositories from the GitHub REST API.
- Repositories with at least five stars are written to `src/content/projects/projects.generated.json`.
- Existing curated fields, including summaries, architecture notes, recommendations, and overrides, stay under repo
  review instead of being replaced by API data.
- Refreshed facts include stars, forks, watchers, topics, default branch, commit count, open pull request count,
  latest release metadata, and last pushed date.
- `.github/workflows/projects-github-metadata-refresh.yml` runs the refresh on a weekly schedule or manual dispatch,
  runs focused checks, and opens a generated-data pull request when the file changes.
- `pnpm projects:github:check` can be used as a drift check. It compares the checked-in generated file with current
  GitHub API results while preserving the checked-in `metadata.generated` date.
