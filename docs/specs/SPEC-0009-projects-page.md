---
spec: SPEC-0009
title: Projects page
version: 1.0.0
date: 2026-01-19
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-001", "NFR-001"]
related_adrs: ["ADR-0010"]
notes: "Defines the Projects page UX, data contract, and URL state semantics."
---

## Goals

- Render all projects from canonical dataset by default.
- Provide accessible search + filter + sort controls.
- Persist UI state to the URL (deep-linking, refresh-safe, back/forward-safe).
- Remain compatible with strict static export (`output: "export"`).

## Data sources

- Canonical dataset: `src/content/projects/projects.generated.json` (generated; do not edit by hand).
- Overrides: `src/content/projects/overrides.ts` (presentation-only curation).
- Normalized exports: `src/data/projects.ts`
  - `projectsData: ProjectCardModel[]`
  - `projectCategories: string[]`
  - `projectLanguages: string[]`

## UI requirements

### Controls

- Search input (query key `q`)
- Select: Category (`category`)
- Select: Language (`lang`)
- Select: Minimum stars (`minStars`)
- Select: Sort (`sort`)
- Clear button resets all state to defaults and clears URL params.

### Results

- Show a results summary: “Showing X of Y projects”.
- Empty state:
  - “No projects match the current filters.”
  - Provide “Clear filters” affordance when filtered.

### Project cards

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

## URL state contract

All state is URL-backed (nuqs) and defaults are omitted from the URL.

| Key | Type | Default | Notes |
| --- | ---- | ------- | ----- |
| `q` | string | `""` | Uses `history: "replace"` to avoid spamming history while typing |
| `category` | string | `"all"` | `"all"` means no category filter |
| `lang` | string | `"all"` | `"all"` means no language filter; language values are stored lowercased |
| `minStars` | int | `0` | Threshold filter |
| `sort` | enum | `"stars"` | One of: `stars`, `updated`, `name` |

## Filtering semantics

Filtering order (conceptual):

1. Category (exact match; `"all"` disables)
2. Language (case-insensitive; `"all"` disables)
3. Min stars (>= threshold)
4. Query search:
   - Matches across title, description, category, language, topics, and tags.
   - Normalized (trim, lowercase, diacritics removed).

## Sorting semantics

- `stars`: stars desc, then title asc
- `updated`: updated desc, then stars desc
- `name`: title asc

## Accessibility checklist (derived from Vercel guidelines)

- All inputs have accessible names (visible label or `sr-only` label).
- Icon-only buttons include `aria-label`.
- All interactive elements have visible focus styles (`focus-visible`).
- Keyboard navigation works for all controls (Input, Select, Popover).
- Hit targets are reasonable for touch (>= 44px preferred for primary actions).

## Testing requirements

- Unit tests for filtering/sorting helpers: `src/__tests__/lib/projects/filtering.test.ts`
- RTL component tests for cards and grid:
  - `src/__tests__/components/projects/project-card.test.tsx`
  - `src/__tests__/components/projects/project-grid.test.tsx` (uses nuqs testing adapter)
- E2E Playwright test:
  - `e2e/projects.spec.ts`
