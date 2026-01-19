---
spec: SPEC-0009
title: Projects page
version: 1.0.0
date: 2026-01-19
owners: ["ai-arch"]
status: Proposed
related_requirements: ["FR-202", "FR-203", "NFR-001", "NFR-202"]
related_adrs: ["ADR-0010", "ADR-0011"]
notes: "Defines the Projects page UX, data contract, and URL state semantics."
---

## Summary

Defines the Projects page UX, data sources, and URL state semantics.

## Context

The Projects page must remain compatible with static export while offering rich client-side filtering.

## Goals / Non-goals

### Goals

- Render all projects from canonical dataset by default.
- Provide accessible search + filter + sort controls.
- Persist UI state to the URL (deep-linking, refresh-safe, back/forward-safe).
- Remain compatible with strict static export (`output: "export"`).

### Non-goals

- Server-side filtering or runtime data fetching.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-202:** Projects page provides filtering (category, language, min stars)
  and sorting (stars, updated, name) with correct semantics.
- **FR-203:** Projects page persists UI state to URL for deep-linking and refresh-safety.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static export.
- **NFR-202:** Projects page remains accessible (WCAG 2.1 Level AA) with keyboard nav and ARIA labels.

## Constraints

- Static export only; no server-side handlers.

## Design

## Data sources

- Canonical dataset: `src/content/projects/projects.generated.json` (generated; do not edit by hand).
- Overrides: `src/content/projects/overrides.ts` (presentation-only curation).
- Normalized exports: `src/data/projects.ts`
  - `projectsData: ProjectCardModel[]`
  - `projectCategories: string[]`
  - `projectLanguages: string[]`

### UI requirements

#### Controls

- Search input (query key `q`)
- Select: Category (`category`)
- Select: Language (`lang`)
- Select: Minimum stars (`minStars`)
- Select: Sort (`sort`)
- Clear button resets all state to defaults and clears URL params.

#### Results

- Show a results summary: “Showing X of Y projects”.
- Empty state:
  - “No projects match the current filters.”
  - Provide “Clear filters” affordance when filtered.

#### Project cards

- No images.
- Category and language badges.
- Title is a link to `primaryUrl`.
- Stats row: stars, forks, updated label.
- Footer CTAs:
  - GitHub repo icon-only button (with `aria-label`)
  - “Open” button to `primaryUrl`
  - Optional “Live” and “Docs” buttons when provided
- Tags overflow:
  - Render first N tags inline.
  - Remaining tags are shown via Popover.

### URL state contract

All state is URL-backed (nuqs) and defaults are omitted from the URL.

| Key | Type | Default | Notes |
| --- | ---- | ------- | ----- |
| `q` | string | `""` | Uses `history: "replace"` to avoid spamming history while typing |
| `category` | string | `"all"` | `"all"` means no category filter |
| `lang` | string | `"all"` | `"all"` means no language filter; language values are stored lowercased |
| `minStars` | int | `0` | Threshold filter |
| `sort` | enum | `"stars"` | One of: `stars`, `updated`, `name` |

### Filtering semantics

Filtering order (conceptual):

1. Category (exact match; `"all"` disables)
2. Language (case-insensitive; `"all"` disables)
3. Min stars (>= threshold)
4. Query search:
   - Matches across title, description, category, language, topics, and tags.
   - Normalized (trim, lowercase, diacritics removed).

### Sorting semantics

- `stars`: stars desc, then title asc
- `updated`: updated desc, then stars desc
- `name`: title asc

### Accessibility checklist (derived from Vercel guidelines)

- All inputs have accessible names (visible label or `sr-only` label).
- Icon-only buttons include `aria-label`.
- All interactive elements have visible focus styles (`focus-visible`).
- Keyboard navigation works for all controls (Input, Select, Popover).
- Hit targets are reasonable for touch (>= 44px preferred for primary actions).

## Acceptance criteria

- Page renders with full dataset by default.
- URL state is stable across refresh and navigation.
- Filters/sorting match defined semantics.

## Testing

### Testing requirements

- Unit tests for filtering/sorting helpers: `src/__tests__/lib/projects/filtering.test.ts`
- RTL component tests for cards and grid:
  - `src/__tests__/components/projects/project-card.test.tsx`
  - `src/__tests__/components/projects/project-grid.test.tsx` (uses nuqs testing adapter)
- E2E Playwright test:
  - `e2e/projects.spec.ts`

## Decision Framework Score (must be ≥ 9.0)

UNVERIFIED (score not recorded in original spec).

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | UNVERIFIED | UNVERIFIED |
| Application value | 0.30 | UNVERIFIED | UNVERIFIED |
| Maintenance & cognitive load | 0.25 | UNVERIFIED | UNVERIFIED |
| Architectural adaptability | 0.10 | UNVERIFIED | UNVERIFIED |

**Total:** UNVERIFIED / 10.0

## Operational notes

- Ensure generated project data stays in sync with UI expectations.

## Failure modes and mitigation

- URL state drift → verify nuqs parameter defaults and serialization.

## Key files

- `src/app/projects/page.tsx`
- `src/data/projects.ts`
- `src/content/projects/projects.generated.json`

## References

- ADR-0010 (projects data contract)
- ADR-0011 (projects page UX)

## Changelog

- **1.0 (2026-01-19)**: Initial version.
