# CI/CD Pipeline Documentation

This document outlines the deployment process for bjornmelin-platform-io.

## Infrastructure Deployment

### Prerequisites

- AWS credentials provisioned for the target account
- AWS CDK CLI via `pnpm dlx aws-cdk` (no global install required)
- Node.js 24.x LTS (pinned via `.nvmrc`)
- pnpm 10.18.x (activated via Corepack from `package.json#packageManager`)

### CDK Deployment Process

1. Install dependencies in the infrastructure workspace:

   ```bash
   cd infrastructure
   pnpm install
   ```

2. Build the CDK app:

   ```bash
   pnpm build
   ```

3. Review changes prior to deployment:

   ```bash
   pnpm cdk diff
   ```

4. Deploy the stacks that need to change:

   ```bash
   pnpm cdk deploy prod-portfolio-storage
   pnpm cdk deploy prod-portfolio-monitoring
   pnpm cdk deploy prod-portfolio-deployment
   ```

   Use `pnpm cdk deploy --all` when a coordinated full rollout is required.

All environments assume AWS roles through GitHub’s OpenID Connect provider. The
CDK stacks do **not** create IAM users or access keys.

## Next.js Application Deployment

### Production Build

1. Install web application dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Produce an optimized build:

   ```bash
   pnpm build
   ```

3. Run the production server locally (optional smoke test):

   ```bash
   pnpm start
   ```

### Local Container Smoke Test

Build and run the Docker image that serves the static export (requires Docker Desktop/daemon running):

```bash
docker build -t platform-io:node24 .
docker run --rm -p 8080:80 platform-io:node24
```

Open <http://localhost:8080> to verify assets and routes.

## Automated Releases (Codex-assisted)

- Trigger: Push to `main` or manual dispatch `Auto Release`.
- Flow:
  - Prechecks compute a safe SemVer floor from actual code changes (routes/API/env heuristics).
  - Codex Action reads the full diff and returns a structured JSON decision (bump + rationale).
  - Floor enforcement prevents lowering; high-risk outputs default to the floor.
  - The workflow creates a tag `vX.Y.Z` and a draft GitHub Release with `generate_release_notes: true`.
  - `.github/release.yml` controls categories; PRs labeled `release:skip` are excluded.
- Overrides:
  - Labels `semver:override-*` and `release:skip` adjust behavior in edge cases.
- Safety:
  - Codex runs under reduced privileges; release creation uses `GITHUB_TOKEN` with `contents: write`.

### Environment Variables (production via GitHub Environment)

GitHub Actions environments define the full variable set for each target stage.
Production uses GitHub Environment "production" variables and secrets:

- Variables (public client config): `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API_URL`
- Secrets (build-time or CI use): `OPENAI_API_KEY` (Codex), others as needed
- AWS access uses OIDC via `aws-actions/configure-aws-credentials` (no static keys)

At runtime (Lambda/back-end), prefer AWS SSM Parameter Store / Secrets Manager rather than `.env` files.

## Deployment Environments

### Development

- Ad hoc deployments via CDK or branch workflows
- Shares infrastructure code with production
- Uses the `dev-portfolio-deploy` OIDC role for automation

### Production

- Deployments run through GitHub Actions using the `prod-portfolio-deploy`
  role
- Daily security audit workflow with pnpm audit severity gating
- CodeQL advanced workflow is the single SARIF publisher (default setup is
  disabled)

## Monitoring

- SNS alert recipients are configured in `CONFIG.prod.alerts.emails`
- CloudWatch dashboards and alarms are provisioned by `MonitoringStack`
- Audit SNS subscriptions are parameterized and can be rotated without code change

## Rollback Procedures

1. Review CloudWatch alarms and deployment logs.
2. Identify the faulty change via `pnpm cdk diff`.
3. Redeploy the previous stack version:

   ```bash
   pnpm cdk deploy --all --previous-parameters
   ```

4. Re-run the CI pipeline to confirm the rollback.

## Security Considerations

- GitHub OIDC federation is enforced across all workflows; no IAM access keys
  are provisioned.
- Secrets are stored in AWS Secrets Manager and referenced via GitHub
  environment variables.
- pnpm audit runs on every push/PR and fails the build on high or critical
  findings.
- CodeQL default setup is disabled in repository settings; the advanced
  workflow manages scanning.
