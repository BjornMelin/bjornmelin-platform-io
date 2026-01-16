# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router routes (`page.tsx`, `layout.tsx`, `route.ts`).
- `src/components/`: UI + site sections (keep shared logic in `src/lib/` when possible).
- `src/lib/`, `src/hooks/`, `src/types/`: core logic, hooks, and types.
- `src/__tests__/`: Vitest unit/integration tests (`*.test.ts(x)`).
- `src/test/`, `src/mocks/`: test setup, helpers, factories, and MSW handlers.
- `public/`: static assets. `out/`: generated static export (do not edit).
- `infrastructure/`: AWS CDK app + its own tests/config.
- `scripts/`: build/deploy/ops utilities. `docs/`: architecture + runbooks.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies (Node version pinned via `.nvmrc`).
- `pnpm dev`: run Next.js locally on `http://localhost:3000`.
- `pnpm build`: production build, generates `out/`, and updates CSP hashes.
- `pnpm start` or `pnpm serve`: serve the `out/` static export.
- `pnpm lint` / `pnpm format`: Biome lint+format (writes fixes).
- `pnpm type-check`: TypeScript typecheck.
- `pnpm test` / `pnpm test:coverage`: Vitest unit/integration tests + coverage.
- `pnpm test:e2e`: Playwright (expects tests in `e2e/`, `--pass-with-no-tests` enabled).

Infrastructure:

- `pnpm -C infrastructure install`: install infra dependencies.
- `pnpm -C infrastructure test`: infra Vitest suite (Node environment).
- `pnpm -C infrastructure deploy:storage` (and other `deploy:*`): deploy CDK stacks.

## Coding Style & Naming Conventions

- TypeScript-first; strict typing preferred. Prefer existing patterns over new abstractions.
- Formatting/linting: Biome (2 spaces, double quotes, semicolons; see `biome.json`).
- Naming: React components `PascalCase.tsx`, hooks `useThing.ts`, tests `*.test.ts(x)`.

## Testing Guidelines

- App tests: Vitest + `jsdom`; coverage thresholds are enforced by default (override via
  `COVERAGE_THRESHOLD_DEFAULT` / `COVERAGE_THRESHOLD_<METRIC>`).
- Infra tests: run from `infrastructure/` (separate Vitest config).

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (examples from history: `feat(infra): ...`,
  `fix(csp): ...`, `chore(deps): ...`).
- PRs: include a clear description, link issues/ADRs when relevant, and add screenshots for UI changes.
- Before committing/opening a PR, run: `pnpm lint && pnpm test` (plus `pnpm type-check` / `pnpm test:e2e` when applicable).

## Security, Configuration, and Deployment Notes

- Keep secrets out of git. Use `.env.local` for local overrides (start from `.env.example`).
- CSP inline script hashes are generated and are **not secrets** (they appear in public CSP headers).
  Never delete or manually edit `infrastructure/lib/generated/next-inline-script-hashes.ts`.
  Regenerate with `pnpm generate:csp-hashes` (usually via `pnpm build`).
  See `docs/architecture/adr/0001-cloudfront-csp-nextjs-inline-hashes.md`.
- Static export + CSP must stay in sync: `pnpm build` → `pnpm -C infrastructure deploy:storage` → `pnpm deploy:static:prod`.
- GitHub Actions: merges to `main` run the same sequence automatically via `.github/workflows/deploy.yml`.
