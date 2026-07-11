---
spec: SPEC-0001
title: Dependency upgrades
version: 1.7.0
date: 2026-07-10
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-001", "NFR-001"]
related_adrs: ["ADR-0002", "ADR-0003", "ADR-0004", "ADR-0005", "ADR-0009"]
notes: "Tracks dependency versions and upgrade rationale for the current release."
---

## Summary

This specification documents the current dependency baseline and compatibility
constraints following the recent upgrade pass.

## Context

This baseline reflects the latest completed upgrade cycle and the constraints
required to keep the static export pipeline stable.

## Goals / Non-goals

### Goals

- Document the core dependency baseline used by the repo.
- Preserve compatibility with the Next.js App Router static export.
- Reduce operational surface area by removing unused dependencies.

### Non-goals

- Defining future upgrade timelines or release policies.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-001:** Document dependency versions and compatibility constraints.

### Non-functional requirements

- **NFR-001:** Maintain compatibility with Next.js 16 and React 19 static export.

## Constraints

- Next.js remains on 16.2.x
- React remains on 19.2.x
- Node.js engine remains `>=24 <25` (validated in CI for this repository)
- Static export (`output: "export"`) remains required

## Design

### Version baseline (pinned)

- Next.js 16.2.10
- React 19.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.2
- @tailwindcss/postcss 4.3.2
- pnpm 10.28.0 (Corepack)
- Zod 4.4.3
- Vitest 4.1.10
- Vite 8.1.3
- Playwright 1.61.1
- Biome 2.5.2
- Base UI React 1.6.0

*Note: `pnpm-lock.yaml` is the source of truth for reproducible installs. This
spec lists the intentional baseline versions for the core toolchain.*

### Reproducibility note

The lockfile is the source of truth for reproducible installs. Core runtime
dependencies are pinned, while many non-core dependencies use ranges and are
resolved via `pnpm-lock.yaml`.

Root and infrastructure `.npmrc` supply-chain hardening enforces a 24-hour
minimum release age and trust downgrade protection for pnpm resolution in both
install contexts.

Dependabot npm version-update PRs for root and infrastructure dependencies use
a matching 1-day cooldown before proposing newly released package versions.
Dependabot also checks GitHub Actions weekly and groups action updates by
major versus non-major upgrade risk; workflow YAML files own exact action pins.
The shared Node/pnpm setup action asserts both root and infrastructure pnpm
hardening settings before any workflow install runs, including workflows that
defer installation to a package subdirectory.

The 24-hour release-age policy is intentional for this release. It replaces the
earlier 7-day candidate gate so current dependency upgrades can land after a
short quarantine period while `trust-policy=no-downgrade`, frozen lockfiles,
reviewed lockfile diffs, and CI audits remain enforced.

Dependency Review blocks GPL-3.0 and AGPL-3.0 licenses. LGPL-3.0 is not denied
for this release so native optional dependencies such as `sharp` libvips
packages can be upgraded through the standard dependency-review workflow.

Targeted `pnpm.overrides` entries are retained for the current baseline to
force patched transitive versions where upstream release lines have not yet
fully absorbed the security fixes. The baseline remains audit-clean with these
overrides applied.

The root test environment currently overrides `jsdom > undici` to `7.28.0`
because `jsdom@29.1.1` still permits a vulnerable Undici 7.x resolution. The
root Next.js chain also pins `next > postcss` to the direct PostCSS patch level.
Infrastructure declares `vite@8.1.3` directly so Vitest resolves a patched Vite
peer without a second override owner.

The July 8 refresh uses the newest release-age eligible package versions. Newer
same-day AWS SDK releases remain outside this baseline until the 24-hour pnpm
minimum release age admits them.

The July 2026 advisory cleanup is source-backed by GitHub advisories for
Undici, `markdown-it`, `linkify-it`, `js-yaml`, and Vite. `markdownlint-cli`
now resolves `markdown-it@14.2.0`, which pulls patched `linkify-it@5.0.1`.
`@commitlint/*` now resolves the `cosmiconfig` YAML loader path to
`js-yaml@4.3.0`, above the advisory's patched floor.

### Rationale

Upgrades prioritize security fixes, compatibility with the Next.js 16.2.x App Router,
and improved DX while preserving static export constraints.

This baseline also removes unused dependencies to reduce the operational surface area (example:
`framer-motion` was removed after it was no longer referenced in app code).
The current baseline uses shadcn `base-nova` components backed by
`@base-ui/react`. The former `radix-ui`, `tailwindcss-animate`, and redundant
`next-themes` dependencies are removed rather than retained as compatibility
paths; Base transition attributes cover the current motion needs without
another animation package, and `ThemeScript` owns theme state.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.0 | 3.15 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.03 / 10.0

## Acceptance criteria

- `package.json` and `pnpm-lock.yaml` reflect the intended core dependency baseline.
- Static export remains compatible with the pinned toolchain.

## Testing

- Dependency upgrades MUST pass frozen installs for both graphs:
  `pnpm install --frozen-lockfile` and `pnpm -C infrastructure install --frozen-lockfile`.
- Dependency upgrades MUST pass audits for both graphs:
  `pnpm audit --audit-level moderate` and `pnpm -C infrastructure audit --audit-level moderate`.
