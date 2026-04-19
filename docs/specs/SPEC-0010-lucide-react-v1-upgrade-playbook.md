---
spec: SPEC-0010
title: Lucide React v1 upgrade playbook
version: 0.1.0
date: 2026-04-19
owners: ["ai-arch"]
status: Proposed
related_requirements: ["FR-001", "NFR-001"]
related_adrs: ["ADR-0005", "ADR-0009"]
notes: "Atomic repo-grounded and reusable playbook for Lucide React v1 adoption in Next.js repositories."
---

## Summary

This specification defines the canonical end state for `lucide-react` upgrades
in this repository and similar Next.js repositories: named imports from
`lucide-react`, no deep icon-path shim, no parallel icon import conventions,
and no extra brand-icon runtime dependency where local SVG ownership is enough.

It is intentionally dual-purpose:

- a local implementation plan for `bjornmelin-platform-io`
- a reusable Codex execution artifact for future Next.js repos

## Context

This repository already declares `lucide-react@1.8.0`, but its integration
shape still reflects an older deep-import model:

- 17 files import `lucide-react/dist/esm/icons/*`
- `AGENTS.md` requires that pattern
- `src/types/lucide-react-icons.d.ts` exists only to patch missing typings for
  the deep path shape
- `@radix-ui/react-icons` remains only for GitHub and LinkedIn footer logos

Current Next.js guidance makes the local convention stale. In Next.js 16,
`lucide-react` is already optimized by default for package imports, so named
imports from `lucide-react` are the cleaner canonical path for App Router repos.

## Goals / Non-goals

### Goals

- Standardize on one Lucide import convention for the entire repo.
- Remove repo-local Lucide compatibility shims and stale policy.
- Remove icon-related dependency surface that Lucide v1 made unnecessary.
- Produce a reusable, execution-ready upgrade guide for other Next.js repos.
- Keep the migration reviewable, auditable, and verification-first.

### Non-goals

- Broad UI dependency modernization beyond the Lucide/icon surface.
- Introducing dynamic runtime icon loading where static imports suffice.
- Adopting Lucide provider/context patterns unless they delete meaningful code.
- Folding the shadcn `radix-ui` package migration into this wave.

## Persona And Operating Goals

### Primary persona

Codex acting as an architect-level modernization engineer.

### Secondary audience

Human maintainers reviewing scope, risks, completion state, and follow-up work.

### Operating goals

- Research before editing.
- Prefer official docs and upstream source over assumption.
- Enforce one canonical implementation path.
- Delete obsolete shims, duplicate conventions, and dead dependencies.
- Keep a concise running ledger of findings, assumptions, and completed work.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-001:** Document dependency versions and compatibility constraints.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static export.

## Constraints

- Static export via `output: "export"` remains mandatory.
- App Router and current Next.js 16 repo conventions must be preserved.
- The migration must not introduce a second icon import convention.
- Decorative icons must preserve accessibility defaults.
- Brand icons removed from Lucide v1 must be handled outside Lucide itself.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.8 | 3.43 |
| Application value | 0.30 | 9.5 | 2.85 |
| Maintenance & cognitive load | 0.25 | 9.6 | 2.40 |
| Architectural adaptability | 0.10 | 9.3 | 0.93 |

**Total:** 9.61 / 10.0

## Final Decisions

- Canonical Lucide import style: `import { IconName } from "lucide-react"`.
- Next.js package-import optimization policy: rely on built-in optimization;
  do not add redundant `experimental.optimizePackageImports` config for Lucide.
- Brand-icon strategy: use local SVG ownership instead of retaining
  `@radix-ui/react-icons` only for footer logos.
- Rollout style: one hard-cut wave, not staged coexistence.
- Scope boundary: Lucide/icon migration only; the shadcn `radix-ui` migration
  remains a separate deferred spec.

## Repo-Specific Findings

### Validated current state

- `package.json` already pins `lucide-react` to `1.8.0`.
- `next.config.mjs` does not explicitly configure `optimizePackageImports`.
- `AGENTS.md` currently requires deep Lucide icon imports.
- `src/types/lucide-react-icons.d.ts` exists solely to support that deep import
  rule.
- `@radix-ui/react-icons` is only used in `src/components/layout/footer.tsx`.

### Upstream Lucide v1 capabilities that matter

