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
