---
spec: SPEC-0011
title: shadcn radix-ui unification playbook
version: 0.2.0
date: 2026-04-19
owners: ["ai-arch"]
status: Proposed
related_requirements: ["NFR-001"]
related_adrs: ["ADR-0005", "ADR-0009"]
notes: "Atomic repo-grounded and reusable playbook for migrating shadcn new-york projects from individual Radix packages to the unified radix-ui package."
---

## Summary

This specification defines the canonical end state for shadcn `new-york`
projects that still depend on many individual `@radix-ui/react-*` packages:
one unified `radix-ui` dependency, one import convention for local
shadcn-owned primitives, no mixed primitive-package ownership, and no stale
docs that still describe the pre-unification shape.

It is intentionally dual-purpose:

- a local implementation plan for `bjornmelin-platform-io`
- a reusable Codex execution artifact for future shadcn `new-york` repos

## Context

This repository currently matches the official migration preconditions closely:

- `components.json` is `style: "new-york"`
- `pnpm dlx shadcn@latest info --json` reports `base: "radix"`
- local shadcn-owned primitives live in `src/components/ui/*`
- 13 local component files still import individual `@radix-ui/react-*`
  packages
- `package.json` does not yet include `radix-ui`
- footer brand icons were already localized during `SPEC-0010`, but the shadcn
  `radix` migration still intentionally does not rewrite
  `@radix-ui/react-icons` in other repos

Current official shadcn guidance makes the local primitive-import convention
stale. As of the February 2026 `new-york` update, shadcn now uses the unified
`radix-ui` package by default and ships an official `migrate radix` command to
rewrite local component imports accordingly.

## Goals / Non-goals

### Goals

- Standardize on one Radix primitive import convention for the repo's
  shadcn-owned UI components.
- Reduce manifest surface area and version-management churn across Radix
  primitives.
- Align local `src/components/ui/*` files with current upstream shadcn
  `new-york` patterns.
- Produce a reusable, execution-ready upgrade guide for other Next.js repos
  using shadcn `new-york`.
- Keep the migration reviewable, auditable, and verification-first.

### Non-goals

- Switching this repo from Radix to Base UI.
- Rebuilding the visual design system or changing component look and feel.
- Folding this migration into the Lucide hard-cut wave.
- Treating `@radix-ui/react-icons` as part of the primitive-unification
  migration.
- Broad UI dependency churn outside the current shadcn primitive surface.

## Persona And Operating Goals

### Primary persona

Codex acting as an architect-level modernization engineer for shadcn,
Next.js, and local component-source ownership.

### Secondary audience

Human maintainers reviewing scope, risks, completion state, and follow-up work.

### Operating goals

- Research before editing.
- Prefer official docs, CLI behavior, and upstream source over assumption.
- Use the shadcn migration path where it helps, then hard-cut the remaining
  cleanup explicitly.
- Keep one canonical primitive-import model across local shadcn-owned files.
- Keep a concise running ledger of findings, assumptions, and completed work.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static
  export.

## Constraints

- Static export via `output: "export"` remains mandatory.
- App Router, Next.js 16, and React 19 repo conventions must be preserved.
- `components.json` remains the source of truth for shadcn style and base.
- The migration must not leave a mixed `radix-ui` plus
  `@radix-ui/react-*` primitive-import surface in local shadcn-owned files.
- This wave must not quietly switch the repo to Base UI or another primitive
  layer.
- Footer brand icons are adjacent but separate from the primitive-unification
  contract because the official shadcn migrator skips `@radix-ui/react-icons`.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.6 | 3.36 |
| Application value | 0.30 | 9.2 | 2.76 |
| Maintenance & cognitive load | 0.25 | 9.4 | 2.35 |
| Architectural adaptability | 0.10 | 9.1 | 0.91 |

**Total:** 9.38 / 10.0

## Final Decisions

- Canonical primitive import style for local shadcn-owned components:
  `import { Dialog as DialogPrimitive } from "radix-ui"` and equivalent named
  imports.