- Official exported types: `LucideProps`, `LucideIcon`, `IconNode`
- `DynamicIcon` and `dynamicIconImports` still exist, but are not recommended
  for static UI surfaces
- `LucideProvider` exists for shared icon styling, but is optional
- Accessibility defaults remain strong: decorative icons are hidden by default
- Brand icons are intentionally removed and must be sourced elsewhere

### Hard-cut deletions enabled by the chosen end state

- Deep import convention from `lucide-react/dist/esm/icons/*`
- `src/types/lucide-react-icons.d.ts`
- `@radix-ui/react-icons`
- Any repo docs or guidance that imply deep imports are still preferred

## Design

### Canonical repository end state

- All icon imports come from `lucide-react`.
- Component and data typing use Lucide's official exported types where needed.
- Footer brand marks are local SVG components or assets.
- No local Lucide typings shim remains.
- No second icon-library dependency remains for the footer-only case.

### File-level contract for this repository

- [AGENTS.md](/home/bjorn/repos/bjornmelin-platform-io/AGENTS.md:50):
  update Lucide import policy to match Next.js 16 reality.
- [next.config.mjs](/home/bjorn/repos/bjornmelin-platform-io/next.config.mjs:1):
  leave unchanged unless explicit clarity is later preferred.
- [src/types/lucide-react-icons.d.ts](/home/bjorn/repos/bjornmelin-platform-io/src/types/lucide-react-icons.d.ts:1):
  delete after barrel import migration.
- `src/app/loading.tsx` and `src/components/**`: convert Lucide imports.
- [src/data/skills.ts](/home/bjorn/repos/bjornmelin-platform-io/src/data/skills.ts:1):
  tighten icon typing to `LucideIcon`.
- [src/components/layout/footer.tsx](/home/bjorn/repos/bjornmelin-platform-io/src/components/layout/footer.tsx:1):
  replace Radix brand icons with local SVG ownership.
- [package.json](/home/bjorn/repos/bjornmelin-platform-io/package.json:48):
  remove `@radix-ui/react-icons`.

### What to adopt

- Named exports from `lucide-react`
- `LucideIcon` for icon component fields and props
- Local SVG components for non-Lucid brand marks
- Existing Tailwind-based per-instance icon styling

### What to avoid

- `lucide-react/dist/esm/icons/*`
- `DynamicIcon` for static route and component UI
- `LucideProvider` unless it deletes enough styling glue to earn its cost
- Mixed deep-import and barrel-import conventions in the same repo
- Retaining `@radix-ui/react-icons` solely for a tiny brand-logo footprint

## Cross-Repo Intake Checklist

Use this before applying the playbook in a different repository.

- [ ] Confirm the repo is actually on Next.js or another framework with proven
      package-import optimization behavior.
- [ ] Record current `lucide-react` version and lockfile/package manager.
- [ ] Search for deep Lucide imports, local shims, dynamic icon usage, custom
      icon wrappers, and brand-icon dependencies.
- [ ] Check whether the repo already has an icon abstraction layer that should
      be preserved or deleted.
- [ ] Verify whether brand icons are present and how they are currently sourced.
- [ ] Confirm whether any SSR, RSC, or bundler constraints make named imports
      unsafe in that repo.
- [ ] Build a touched-files map before broad edits.

## Migration Checklist

### Preparation

- [ ] Inventory all `lucide-react` imports.
- [ ] Inventory all non-Lucid icon dependencies.
- [ ] Verify current Next.js guidance and upstream Lucide docs.

### Code changes

- [ ] Convert every deep icon import to a named `lucide-react` import.
- [ ] Replace generic icon types with `LucideIcon` where useful.
- [ ] Delete `src/types/lucide-react-icons.d.ts`.
- [ ] Replace brand-logo dependency usage with local SVG ownership.
- [ ] Remove `@radix-ui/react-icons` from manifests and lockfiles.

### Documentation and policy

- [ ] Update `AGENTS.md` Lucide guidance.
- [ ] Update any local docs that mention old import rules.
- [ ] Record deferred adjacent work separately rather than widening this wave.

