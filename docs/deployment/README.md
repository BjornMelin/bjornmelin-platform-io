# Deployment Overview

## Introduction

Deployment processes and practices for bjornmelin-platform-io.

## Deployment Architecture

### Infrastructure Components

- Next.js static export
- AWS CDK stacks
- Static assets (S3 + CloudFront)
- Email service (Lambda + SES)

## Deployment Types

### Production Deployment

Production deployments are managed through AWS CDK and GitHub Actions assuming
the `prod-portfolio-deploy` IAM role. The complete rollout includes:

- Infrastructure deployment (CDK stacks)
- Static asset deployment (S3)
- CloudFront cache invalidation
- Monitoring configuration

GitHub Actions uses an `AWS_DEPLOY_ROLE_ARN` repository secret to assume the
deployment IAM role through OIDC, eliminating long-lived AWS credentials.

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

1. `next build` - Generates static HTML/JS/CSS in `out/`
2. `next-export-optimize-images` - Converts images to WebP with responsive variants

### 2. Deploy Infrastructure

```bash
cd infrastructure
pnpm install
pnpm cdk deploy --all
```

### 3. Upload Static Assets

GitHub Actions uploads the `out/` directory to S3 and invalidates CloudFront cache.

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
