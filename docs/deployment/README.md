# Deployment Overview

## Prerequisites Checklist

Before deploying, ensure you have completed:

- [ ] AWS account with OIDC provider configured (see [infrastructure/README.md](../../infrastructure/README.md))
- [ ] IAM role `prod-portfolio-deploy` created with GitHub OIDC trust policy
  - [ ] CDK bootstrap access attached (helper: `bash scripts/ops/fix-gh-oidc-cdk-bootstrap-policy.sh --role-name prod-portfolio-deploy`)
  - [ ] Static deploy access attached (helper: `bash scripts/ops/fix-gh-oidc-static-deploy-policy.sh --role-name prod-portfolio-deploy --env prod`)
- [ ] Domain in Route 53 (or DNS delegated to Route 53)
- [ ] GitHub Environment **production** secrets configured:
  - [ ] `AWS_DEPLOY_ROLE_ARN` - IAM role ARN for OIDC authentication (e.g., `arn:aws:iam::123456789012:role/prod-portfolio-deploy`)
- [ ] GitHub variables configured:
  - [ ] `NEXT_PUBLIC_BASE_URL` - Production domain URL
  - [ ] `NEXT_PUBLIC_API_URL` - API endpoint URL
  - [ ] `NEXT_PUBLIC_APP_URL` - Application URL
  - [ ] `CONTACT_EMAIL` - Build-time validation email
- [ ] SSM parameter `/portfolio/prod/CONTACT_EMAIL` created (SecureString)
  - Note: The CloudFront CSP hashes KeyValueStore (KVS) is provisioned by CDK; no manual KVS setup is required.

For step-by-step setup instructions, see the **First-Time Deployment Setup** section in [infrastructure/README.md](../../infrastructure/README.md).

## Introduction

Deployment processes and practices for bjornmelin-platform-io.

## Deployment Architecture

### Infrastructure Components

- Next.js static export
- AWS CDK stacks
- Static assets (S3 + CloudFront)
- Email service (Lambda + Resend)

## Deployment Types

### Production Deployment

Production deployments are managed through AWS CDK and GitHub Actions assuming
the `prod-portfolio-deploy` IAM role. The complete rollout includes:

- Infrastructure deployment (CDK stacks)
- Static asset deployment (S3)
- CSP hashes KeyValueStore (KVS) sync
- CloudFront cache invalidation
- Monitoring configuration

GitHub Actions uses an `AWS_DEPLOY_ROLE_ARN` secret (recommended: GitHub Environment
**production** secret) to assume the deployment IAM role through OIDC, eliminating
long-lived AWS credentials.

### Development Deployment

Development deployments are used for testing:

- Local development server (`pnpm dev`)
- Local static build verification (`pnpm build && pnpm serve`)
- GitHub Actions jobs assume an environment-specific OIDC role

## Deployment Process

### 1. Build Application

```bash
# Install dependencies
pnpm install

# Run tests and type checking
pnpm type-check
pnpm test

# Build application (includes image optimization)
pnpm build
```

The build command executes:

1. `prebuild` - Generates WebP responsive variants into `public/_images/`
2. `next build` - Generates static HTML/JS/CSS in `out/`
3. `pnpm generate:csp-hashes` - Regenerates CSP inline script hashes for CDK

### 2. Deploy Infrastructure

```bash
cd infrastructure
pnpm install
pnpm cdk deploy --all
```

### 3. Upload Static Assets

GitHub Actions deploys production automatically on merges to `main` via `deploy.yml`:
it builds the static export, deploys the Storage stack (CloudFront Functions + CSP KVS), then deploys
the matching `out/` directory to S3, syncs the CSP hashes KeyValueStore, and invalidates CloudFront.

Note: `deploy.yml` ignores documentation-only changes (`**.md`). Use `manual-deploy.yml` if you
intentionally need to redeploy the site for a docs-only commit.

#### CSP + static export coupling (important)

The CloudFront distribution applies a strict `Content-Security-Policy` that includes a hash allow-list
for Next.js inline bootstrap scripts. Those hashes are generated from the static export (`out/**/*.html`).
If the storage stack is deployed without also uploading the matching `out/` artifacts, the site can render
a blank page due to CSP violations.

Local/manual production deployment order:

```bash
# 1) Build the static export and regenerate CSP hashes used by CDK
CONTACT_EMAIL=contact@bjornmelin.io \
NEXT_PUBLIC_APP_URL=https://bjornmelin.io \
NEXT_PUBLIC_BASE_URL=https://bjornmelin.io \
NEXT_PUBLIC_API_URL=https://api.bjornmelin.io \
pnpm build

# 2) Deploy the storage stack (CloudFront Functions + KVS)
pnpm -C infrastructure deploy:storage

# 3) Upload static assets + sync CSP hashes KVS + invalidate CloudFront
pnpm deploy:static:prod
```

### 4. Verify Deployment

- Run health checks
- Verify endpoints
- Check monitoring dashboards

## Documentation Sections

- [CI/CD Pipeline](./ci-cd.md)
- [Environment Configuration](./environments.md)
- [Monitoring](./monitoring.md)

## Production Configuration

Production configuration is sourced at deploy/build time from:

- **GitHub Environment "production" variables** (public client config):
  - `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`, etc.
- **AWS SSM Parameter Store / Secrets Manager** (server-side runtime):
  - `/portfolio/prod/CONTACT_EMAIL` (consumed by the Email Lambda)

No `.env.production` file is used. Local development uses `.env.local` only.

## Best Practices

### Pre-deployment Checks

- Run all tests (`pnpm test`)
- Run E2E tests when routes or form flows change (`pnpm test:e2e`)
- Check types (`pnpm type-check`)
- Verify dependencies (`pnpm install`)
- Analyze bundle size (`pnpm analyze`)

### Deployment Safety

- Use staging environments for testing
- Monitor deployments via CloudWatch
- Verify security settings

### Post-deployment

- Verify application health
- Check monitoring alerts
- Validate functionality
- Review logs

## Quick Reference

### Common Commands

```bash
# Build application with image optimization
pnpm build

# Analyze bundle size
pnpm analyze

# Navigate to infrastructure workspace
cd infrastructure

# Deploy all stacks
pnpm cdk deploy --all

# Deploy a specific stack
pnpm cdk deploy prod-portfolio-email

# Review planned changes without deploying
pnpm cdk diff
```

### Rollback

CDK does not have a built-in rollback command. To rollback:

1. Revert the code changes in git
2. Redeploy with `pnpm cdk deploy --all`

For detailed information about specific aspects of deployment, refer to the
individual documentation sections listed above.
