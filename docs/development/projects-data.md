# Projects data

The Projects page is built from a generated dataset checked into the repo.

## Canonical source (generated)

- Canonical dataset: `src/content/projects/projects.generated.json`
- This file is generated and should not be edited by hand.

## Overrides (curation layer)

- Location: `src/content/projects/overrides.ts`
- Keyed by project `id` from the generated dataset.
- Use for presentation-only tweaks (featured flags, primary URL, links, highlights, hiding).

## Validation (statistics)

- The generated JSON includes computed aggregates under `statistics`.
- Verify statistics match the project list:
  - Script: `node scripts/verify-projects-json-statistics.mjs`
  - Test: `pnpm test` (includes the statistics verification test)

## GitHub metadata refresh

- Refresh script: `pnpm projects:github:refresh`
- Drift check: `pnpm projects:github:check`
- Required token: `PROJECTS_GITHUB_REFRESH_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN`
- Scheduled PR token: `PROJECTS_GITHUB_REFRESH_PR_TOKEN` with `contents: write` and `pull-requests: write`
- Optional local fallback: pass `--allow-unauthenticated` for low-volume manual checks.

The refresh discovers public `BjornMelin` owner repositories from GitHub, keeps repositories with at least five stars,
updates metrics in the generated JSON, and preserves curated summaries and the overrides layer. Metrics include stars,
forks, watchers, default branch, commit count, open pull request count, latest release, topics, and last pushed date.

The scheduled workflow `.github/workflows/projects-github-metadata-refresh.yml` runs the refresh weekly and opens or
updates a generated-data pull request when the checked-in JSON changes.
