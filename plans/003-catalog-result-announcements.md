# Plan 003: Announce catalog result changes

> **Executor instructions**: Execute only after Plan 002. Run every check and update this plan's row
> in `plans/README.md`. Do not introduce multiple competing live regions.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 151e9b6..HEAD -- src/components/projects/project-grid.tsx \
>   src/components/agent-skills/agent-skills-grid.tsx src/__tests__ e2e
> ```

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/002-catalog-history.md`
- **Category**: bug
- **Planned at**: commit `151e9b6`, 2026-07-16

## Why this matters

Both catalogs visibly replace their result sets as users type or choose a filter, but their result
counts are ordinary paragraphs. Screen-reader users receive no confirmation that a filter worked or
that it produced zero results. One atomic polite status per catalog gives concise feedback without
adding a second announcement for the empty state.

## Current state

- `src/components/projects/project-grid.tsx:241-246` renders `Showing X of Y projects` in a plain
  `<p>`. Its zero-state appears separately at line 265.
- `src/components/agent-skills/agent-skills-grid.tsx:286-291` renders the equivalent skill count in a
  plain `<p>`. Its zero-state appears separately at line 302.
- `src/components/agent-skills/command-copy-button.tsx:60` is the local exemplar for a polite status.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Focused component tests | `pnpm exec vitest run src/__tests__/components/project-grid.test.tsx src/__tests__/components/agent-skills-grid.test.tsx` | exit 0, adapting only to actual existing filenames |
| Browser tests | `pnpm exec playwright test e2e/projects.spec.ts e2e/agent-skills.spec.ts` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:

- `src/components/projects/project-grid.tsx`
- `src/components/agent-skills/agent-skills-grid.tsx`
- Their existing component and E2E tests

**Out of scope**:

- Filter logic, URL keys, or card rendering
- Toasts or new dependencies
- Separate live regions for empty-state copy

## Steps

### Step 1: Make each count one atomic polite status

Add `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` to each existing result-count
paragraph. Preserve the visible text and typography. Do not add live-region semantics to the empty
state because `Showing 0 of N` already conveys that transition.

**Verify**: `pnpm type-check` exits 0.

### Step 2: Lock the status contract

In each existing grid test, change a filter and assert the single status exposes the updated full
sentence. Cover the zero-result case and assert there is still exactly one `role=status` within the
catalog. If a grid test file does not exist, create the smallest focused test matching repository
Testing Library conventions.

**Verify**: the focused component tests pass.

### Step 3: Preserve end-to-end behavior

Add one concise status assertion to each catalog E2E test after its discrete filter changes. Do not
use arbitrary sleeps or assert implementation classes.

**Verify**: both browser specs pass.

## Done criteria

- [ ] Each catalog contains exactly one atomic polite result status.
- [ ] Zero results are announced through the count without a competing live region.
- [ ] Component tests, browser specs, and typecheck pass.

## STOP conditions

- A catalog already gained another result live region after the plan commit.
- Rapid typing produces duplicate announcements from more than one status node.
- The accessible name excludes the visible count sentence.

## Maintenance notes

Keep result feedback in the existing count node. If pagination arrives, update this one sentence
rather than adding another live region.