### Verification

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm audit --json`
- [ ] `bun audit`
- [ ] Verify removed dependencies are no longer referenced via `rg`

## Success Criteria

- Every Lucide import in the repo uses `from "lucide-react"`.
- No file imports `lucide-react/dist/esm/icons/*`.
- The Lucide shim file is deleted.
- `@radix-ui/react-icons` is removed if it was only covering brand marks.
- Policy docs no longer instruct stale deep-import behavior.
- Lint, typecheck, test, build, and audit remain green.
- The migration leaves fewer concepts and fewer icon-related dependencies than
  before.

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
- [ ] Imports migrated
- [ ] Brand icons localized
- [ ] Shims deleted
- [ ] Policy/docs updated
- [ ] Verification completed

## Verification Matrix

### Repository-native commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm audit --json
bun audit
rg -n 'lucide-react/dist/esm/icons/|@radix-ui/react-icons' src package.json pnpm-lock.yaml
```

### Cross-repo baseline checks

Adapt the commands to the target package manager and repo shape.

```bash
# inventory
rg -n 'lucide-react|react-icons|@radix-ui/react-icons|dist/esm/icons' .

# outdated and audit
pnpm outdated --format json || npm outdated --json || bun outdated
pnpm audit --json || npm audit --json || bun audit

# prove the old import shape is gone
rg -n 'lucide-react/dist/esm/icons/' .
```

## Failure Modes And Mitigation

- Deep-path imports remain after partial refactor →
  run a repo-wide grep and finish the hard cut.
- Brand icons disappear during dependency removal →
  land local SVG replacements before deleting the dependency.
- A repo depends on runtime icon names from data →
  isolate that boundary and decide explicitly whether `DynamicIcon` is justified.
- Another repo already uses a central icon wrapper →
  verify whether it still earns its keep before deleting it.

## Key Files

- `package.json`
- `pnpm-lock.yaml`
- `next.config.mjs`
- `AGENTS.md`
- `src/types/lucide-react-icons.d.ts`
- `src/components/layout/footer.tsx`
- `src/data/skills.ts`
- `src/components/**`

## References

- [Lucide React guide](https://lucide.dev/guide/react)
- [Lucide React migration to v1](https://lucide.dev/guide/react/migration)
- [Lucide React TypeScript types](https://lucide.dev/guide/react/advanced/typescript)
- [Lucide accessibility guidance](https://lucide.dev/guide/react/advanced/accessibility)
- [Lucide dynamic icon guidance](https://lucide.dev/guide/react/advanced/dynamic-icon-component)
- [Lucide custom icons / Lucide Lab](https://lucide.dev/guide/react/advanced/with-lucide-lab)
- [Lucide aliased names](https://lucide.dev/guide/react/advanced/aliased-names)
- [Next.js optimizePackageImports](https://nextjs.org/docs/pages/api-reference/config/next-config-js/optimizePackageImports)
- [Lucide upstream repository](https://github.com/lucide-icons/lucide)
- [Lucide releases](https://github.com/lucide-icons/lucide/releases)

## Copy-Paste Codex Kickoff Prompt

Use this in a fresh Codex session for another repo.

```text
Act as an architect-level modernization engineer performing a verification-first
Lucide React v1 migration in a Next.js repository.

Persona and goals:
- Prefer primary-source evidence over assumption.
- Use hard-cut cleanup: one canonical icon import path, no compatibility shims.
- Delete obsolete local Lucide deep-import helpers, dead policy, and unnecessary
  icon dependencies.
- Keep the diff reviewable and the final state simpler than the initial state.

Required research and tools:
- Inspect manifests, lockfiles, Next config, AGENTS/docs, and icon usage first.
- Verify current Lucide and Next.js guidance before editing.
- Use upstream docs, source, and repo-native commands.
- Build a touched-files map before broad edits.

Required migration outcomes:
- Standardize on `import { IconName } from "lucide-react"`.
- Remove deep imports from `lucide-react/dist/esm/icons/*`.
- Remove any Lucide deep-import typings shim if no longer needed.
- Audit brand icon handling and replace tiny one-off icon dependencies with
  local SVG ownership when justified.
- Avoid `DynamicIcon` unless icon names come from runtime data.

Required deliverables:
- findings matrix
- affected-files map
- migration checklist
- exact verification commands
- residual risks or explicit defer reasons

Verification expectation:
- run repo-native lint, typecheck, tests, build, and audit commands
- prove removed dependencies and old import paths are gone with grep
```

## Changelog

- **0.1 (2026-04-19)**: Initial Lucide React v1 upgrade playbook and reusable
  Codex execution artifact.