- Migration engine: use `pnpm dlx shadcn@latest migrate radix` as the initial
  import rewrite path, then review and complete the cleanup manually.
- Cleanup policy: remove obsolete individual `@radix-ui/react-*` packages only
  after code and grep prove they are unused.
- Rollout style: one hard-cut wave when this migration is executed, not staged
  coexistence.
- Scope boundary: stay on shadcn `new-york` + Radix; do not combine this wave
  with a Base UI conversion.
- Artifact shape: this spec is both a repo-local implementation plan and a
  reusable cross-repo playbook.

## Repo-Specific Findings

### Validated current state

- `components.json` declares `style: "new-york"` and `iconLibrary: "lucide"`.
- `pnpm dlx shadcn@latest info --json` reports:
  - `framework: Next.js`
  - `frameworkVersion: 16.2.4`
  - `base: radix`
  - `tailwindVersion: v4`
  - `resolvedPaths.ui: src/components/ui`
- `package.json` currently depends on 13 individual Radix primitive packages:
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`
- `package.json` does not yet include `radix-ui`.
- Current direct primitive-import sites are:
  - `src/components/ui/button.tsx`
  - `src/components/ui/collapsible.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/navigation-menu.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/toast.tsx`
  - `src/components/ui/toggle.tsx`
  - `src/components/ui/toggle-group.tsx`
- `@radix-ui/react-icons` is no longer in this repo after `SPEC-0010`, but the
  upstream shadcn migrator still skips that package generically.

### Upstream shadcn and Radix capabilities that matter

- shadcn officially documents `pnpm dlx shadcn@latest migrate radix`.
- The official migration rewrites imports from `@radix-ui/react-*` to
  `radix-ui`.
- The official migration adds `radix-ui` to `package.json` if missing.
- The official migration does not remove old `@radix-ui/react-*` packages for
  you; it only reports that they may be removable after review.
- The migration implementation explicitly skips `@radix-ui/react-icons`.
- The migration implementation includes special handling for `Slot` import
  rewrites.
- Radix officially recommends the unified `radix-ui` package as the simplest
  installation path and documents it as tree-shakeable.

### Hard-cut deletions enabled by the chosen end state

- Individual primitive imports from `@radix-ui/react-*` within local
  shadcn-owned files
- Redundant primitive package entries in `package.json`
- Mixed import-style expectations in docs or repo guidance
- Any local assumptions that `new-york` still prefers one-package-per-primitive

## Design

### Canonical repository end state

- Local shadcn-owned primitives import from `radix-ui`.
- `package.json` carries one `radix-ui` dependency instead of many individual
  primitive packages, except for any still-proven outliers.
- `components.json` remains `style: "new-york"` and `base: "radix"`.
- Local component APIs and behavior remain stable.
- The migration does not pretend `@radix-ui/react-icons` was unified if that
  package is still intentionally handled elsewhere.

### File-level contract for this repository

- [components.json](/home/bjorn/repos/bjornmelin-platform-io/components.json:1):
  preserve `style: "new-york"` and use it as the migration eligibility signal.
- [package.json](/home/bjorn/repos/bjornmelin-platform-io/package.json:1):
  add `radix-ui`, then remove obsolete individual primitive packages after
  verification.
- `pnpm-lock.yaml`: update only as a consequence of the dependency cleanup.
- `src/components/ui/button.tsx`: migrate `Slot` import shape carefully and
  recheck `asChild` typing.
- `src/components/ui/dialog.tsx` and
  [src/components/ui/sheet.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/sheet.tsx:1):
  verify shared `Dialog` primitive behavior remains intact.
- `src/components/ui/dropdown-menu.tsx`,
  [src/components/ui/select.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/select.tsx:1),
  [src/components/ui/navigation-menu.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/navigation-menu.tsx:1),
  [src/components/ui/popover.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/popover.tsx:1),
  [src/components/ui/toast.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/toast.tsx:1),
  [src/components/ui/toggle.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/toggle.tsx:1),
  and
  [src/components/ui/toggle-group.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/ui/toggle-group.tsx:1):
  migrate imports and recheck keyboard/focus behavior.
- [src/components/layout/footer.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/layout/footer.tsx:1):
  treat `@radix-ui/react-icons` as adjacent follow-on or leave it explicitly
  out of scope for this migration wave.

### What to adopt

- `pnpm dlx shadcn@latest migrate radix` as the first migration step
- Named imports from `radix-ui`
- Manual post-migration grep and manifest cleanup
- Existing local shadcn component ownership under `src/components/ui/*`
- Focused verification on dialog, sheet, dropdown, select, toast, popover,
  navigation menu, toggle, and toggle group behavior

### What to avoid

- A partial mixed state where some local primitives use `radix-ui` and others
  still use `@radix-ui/react-*`
- Treating Base UI as an implicit extension of this migration
- Assuming the CLI removes old packages automatically
- Assuming `@radix-ui/react-icons` will be migrated by the CLI
- Widening the change into unrelated design-system refactors

## Cross-Repo Intake Checklist

Use this before applying the playbook in a different repository.

- [ ] Confirm the repo actually uses shadcn `new-york` with the Radix base.
- [ ] Run `pnpm dlx shadcn@latest info --json` or the equivalent package-manager
      command and record framework, base, style, resolved paths, and installed
      components.
- [ ] Search for `@radix-ui/react-*`, `radix-ui`, and
      `@radix-ui/react-icons` usage across the repo.
- [ ] Check whether local shadcn component source is owned in-repo or still
      heavily regenerated from upstream.
- [ ] Verify whether any non-UI files import Radix primitives directly.
- [ ] Confirm whether a Base UI migration is being considered separately and
      keep that decision explicit.
- [ ] Build a touched-files map before broad edits.

## Migration Checklist

### Preparation

- [ ] Capture `shadcn info --json` output for the repo.
- [ ] Inventory all `@radix-ui/react-*`, `radix-ui`, and
      `@radix-ui/react-icons` imports.
- [ ] Verify current shadcn CLI and changelog guidance.
- [ ] Verify current Radix installation guidance.

### Code changes

- [ ] Run `pnpm dlx shadcn@latest migrate radix`.
- [ ] Review the diff component-by-component instead of trusting the rewrite
      blindly.
- [ ] Fix any import edge cases or local style deviations the migration did not
      cover cleanly.
- [ ] Add `radix-ui` if it is still missing.
- [ ] Remove obsolete individual `@radix-ui/react-*` packages from manifests
      only after code and grep prove they are unused.

### Documentation and policy

- [ ] Update any repo docs or guidance that still describe the old primitive
      import shape.
- [ ] Record explicitly whether `@radix-ui/react-icons` remains deferred or was
      handled in another wave.
- [ ] Keep Base UI conversion, if desired later, as a separate spec and change
      wave.

### Verification

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `rg -n 'from "@radix-ui/react-|from "radix-ui"' src/components/ui`
- [ ] Verify removed dependencies are no longer referenced via `rg`

## Success Criteria

- Every targeted local shadcn-owned primitive import uses `radix-ui`.
- No obsolete `@radix-ui/react-*` primitive packages remain in the manifest.
- `components.json` still reflects the intended `new-york` + Radix setup.
- UI behavior remains stable for dialog, sheet, dropdown, select, popover,
  navigation menu, toast, toggle, and toggle group flows.
- Lint, typecheck, tests, and build remain green.
- The migration leaves fewer dependency entries and fewer primitive import
  conventions than before.

## Embedded Execution Tracker

Use this section as the live state block during implementation.

### Status ledger

- Overall status: `Not started | In progress | Blocked | Completed`
- Branch / PR:
- Owner:
- Started:
- Last updated:

### Repo notes

- Findings:
  - None yet.
- Assumptions:
  - None yet.
- Risks / blockers:
  - None yet.
- Deferred items:
  - None yet.

### Checkoff ledger

- [ ] Discovery completed
- [ ] Decisions locked
- [ ] CLI migration run
- [ ] Manual cleanup completed
- [ ] Old packages removed
- [ ] Policy/docs updated
- [ ] Verification completed

## Verification Matrix

### Repository-native commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
rg -n 'from "@radix-ui/react-|from "radix-ui"' src/components/ui src/components/layout package.json
```

### Cross-repo baseline checks

Adapt the commands to the target package manager and repo shape.

```bash
# inventory
rg -n '@radix-ui/react-|radix-ui|@radix-ui/react-icons' .

# inspect project config
pnpm dlx shadcn@latest info --json || npx shadcn@latest info --json

# run official migration help
pnpm dlx shadcn@latest migrate --list
pnpm dlx shadcn@latest migrate radix --help

# prove old primitive imports are gone
rg -n 'from "@radix-ui/react-' .
```

## Failure Modes And Mitigation

- CLI migration leaves behind edge-case imports or formatting drift →
  review the diff file-by-file before cleanup.
- Old packages are removed too early →
  grep first, then delete manifest entries only after zero references remain.
- `Slot`-based components regress under `asChild` →
  recheck button and related typing after the automated rewrite.
- `@radix-ui/react-icons` is mistaken for a migrated primitive →
  keep it explicitly separate in both grep and cleanup steps.
- A different repo is already on Base UI or not on `new-york` →
  stop and build a different plan instead of forcing this playbook.

## Key Files

- `components.json`
- `package.json`
- `pnpm-lock.yaml`
- `src/components/ui/*`
- `src/components/layout/footer.tsx`

## References

- [shadcn CLI docs](https://ui.shadcn.com/docs/cli)
- [shadcn February 2026 unified radix-ui changelog](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui)
- [shadcn skills docs](https://ui.shadcn.com/docs/skills)
- [Radix Primitives introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Radix Primitives getting started](https://www.radix-ui.com/primitives/docs/overview/getting-started)
- [shadcn dialog docs](https://ui.shadcn.com/docs/components/radix/dialog)

## Copy-Paste Codex Kickoff Prompt

Use this in a fresh Codex session for another repo.

```text
Act as an architect-level modernization engineer performing a verification-first
shadcn Radix unification migration in a Next.js repository.

Persona and goals:
- Prefer primary-source evidence over assumption.
- Use hard-cut cleanup: one canonical primitive import path, no mixed Radix
  package ownership in local shadcn-owned components.
- Use the official shadcn CLI migration where it helps, but do not over-credit
  it: manually review the diff and remove obsolete packages only after proof.
- Keep the diff reviewable and the final state simpler than the initial state.

Required research and tools:
- Inspect `components.json`, `package.json`, lockfile, `src/components/ui/*`,
  and repo docs first.
- Run `shadcn info --json` and record framework, style, base, resolved paths,
  and installed components.
- Verify current shadcn CLI/changelog guidance and Radix installation guidance
  before editing.
- Build a touched-files map before broad edits.

Required migration outcomes:
- Standardize local shadcn-owned primitive imports on `radix-ui`.
- Use `shadcn migrate radix` as the starting rewrite step where applicable.
- Remove obsolete `@radix-ui/react-*` packages only after grep proves they are
  unused.
- Keep Base UI migration out of scope unless explicitly requested.
- Treat `@radix-ui/react-icons` as a separate explicit decision because the
  official migration skips it.

Required deliverables:
- findings matrix
- affected-files map
- migration checklist
- exact verification commands
- residual risks or explicit defer reasons

Verification expectation:
- run repo-native lint, typecheck, tests, and build commands
- prove old primitive import paths are gone with grep
- verify shared overlay/focus components still behave correctly after rewrite
```

## Changelog

- **0.2 (2026-04-19)**: Expanded into a full dual-purpose shadcn Radix
  unification playbook with reusable kickoff prompt and execution tracker.
- **0.1 (2026-04-19)**: Initial deferred but execution-ready `radix-ui`
  unification follow-on spec.
