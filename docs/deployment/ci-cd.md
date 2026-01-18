# CI/CD Pipeline Documentation

Deployment process for bjornmelin-platform-io.

## Infrastructure Deployment

### Prerequisites

- AWS credentials provisioned for the target account
- AWS CDK CLI via `pnpm dlx aws-cdk` (no global install required)
- Node.js 24.x LTS (pinned via `.nvmrc`)
- pnpm 10.28.0 (activated via Corepack from `package.json#packageManager`)

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

Production is deployed automatically by `.github/workflows/deploy.yml` on merges to `main`. The
workflow performs the safe sequence to keep the static export and CSP hashes in sync:

1. `pnpm build` (generates `out/` and refreshes CSP artifacts under `infrastructure/lib/generated/`)
2. `pnpm -C infrastructure cdk deploy prod-portfolio-storage` (deploys CloudFront Functions + CSP hashes KVS)
3. `pnpm deploy:static:prod` (S3 upload + CSP hashes KVS sync + CloudFront invalidation)

### Production Build

1. Install web application dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Produce an optimized build:

   ```bash
   pnpm build
   ```

   This command runs three steps (via npm lifecycle hooks):
   - `prebuild` - Generates WebP responsive variants into `public/_images/`
   - `next build` - Generates static HTML, JS, and CSS in `out/`
   - `pnpm generate:csp-hashes` - Regenerates CSP inline script hashes for CDK

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

| Step           | Tool               | Output                                               |
| :------------- | :----------------- | :--------------------------------------------------- |
| Static export  | `next build`       | HTML/JS/CSS in `out/`                                |
| Image variants | `sharp` (prebuild) | WebP in `public/_images/` (copied to `out/_images/`) |

The implementation is split between:

- `scripts/generate-static-image-variants.mjs`: build-time image variant generation (Sharp)
- `image-loader.ts`: `next/image` custom loader mapping requests to `/_images/*`
- `next.config.mjs`: configures `images.loader = "custom"` and `images.loaderFile`

Key behavior:

- Converts PNG/JPG/JPEG inputs under `public/` to WebP variants.
- Emits responsive variants based on Next.js `deviceSizes` and `imageSizes`.
- Keeps SVG/GIF unmodified and leaves remote URLs untouched.

See ADR-0006 for the detailed decision and constraints.

### Local Container Smoke Test

Build and run the Docker image that serves the static export:

```bash
docker build -t platform-io:node24 .
docker run --rm -p 8080:80 platform-io:node24
```

Open <http://localhost:8080> to verify assets and routes.

## Automated Releases (release-please)

Releases are managed by [release-please](https://github.com/googleapis/release-please), Google's automated release tool.

- **Trigger**: Push to `main` with conventional commits
- **Flow**:
  1. Push commits following [Conventional Commits](https://www.conventionalcommits.org/) format
  2. Release-please opens/updates a Release PR automatically
  3. The Release PR accumulates changes and updates `CHANGELOG.md`
  4. Merge the Release PR to create a git tag and GitHub Release
- **Version Bumps**:
  - `fix:` commits trigger PATCH bump (1.0.x)
  - `feat:` commits trigger MINOR bump (1.x.0)
  - `feat!:` or `BREAKING CHANGE` footer triggers MAJOR bump (x.0.0)
- **Manual Override**: Use `Release-As: X.Y.Z` footer to force a specific version

See [docs/development/releasing.md](../development/releasing.md) for full details.

### Environment Variables (production via GitHub Environment)

GitHub Actions environments define the full variable set for each target stage.
Production uses GitHub Environment "production" variables and secrets:

| Type      | Variables                                        | Purpose                    |
| :-------- | :----------------------------------------------- | :------------------------- |
| Variables | `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`    | Public client config       |
| Secrets   | `AWS_DEPLOY_ROLE_ARN`                            | OIDC role ARN for AWS auth |
| AWS       | OIDC via `aws-actions/configure-aws-credentials` | No static keys             |

At runtime (Lambda), use AWS SSM Parameter Store / Secrets Manager rather than `.env` files.

See `docs/specs/SPEC-0007-deploy-workflow-permissions-drift.md` for the deploy role permission set and drift remediation.

## Deployment Environments

### Development (local only)

- Local development runs via `pnpm dev` and `.env.local`.
- No separate `dev-portfolio-*` CDK stacks are synthesized by default (see `infrastructure/bin/app.ts`).

### Production

- Deployments run through GitHub Actions using the `prod-portfolio-deploy` role
- Daily security audit workflow with pnpm audit severity gating
- CodeQL advanced workflow is the single SARIF publisher

## CI Workflows

| Workflow                | Trigger         | Purpose                                 |
| :---------------------- | :-------------- | :-------------------------------------- |
| `ci.yml`                | Push/PR         | Lint, type-check, test, build           |
| `performance-check.yml` | Push/PR to main | Lighthouse CI, bundle analysis          |
| `security-audit.yml`    | Daily/Push      | pnpm audit, dependency scanning         |
| `release-please.yml`    | Push to main    | Open/update Release PR, create releases |
| `deploy.yml`            | Push to main    | Deploy to production                    |

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
