# Repository Guidelines

## Project Structure & Module Organization

- `src/app/` MUST hold Next.js App Router routes (`page.tsx`, `layout.tsx`, `route.ts`).
- `src/components/` MUST hold UI + site sections; shared logic MUST live in `src/lib/` when needed.
- `src/lib/`, `src/hooks/`, `src/types/` MUST hold core logic, hooks, types.
- `src/__tests__/` MUST hold Vitest unit + integration tests (`*.test.ts(x)`).
- `src/test/` + `src/mocks/` MUST hold test setup, helpers, factories, MSW handlers.
- `public/` MUST hold static assets.
- `out/` = generated output; MUST NOT edit manually.
- `infrastructure/` MUST hold AWS CDK app, independent tests, config.
- `scripts/` MUST hold build, deploy, operational utilities.
- `docs/` MUST hold architecture decisions, specifications, runbooks.

## Build, Test, and Development Commands

- `pnpm install`: deps (Node: `.nvmrc`).
- `pnpm dev`: Next.js local `http://localhost:3000`.
- `pnpm build`: prod build; image variants, static `out/`, CSP hashes.
- `pnpm start` / `pnpm serve`: serve static export in `out/`.
- `pnpm lint` + `pnpm format`: Biome lint + format.
- `pnpm type-check`: TypeScript validation.
- `pnpm test` + `pnpm test:coverage`: Vitest unit + integration coverage.
- `pnpm test:e2e`: Playwright in `e2e/`.

Infrastructure:

- `pnpm -C infrastructure install`: infra deps.
- `pnpm -C infrastructure test`: infra Vitest suite.
- `pnpm -C infrastructure deploy:storage` + other `deploy:*`: deploy CDK stacks.

## Coding Style & Naming Conventions

- TypeScript-first code MUST be default; changed code MUST stay strictly typed.
- Existing repo patterns MUST be preferred over new abstractions unless new abstraction clearly required.
- Biome formatting + lint in `biome.json` MUST be followed.
- React components MUST use `PascalCase.tsx`; hooks MUST use `useThing.ts`; tests MUST use `*.test.ts(x)`.
- Unicode em dash `U+2014` MUST NOT be used; MUST use `--` instead. Detect: `rg -n --pcre2 "\\x{2014}" .`.
- Floating promises MUST NEVER be introduced; code MUST use `await`, `return`, `.catch`, or `.then(..., onRejected)`.
  Prefer lint (`@typescript-eslint/no-floating-promises`). `rg -n --pcre2 "Promise\\.resolve\\(\\)" .` narrow heuristic;
  misses e.g. `fooAsync();`.
- Every changed/added exported TS/TSX symbol MUST have `/** ... */` TSDoc; no blank line before.
- TSDoc summaries: one sentence, ends `.`. Tags only:
  `@remarks @param @typeParam @returns @throws @example @see @deprecated` (order matters).
- TSDoc `@param`: `@param name - desc`; no brace typing.
- If exported function adds or changes thrown error, it MUST include `@throws ErrorType - condition`.
- Barrel imports MUST NEVER be introduced from package entrypoints or `index` re-exports.
  e.g. `@mui/material`.
- Direct module paths MUST ALWAYS be used for imports (e.g. `@mui/material/Button`).
- Exception: packages in `experimental.optimizePackageImports` and packages optimized by Next.js by default MAY be used
  because Next rewrites them.
- Lucide icons MUST use named imports from `lucide-react` in this repo.
- `src/types/lucide-react-icons.d.ts` MUST NOT be reintroduced unless the repo intentionally returns to deep Lucide paths.

## Testing Guidelines

- App tests MUST use Vitest + `jsdom`.
- Coverage thresholds MUST be enforced by default; MAY change only via `COVERAGE_THRESHOLD_DEFAULT` or `COVERAGE_THRESHOLD_<METRIC>`.
- Infra tests MUST run from `infrastructure/` with separate Vitest config.

## Commit & Pull Request Guidelines

- Commits MUST follow Conventional Commits (e.g. `feat(infra): ...`, `fix(csp): ...`, `chore(deps): ...`).
- PRs MUST include clear description; MUST link issues/ADRs when relevant; MUST include screenshots for UI changes.
- Before commit/PR: MUST run `pnpm lint && pnpm test`.
- MUST run `pnpm type-check` + `pnpm test:e2e` when change can affect those surfaces.

## Documentation Guidelines

- New ADRs MUST use `docs/architecture/adr/ADR-0000-template.md`.
- New specs MUST use `docs/specs/SPEC-0000-template.md`.

## Security, Configuration, and Deployment Notes

- Secrets MUST NEVER be committed.
- `.env.local` MUST be used for local-only overrides from `.env.example`.
- Tailwind CSS MUST use v4 CSS-first config in `src/app/globals.css`.
- `tailwind.config.ts` MUST be tooling-only unless loaded via `@config`.
- Static export mandatory via `output: "export"`.
- Server Actions, ISR, Draft Mode, request-dependent Route Handlers, other server-runtime-only features MUST NOT be introduced.
- CSP inline script hashes generated; NOT secrets.
- `infrastructure/lib/generated/next-inline-script-hashes.ts` MUST NEVER be deleted or edited manually.
- CSP hashes MUST be regenerated with `pnpm generate:csp-hashes`, usually `pnpm build`.
- Static export + CSP deployment MUST stay in sync:
  `pnpm build` -> `pnpm -C infrastructure deploy:storage` -> `pnpm deploy:static:prod`.
- Merges to `main` MUST keep GitHub Actions deploy in `.github/workflows/deploy.yml`.

## Browser Automation

`agent-browser` MUST be used for browser automation.
`agent-browser --help` SHOULD be used when command syntax needed.

Core workflow:

1. `agent-browser open <url>` - Navigate
2. `agent-browser snapshot -i` - Interactive elements + refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact via refs
4. Re-snapshot after page changes

## Using Source Code Reference Skills

- `$opensrc`: fetch package/repo source when implementation details matter or docs/types thin.
- `$opensrc-inspect`: search/inspect fetched sources; compare dep versions during upgrades for compat + native API use.
