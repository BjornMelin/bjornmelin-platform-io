# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Introduced `.github/actions/setup-node-pnpm` to centralize Node.js/pnpm setup
  and caching across workflows.
- Implemented `pnpm audit` severity gating with a JSON report evaluator and job
  summary output.
- Added CDK assertion tests for `DeploymentStack` (legacy IAM toggle) and
  `MonitoringStack` (alert recipients).
- Created markdownlint automation and normalized documentation formatting across
  `/docs`.
- Provisioned the `prod-portfolio-deploy` GitHub OIDC IAM role and attached
  scoped S3/CloudFront policies.

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

### Removed

- Eliminated the deprecated legacy IAM user outputs; any temporary access keys
  now reside in AWS Secrets Manager when explicitly enabled.
- Removed `npm audit` from the security workflow, relying exclusively on pnpm
  for dependency scanning.
