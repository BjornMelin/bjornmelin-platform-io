# CI/CD Pipeline Documentation

Deployment process for bjornmelin-platform-io.

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

All environments assume AWS roles through GitHub's OpenID Connect provider. The
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

   This command runs two steps:
   - `next build` - Generates static HTML, JS, and CSS in `out/`
   - `next-export-optimize-images` - Converts images to WebP with responsive variants

3. Verify the build output:

   ```bash
   ls -la out/
   find out -name "*.webp" | wc -l  # Should show optimized images
   ```

4. Run the production server locally (optional smoke test):

   ```bash
   pnpm serve
   ```

### Image Optimization Pipeline

The build process includes automatic image optimization:

| Step | Tool | Output |
|------|------|--------|
| Static export | `next build` | HTML, JS, CSS in `out/` |
| Image optimization | `next-export-optimize-images` | WebP images in `out/_next/static/chunks/images/` |

Configuration is defined in `export-images.config.js`:

- Converts PNG, JPG, JPEG to WebP
- Quality: 75%
- Generates responsive variants for device sizes

### Local Container Smoke Test

Build and run the Docker image that serves the static export:

```bash
docker build -t platform-io:node24 .
docker run --rm -p 8080:80 platform-io:node24
```

Open <http://localhost:8080> to verify assets and routes.

## Automated Releases (Codex-assisted)

- **Trigger**: Push to `main` or manual dispatch "Auto Release".
- **Flow**:
  - Prechecks compute a safe SemVer floor from actual code changes.
  - Codex analyzes the full diff and returns a structured JSON decision (bump + rationale).
  - Floor enforcement prevents lowering; high-risk outputs default to the floor.
  - The workflow creates a Release PR with version bump.
  - When merged, the finalize workflow tags and publishes the GitHub Release.
  - `.github/release.yml` controls categories; PRs labeled `release:skip` are excluded.
- **Overrides**:
  - Labels `semver:override-*` and `release:skip` adjust behavior.
- **Safety**:
  - Codex runs under reduced privileges; release creation uses `GITHUB_TOKEN` with `contents: write`.

### Environment Variables (production via GitHub Environment)

GitHub Actions environments define the full variable set for each target stage.
Production uses GitHub Environment "production" variables and secrets:

| Type | Variables | Purpose |
|------|-----------|---------|
| Variables | `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL` | Public client config |
| Secrets | `OPENAI_API_KEY` | Codex-assisted releases |
| AWS | OIDC via `aws-actions/configure-aws-credentials` | No static keys |

At runtime (Lambda), use AWS SSM Parameter Store / Secrets Manager rather than `.env` files.

## Deployment Environments

### Development

- Ad hoc deployments via CDK or branch workflows
- Shares infrastructure code with production
- Uses the `dev-portfolio-deploy` OIDC role for automation

### Production

- Deployments run through GitHub Actions using the `prod-portfolio-deploy` role
- Daily security audit workflow with pnpm audit severity gating
- CodeQL advanced workflow is the single SARIF publisher

## CI Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, type-check, test, build |
| `performance-check.yml` | Push/PR to main | Lighthouse CI, bundle analysis |
| `security-audit.yml` | Daily/Push | pnpm audit, dependency scanning |
| `auto-release.yml` | Push to main | Create Release PR |
| `finalize-release.yml` | Release PR merge | Tag and publish release |
| `deploy.yml` | Push to main | Deploy to production |

## Monitoring

- SNS alert recipients are configured in `CONFIG.prod.alerts.emails`
- CloudWatch dashboards and alarms are provisioned by `MonitoringStack`
- Audit SNS subscriptions are parameterized and can be rotated without code change

## Rollback Procedures

1. Review CloudWatch alarms and deployment logs.
2. Identify the faulty change via `pnpm cdk diff` or git history.
3. Revert the code changes and redeploy:

   ```bash
   git revert <commit>
   pnpm cdk deploy --all
   ```

4. Re-run the CI pipeline to confirm the rollback.

## Security Considerations

- GitHub OIDC federation is enforced across all workflows; no IAM access keys are provisioned.
- Secrets are stored in AWS Secrets Manager and referenced via GitHub environment variables.
- pnpm audit runs on every push/PR and fails the build on high or critical findings.
- CodeQL default setup is disabled in repository settings; the advanced workflow manages scanning.
