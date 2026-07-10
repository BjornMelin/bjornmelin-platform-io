---
spec: SPEC-0012
title: shadcn Base UI hard cut
version: 1.0.0
date: 2026-07-10
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-101", "FR-201", "NFR-001", "NFR-101", "NFR-201"]
related_adrs: ["ADR-0005", "ADR-0009"]
notes: "Defines the canonical Base UI component, dependency, and verification contracts."
---

## Summary

The local shadcn layer uses `base-nova` components backed by Base UI React
1.6.0. Radix, `asChild`, the custom toast store, dead primitives, the redundant
theme context, and the Tailwind config compatibility stub are removed as a
hard cut.

## Context

The prior component layer used the unified `radix-ui` package and a legacy
shadcn `new-york` configuration. Base UI has different composition, state
attributes, popup positioning, select item metadata, and toast ownership
contracts, so a package-only swap would not preserve behavior.

## Goals / Non-goals

### Goals

- Keep one Base UI primitive system behind local shadcn wrappers.
- Preserve semantic HTML, keyboard behavior, focus restoration, styling, and
  static export compatibility.
- Delete unused primitives and the parallel toast state implementation.

### Non-goals

- Retain Radix compatibility adapters or dual component APIs.
- Add server-runtime features to the static Next.js application.

## Requirements

### Functional requirements

- **FR-101:** Vitest covers migrated wrapper and consumer behavior.
- **FR-201:** Playwright covers overlays, menus, selects, popovers, toasts, and
  the Agent Skills catalog flow.

### Non-functional requirements

- **NFR-001:** The migration preserves Next.js static export compatibility.
- **NFR-101:** Tests account for Base UI's interaction guards without adding
  production timing workarounds.
- **NFR-201:** Browser tests use stable roles and explicit focus assertions.

## Constraints

- `components.json` stays on `base-nova` with `base: "base"` as reported by
  `shadcn info`.
- Base imports use direct `@base-ui/react/<component>` paths.
- Semantic links use `buttonVariants`; Base Button is not used to render an
  anchor.
- `asChild`, Radix state attributes, and Radix CSS variables are prohibited.

## Decision Framework Score (must be >= 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.5 | 3.33 |
| Application value | 0.30 | 9.4 | 2.82 |
| Maintenance & cognitive load | 0.25 | 9.6 | 2.40 |
| Architectural adaptability | 0.10 | 9.2 | 0.92 |

**Total:** 9.47 / 10.0

## Design

### Architecture overview

- `src/components/ui/*` owns Base UI imports and site styling.
- Production consumers use the local wrappers and Base `render` composition.
- Select roots receive an `items` collection so selected labels are stable.
- Toasts use one Base provider and manager; `Toaster` renders manager-owned
  toast records.
- `ThemeScript` is the only theme owner and persists light, dark, or system
  without a parallel client provider.
- The relative body and isolated app shell keep portalled content above page
  content without a z-index compatibility layer.

### File-level contracts

- `components.json`: `style` is `base-nova`; Tailwind config is empty.
- `src/app/globals.css`: owns the complete Tailwind v4 configuration.
- `src/components/ui/*`: no Radix imports or compatibility props.
- `.migration/*`: records component-level migration decisions and manual QA.

### Configuration

- Runtime dependency: `@base-ui/react@1.6.0`.
- Removed dependencies: `radix-ui`, `tailwindcss-animate`, and `next-themes`;
  no replacement animation package is needed for Base transition attributes.
- Removed config: `tailwind.config.ts` and the Radix package optimizer.

## Acceptance criteria

- Source and manifests contain no Radix imports, `asChild`, or Radix CSS
  variables.
- shadcn reports `style: "base-nova"` and `base: "base"`.
- Type-check, lint, unit tests, coverage, build, Playwright, and static-export
  browser checks pass.
- Menus, sheets, selects, popovers, and toasts retain keyboard and focus
  behavior.

## Testing

- Unit tests: `src/__tests__/components/ui-primitives-smoke.test.tsx` and
  migrated consumer tests.
- Integration tests: contact form toast manager and provider composition.
- E2E tests: `e2e/navigation.spec.ts`, `e2e/projects.spec.ts`,
  `e2e/contact.spec.ts`, and `e2e/agent-skills.spec.ts`.

## Operational notes

- Run `pnpm build` before serving `out/` so CSP hashes and static artifacts
  stay synchronized.
- Add future shadcn components with the repository's `base-nova`
  configuration and review generated consumer composition before committing.

## Failure modes and mitigation

- Radix is reintroduced by copied code: fail the source sweep and dependency
  review.
- A Base trigger loses semantics: use `render` with the intended element and
  verify its accessible role.
- Select labels disappear: provide the typed `items` collection to the root.
- Toasts render outside a provider: keep the provider in `src/app/providers.tsx`.

## Key files

- `components.json`
- `package.json`
- `src/components/ui/`
- `src/app/providers.tsx`
- `src/app/globals.css`
- `.migration/`

## References

- [Base UI quick start](https://base-ui.com/react/overview/quick-start)
- [Base UI Toast](https://base-ui.com/react/components/toast)
- [shadcn Base UI Button](https://ui.shadcn.com/docs/components/base/button)
- [shadcn components.json](https://ui.shadcn.com/docs/components-json)

## Changelog

- **1.0 (2026-07-10)**: Implemented the Radix-to-Base hard cut and recorded
  the canonical component and verification contracts.
