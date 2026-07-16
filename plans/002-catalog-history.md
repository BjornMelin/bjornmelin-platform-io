# Plan 002: Make discrete catalog filters navigable

> **Executor instructions**: Follow this plan step by step, run every verification command, and
> update this plan's row in `plans/README.md`. Stop on drift or a failed behavioral assumption.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 151e9b6..HEAD -- src/lib/projects/query-state.ts \
>   src/lib/agent-skills/query-state.ts e2e/projects.spec.ts e2e/agent-skills.spec.ts
> ```

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `151e9b6`, 2026-07-16

## Why this matters

Discrete project and Agent Skills filters currently use nuqs' default `replace` behavior. Production
testing confirmed that selecting the RAG category leaves `history.length` unchanged and Back exits
`/projects` for the home page instead of undoing the filter. The Projects E2E test claims this works
but only asserts that the destination lacks `category`, so it can pass while leaving the page.

## Current state

- `src/lib/projects/query-state.ts:10` correctly keeps search keystrokes on `history: "replace"`.
  Lines 11-16 omit history options for discrete category, language, star, and sort state.
- `src/lib/agent-skills/query-state.ts:15-23` repeats that shape for category, readiness, package, and
  sort state.
- Installed nuqs defaults to replace. `node_modules/nuqs/README.md:416-424` documents `history:
  "push"` for back-button history.
- `e2e/projects.spec.ts:22-48` does not prove Back remains on `/projects`.
- `e2e/agent-skills.spec.ts` covers a package filter but not its history semantics.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Query-state tests | `pnpm exec vitest run src/__tests__/lib/projects src/__tests__/lib/agent-skills` | exit 0, or report if those paths do not exist |
| Browser regression | `pnpm exec playwright test e2e/projects.spec.ts e2e/agent-skills.spec.ts` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:

- `src/lib/projects/query-state.ts`
- `src/lib/agent-skills/query-state.ts`
- `e2e/projects.spec.ts`
- `e2e/agent-skills.spec.ts`
- Existing query-state unit tests, if present

**Out of scope**:

- Query key renames or URL migrations
- Debouncing or changing search behavior
- Catalog visual changes

## Steps

### Step 1: Give discrete controls push semantics

Keep both `q` parsers on `history: "replace"`. Add `history: "push"` alongside `scroll: false` to
every non-search parser in both query-state files. Do not change defaults, query keys, or types.

**Verify**: `pnpm type-check` exits 0.

### Step 2: Make Projects history coverage unambiguous

After the search URL assertion, clear the search and assert the URL is exactly the Projects route.
Select RAG, assert the pathname remains `/projects` and the category is RAG, then:

1. Go Back and assert the pathname is still `/projects`, `category` is absent, and the category
   trigger reads All categories.
2. Go Forward and assert the pathname is still `/projects`, `category=RAG`, and the trigger reads
   RAG.

The test must fail against commit `151e9b6`; do not retain a regex that could accept another route.

**Verify**: `pnpm exec playwright test e2e/projects.spec.ts` exits 0.

### Step 3: Cover Agent Skills history

Extend `e2e/agent-skills.spec.ts` around the existing Packaged selection. Assert Back remains on
`/agent-skills` and restores All packages, then Forward restores `packageState=packaged` and the
Packaged selection before continuing the existing copy/detail flow.

**Verify**: run both browser specs; both pass.

## Done criteria

- [ ] Search keystrokes still replace history.
- [ ] Every discrete catalog control pushes history.
- [ ] Back and Forward restore filters without leaving either catalog route.
- [ ] Both browser specs and typecheck pass.

## STOP conditions

- nuqs no longer supports per-parser `history: "push"`.
- A filter update performs a full page navigation rather than shallow URL state.
- The strengthened tests do not fail against the original behavior.

## Maintenance notes

New discrete catalog controls should use push history. Free-form keystroke state should remain replace
history so each character does not pollute the Back stack.
