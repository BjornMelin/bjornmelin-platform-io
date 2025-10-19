# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Removed

- Removed npm release workflow and semantic-release tooling; this site is not published to npm.
 - CI: Removed the forward-compat (Node 25) job from `ci.yml` to simplify the pipeline and avoid flaky pnpm/cache interactions.

### Added

- Codex-assisted auto-release (PR) workflow that computes a SemVer floor from code changes, uses Codex to decide the
  final bump from the full diff, and opens a Release PR with a package.json version bump.
- Finalize-release workflow that, upon merging the Release PR to `main`, tags the merge commit and publishes a GitHub
  Release with auto-generated notes.
- Release notes configuration via `.github/release.yml` and documentation under `docs/development/releasing.md`.
 - CI: Explicit pnpm installation via `pnpm/action-setup@v4` in all workflows using pnpm to guarantee availability on PATH before caching/usage.
 - Tests: Added missing suites for UI and API error paths
   - Components: Theme toggle (render), ErrorBoundary (fallback), Navbar/Footer (smoke), Projects grid/card (filtering + links)
   - API: `/api/contact` invalid JSON and validation errors (400 with codes)
 - JSDoc: Added `@fileoverview` and symbol docs for touched components (theme, layout, projects, contact form) to follow Google style.

### CI/Automation

- Auto-release loop guard to prevent re-triggering on release commits.
- Auto-release now uses the shared composite action for Node/pnpm setup and caching.
- Added actionlint to CI to validate workflow expressions and contexts.
- Fixed deploy workflow summary and notification steps to avoid invalid `||` expressions.
 - Standardized pnpm setup across all workflows: install pnpm via `pnpm/action-setup@v4` before any pnpm command or `cache: pnpm` usage; rely on `package.json:packageManager` for the version.
 - Shellcheck cleanup in workflows: quote `$GITHUB_OUTPUT`, prefer grouped redirects, and use `read -r` in loops.
 - Ensured composite action `.github/actions/setup-node-pnpm` remains for Node setup and caching; now strictly preceded by pnpm installation.
 - Deploy: Ensure `NEXT_PUBLIC_APP_URL` is exported in build environment so Next.js env validation passes; build reads repository `vars`.

### Changed

- Documentation updates across CI/CD docs to explain the new release process and controls.

- Infrastructure: Email contact Lambda now reads recipient from AWS SSM Parameter Store; stack passes
  `SSM_RECIPIENT_EMAIL_PARAM` and grants `ssm:GetParameter` on that path. Removes need for
  `RECIPIENT_EMAIL` in Lambda env.
  - Enforce SSM-only resolution (removed RECIPIENT_EMAIL fallback) and added infra tests
    (EmailStack IAM policy, SSM env plumbing, recipient resolver cache). Local infra tests run via Vitest.
  - Add comprehensive infra tests: DNS stack (ACM SANs + outputs), Storage stack (S3 security, OAC wiring,
    DNS aliases), cache and security headers policies, Email stack domain/base-path mapping and tracing,
    Monitoring dashboard and alarms, SSM helper caching, and basic constants coverage. Tests avoid AWS lookups by mocking
    HostedZone.fromLookup and NodejsFunction bundling.
 - Vitest config: broaden coverage to include new component targets while excluding library wrappers/sections; use v8 reporters (`text, html, lcov, json, json-summary`).
 - Coverage thresholds: keep 80% for lines/branches/statements; start functions at 65% (env-overridable via `COVERAGE_THRESHOLD_FUNCTIONS`), with intent to raise as targeted suites land.

## [1.2.0] - 2025-10-18

### Changed

- Runtime upgraded to Node 24 LTS; pin to `v24.10.0` via `.nvmrc` and `"engines": { "node": ">=24 <25" }` in `package.json`.
- Standardize pnpm activation through Corepack using the exact `packageManager` version (currently `pnpm@10.18.3`).
- Consolidate GitHub Actions to read Node version from `.nvmrc` and pnpm from `package.json`;
  remove per-workflow Node/pnpm env pins.
- Update all CI jobs to cache the pnpm store and run `pnpm install --frozen-lockfile` deterministically.
- Bump `@types/node` to `^24` in root and infrastructure workspaces; validate type-check and build.

### Added

- Dockerfile using Node `24-bookworm-slim` for build and a minimalist static server image for runtime (Next.js `output: 'export'`).

### Migration Notes

- Ensure you are on Node 24.x: `nvm use` (reads `.nvmrc`).
- Corepack is enabled automatically in CI; locally run
  `corepack enable && corepack use $(node -p "require('./package.json').packageManager")`
  if needed.
- No deprecated Node APIs were present; no code changes required beyond version pins.

### Added

- Introduce `.github/actions/setup-node-pnpm` to centralize Node.js/pnpm setup
  and caching across workflows.
- Implement `pnpm audit` severity gating with a JSON report evaluator and job
  summary output.
- Add CDK assertion tests for `DeploymentStack` tag propagation and
  `MonitoringStack` alert recipients.
- Create markdownlint automation and normalize documentation formatting across
  `/docs`.
- Provision the `prod-portfolio-deploy` GitHub OIDC IAM role and attach
  scoped S3/CloudFront policies.
- Add `.markdownlint.json` with a 120-character MD013 limit to keep prose
  formatting consistent while avoiding unnecessary wraps.

### Changed

- Upgraded Next.js to `14.2.33`, React to `18.3.1`, and aligned
  `eslint-config-next`, TypeScript, and Vite to patched releases.
- Standardized pnpm/Node versions (pnpm `10.18.1`, Node `>=20.11 <21`) in all
  workflows via the new composite action.
- Updated CodeQL workflow to use `github/codeql-action@v3` and documented the
  advanced-only configuration.
- Refactored the SES client utility with Google-style docstrings and strict
  optional environment handling.
- Parameterized monitoring alert emails via configuration and removed
  hard-coded addresses.
- Replaced all documentation references to Yarn with pnpm commands aligned to
  current project scripts.
- Updated `infrastructure.yml` to authenticate via GitHub OIDC, reuse the
  composite Node/pnpm action, and force Docker bundling to `linux/amd64`.
- Simplified `e2e-tests.yml` by adopting the composite action in both jobs and
  removing redundant caching logic.
- Refreshed `.github/workflows/README.md` to reflect the current workflow set
  and security posture.

### Removed

- Remove deprecated legacy IAM user outputs and supporting IAM/Secrets
  resources in favor of GitHub OIDC-only deployments.
- Removed `npm audit` from the security workflow, relying exclusively on pnpm
  for dependency scanning.
- Delete `codeartifact-backup.yml`, `workflow-status.yml`, and
  `test-matrix.yml` to reduce redundant or low-value automation.