- Dependency upgrades MUST preserve the Node type boundary with `pnpm deps:check-node-types`.
- Runtime/toolchain upgrades MUST pass app validation with `pnpm lint`, `pnpm type-check`,
  `pnpm test:coverage`, `pnpm build`, and `pnpm test:e2e`.
- Infrastructure dependency upgrades MUST pass `pnpm -C infrastructure build` and
  `pnpm -C infrastructure test`.

## Operational notes

- Follow the standard upgrade workflow and re-run `pnpm install` before `pnpm build`.
- Keep `@types/node` on the latest `24.x` release while the repository engine
  remains `>=24 <25`; `25.x` is intentionally left out of scope until the Node
  engine policy changes.
- `pnpm deps:check-node-types` enforces that the root and infrastructure
  manifests keep `@types/node` range-bound to the Node major pinned in `.nvmrc`;
  Dependabot ignores `@types/node` `25.x` while the repo stays on Node 24.

## Failure modes and mitigation

- Dependency drift → Re-run `pnpm install` and validate lockfile changes in CI.

## Key files

- `package.json`
- `pnpm-lock.yaml`
- `.npmrc` and `infrastructure/.npmrc`
- `.github/dependabot.yml`
- `.github/actions/setup-node-pnpm/action.yml`
- `.github/workflows/security-audit.yml`

## References

- `package.json` for the authoritative versions
- `AGENTS.md` and `docs/development/README.md` for toolchain guidance
- [Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js releases](https://github.com/vercel/next.js/releases)
- [Vitest 4.1 release notes](https://vitest.dev/blog/vitest-4-1.html)
- [Vite releases and supported versions](https://vite.dev/releases)
- [GHSA-vmh5-mc38-953g: Undici SOCKS5 requestTls bypass](https://github.com/advisories/GHSA-vmh5-mc38-953g)
- [GHSA-vxpw-j846-p89q: Undici WebSocket fragment DoS](https://github.com/advisories/GHSA-vxpw-j846-p89q)
- [GHSA-pr7r-676h-xcf6: Undici shared cache disclosure](https://github.com/advisories/GHSA-pr7r-676h-xcf6)
- [GHSA-6v5v-wf23-fmfq: markdown-it quadratic complexity DoS](https://github.com/advisories/GHSA-6v5v-wf23-fmfq)
- [GHSA-22p9-wv53-3rq4: linkify-it quadratic complexity DoS](https://github.com/advisories/GHSA-22p9-wv53-3rq4)
- [GHSA-h67p-54hq-rp68: js-yaml quadratic complexity DoS](https://github.com/advisories/GHSA-h67p-54hq-rp68)
- [GHSA-fx2h-pf6j-xcff: Vite server.fs.deny bypass](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- [Zod v4 migration guide](https://zod.dev/v4/changelog) / ADR-0002 (Zod v4 strategy)
- [Vitest v4 migration notes](https://vitest.dev/guide/migration) / ADR-0003 (testing changes)
- ADR-0004 (toolchain changes) / ADR-0005 (static export constraints)

## Changelog

- **1.7 (2026-07-10)**: Replaced the unified Radix dependency with Base UI
  React 1.6.0 and removed both the unused animation dependency and obsolete
  Tailwind config stub.
- **1.6 (2026-07-08)**: Dependency refresh for Vite 8.1.3, Vitest
  4.1.10, `radix-ui` 1.6.2, AWS SDK 3.1080.0, CDK lib 2.261.0,
  React Hook Form 7.81.0, Resend 6.17.1, and tsx 4.23.0 while keeping
  Node 24 and static export constraints intact. Static export serving uses
  `scripts/serve-static-export.mjs` with pinned `serve@14.2.6` and
  `NO_UPDATE_CHECK=1`, avoiding dynamic `npx` or `pnpm dlx` resolution.
- **1.5 (2026-07-02)**: Dependency modernization for the Next.js 16.2.10,
  Vite 8.1.2, Vitest 4.1.9, Playwright 1.61.1, Tailwind CSS 4.3.2, Biome
  2.5.2, `radix-ui` 1.6.1, AWS SDK, CDK, Resend, Lucide, React Hook Form,
  commitlint, markdownlint, Sharp, and locked static-export `serve` baseline;
  resolved live development-tooling advisories for `undici`, markdownlint's
  `markdown-it`/`linkify-it` chain, commitlint's `js-yaml` path, and
  infrastructure Vite while keeping Node 24 and static export constraints
  intact.
- **1.4 (2026-06-15)**: Dependency modernization for the current Next.js,
  React, Tailwind CSS, Biome, `radix-ui`, AWS SDK, and CDK baseline; pnpm
  hardening via a 24-hour minimum release age and trust downgrade protection;
  Dependabot 1-day cooldown; dependency-review GPL/AGPL enforcement; and AWS
  Lambda runtime upgrades to Node.js 24.
- **1.3 (2026-06-01)**: Dependency modernization for AWS SDK, Resend, Lucide,
  React Hook Form, Commander, Vite, Vitest, Biome, and shadcn `radix-ui`
  unification while preserving the Node 24 runtime contract.
- **1.2 (2026-04-18)**: Security and toolchain refresh for Next.js 16.2.4, TypeScript 6, Vite 8,
  and audited transitive overrides.
- **1.1 (2026-01-18)**: Current baseline and constraints.
