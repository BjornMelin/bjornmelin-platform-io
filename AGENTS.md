# Repository Guidelines

## Project Structure & Module Organization

- `src/app/` MUST contain Next.js App Router routes (`page.tsx`, `layout.tsx`, `route.ts`).
- `src/components/` MUST contain UI and site sections; shared logic MUST live in `src/lib/` when appropriate.
- `src/lib/`, `src/hooks/`, and `src/types/` MUST contain core logic, hooks, and types.
- `src/__tests__/` MUST contain Vitest unit and integration tests (`*.test.ts(x)`).
- `src/test/` and `src/mocks/` MUST contain test setup, helpers, factories, and MSW handlers.
- `public/` MUST contain static assets.
- `out/` MUST be treated as generated output and MUST NOT be edited manually.
- `infrastructure/` MUST contain the AWS CDK app and its independent tests and config.
- `scripts/` MUST contain build, deploy, and operational utilities.
- `docs/` MUST contain architecture decisions, specifications, and runbooks.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies (Node version follows `.nvmrc`).
- `pnpm dev`: run Next.js locally on `http://localhost:3000`.
- `pnpm build`: production build; generates image variants, writes static `out/`, and updates CSP hashes.
- `pnpm start` or `pnpm serve`: serve the static export in `out/`.
- `pnpm lint` and `pnpm format`: Biome linting and formatting.
- `pnpm type-check`: TypeScript validation.
- `pnpm test` and `pnpm test:coverage`: Vitest unit and integration coverage.
- `pnpm test:e2e`: Playwright tests in `e2e/`.

Infrastructure:

- `pnpm -C infrastructure install`: install infrastructure dependencies.
- `pnpm -C infrastructure test`: run the infrastructure Vitest suite.
- `pnpm -C infrastructure deploy:storage` and other `deploy:*`: deploy CDK stacks.

## Coding Style & Naming Conventions

- TypeScript-first code MUST be the default, and changed code MUST stay strictly typed.
- Existing repo patterns MUST be preferred over new abstractions unless a new abstraction is clearly required.
- Biome formatting and linting rules in `biome.json` MUST be followed.
- React components MUST use `PascalCase.tsx`, hooks MUST use `useThing.ts`, and tests MUST use `*.test.ts(x)`.
- Unicode em dash `U+2014` MUST NOT be used; `--` MUST be used instead. Detect with `rg -n --pcre2 "\\x{2014}" .`.
- Floating promises MUST NEVER be introduced; code MUST use `await`, `return`, `.catch`, or `.then(..., onRejected)`.
  Prefer lint rule enforcement (e.g., `@typescript-eslint/no-floating-promises`) for reliable
  detection. If using `rg`, note that `rg -n --pcre2 "Promise\\.resolve\\(\\)" .` is a narrow
  heuristic and will miss common cases like `fooAsync();`.
- Every changed or added exported TS/TSX symbol MUST have a `/** ... */` TSDoc block with no blank line before it.
- TSDoc summaries MUST be one sentence ending with `.`. Allowed tags are only:
  `@remarks @param @typeParam @returns @throws @example @see @deprecated` (order matters).
- TSDoc `@param` tags MUST use `@param name - desc` with no brace typing.
- If an exported function adds or changes a thrown error, it MUST include `@throws ErrorType - condition`.
- Barrel imports MUST NEVER be introduced from package entrypoints or `index` re-exports.
  Examples: `lucide-react`, `@mui/material`.
- Direct module paths MUST ALWAYS be used for imports (for example `lucide-react/dist/esm/icons/x` or `@mui/material/Button`).
- The only barrel-import exception is packages listed in `experimental.optimizePackageImports`;
  those MAY be used because Next rewrites them.
- Lucide icons MUST ALWAYS use direct `lucide-react/dist/esm/icons/*` imports.
- The Lucide typings shim at `src/types/lucide-react-icons.d.ts` MUST be preserved when those direct paths are used.

## Testing Guidelines

- App tests MUST use Vitest with `jsdom`.
- Coverage thresholds MUST be enforced by default and MAY only be changed via `COVERAGE_THRESHOLD_DEFAULT` or `COVERAGE_THRESHOLD_<METRIC>`.
- Infrastructure tests MUST be run from `infrastructure/` with the separate Vitest config.

## Commit & Pull Request Guidelines

- Commit messages MUST follow Conventional Commits (for example `feat(infra): ...`, `fix(csp): ...`, `chore(deps): ...`).
- PRs MUST include a clear description, MUST link issues or ADRs when relevant, and MUST include screenshots for UI changes.
- Before committing or opening a PR, `pnpm lint && pnpm test` MUST be run.
- `pnpm type-check` and `pnpm test:e2e` MUST also be run when the change can affect those surfaces.

## Documentation Guidelines

- New ADRs MUST use `docs/architecture/adr/ADR-0000-template.md`.
- New specs MUST use `docs/specs/SPEC-0000-template.md`.

## Security, Configuration, and Deployment Notes

- Secrets MUST NEVER be committed to git.
- `.env.local` MUST be used for local-only overrides, starting from `.env.example`.
- Tailwind CSS MUST use the v4 CSS-first configuration in `src/app/globals.css`.
- `tailwind.config.ts` MUST be treated as tooling-only unless it is explicitly loaded via `@config`.
- Static export is mandatory via `output: "export"`.
- Server Actions, ISR, Draft Mode, request-dependent Route Handlers, and any other
  server-runtime-only features MUST NOT be introduced.
- CSP inline script hashes are generated and are NOT secrets.
- `infrastructure/lib/generated/next-inline-script-hashes.ts` MUST NEVER be deleted or edited manually.
- CSP hashes MUST be regenerated with `pnpm generate:csp-hashes`, usually via `pnpm build`.
- Static export and CSP deployment steps MUST stay in sync:
  `pnpm build` -> `pnpm -C infrastructure deploy:storage` -> `pnpm deploy:static:prod`.
- Merges to `main` MUST preserve the GitHub Actions deployment flow defined in `.github/workflows/deploy.yml`.

## Browser Automation

`agent-browser` MUST be used for browser automation work.
`agent-browser --help` SHOULD be used when command syntax is needed.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

## Using Source Code Reference Skills

- Use the `$opensrc` skill to fetch source code for a package or repository when internal implementation details
  matter or when public docs/types are insufficient.
- Use the `$opensrc-inspect` skill to search or inspect code within previously fetched sources and to compare
  dependencies versions source code while performing any upgrades to ensure compatibility and full leverage of
  latest native dependency api references and features.
