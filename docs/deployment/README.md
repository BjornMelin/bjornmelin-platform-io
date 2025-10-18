# Deployment Overview

## Introduction

This document provides an overview of deployment processes and practices for
bjornmelin-platform-io.

## Deployment Architecture

### Infrastructure Components

- Next.js application
- AWS CDK stacks
- Static assets (S3)
- Email service (SES)

## Deployment Types

### Production Deployment

Production deployments are managed through AWS CDK and GitHub Actions assuming
the `prod-portfolio-deploy` IAM role. The complete rollout includes:

- Infrastructure deployment
- Application deployment
- Environment configuration
- Monitoring setup

GitHub Actions uses an `AWS_DEPLOY_ROLE_ARN` repository secret to assume the
deployment IAM role through OIDC, eliminating long-lived AWS credentials.

### Development Deployment

Development deployments are used for testing and include:

- Local development server
- Local AWS services
- Test data
- Development configurations
- GitHub Actions jobs assume an environment-specific OIDC role (for example,
  a `dev-portfolio-deploy` role) instead of static credentials

## Deployment Process

1. **Build Application**

   - Run tests
   - Type checking
   - Build Next.js application

2. **Deploy Infrastructure**

   - Deploy CDK stacks
   - Configure AWS services
   - Update DNS settings

3. **Configure Environments**

   - Set environment variables
   - Configure services
   - Update API endpoints

4. **Verify Deployment**
   - Run health checks
   - Verify endpoints
   - Check monitoring

## Documentation Sections

- [CI/CD Pipeline](./ci-cd.md)
- [Environment Configuration](./environments.md)
- [Monitoring](./monitoring.md)

## Production Configuration

Production configuration is sourced at deploy/build time from:

- GitHub Environment "production" variables (public client config):
  - `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API_URL`, etc.
- GitHub Actions secrets (build-only):
  - e.g., `OPENAI_API_KEY` for Codex-assisted releases.
- AWS SSM Parameter Store / Secrets Manager (server-side runtime):
  - e.g., `/portfolio/prod/CONTACT_EMAIL` consumed by the Email Lambda.

No `.env.production` file is used. Local development uses `.env.local` only.

## Best Practices

### Pre-deployment Checks

- Run all tests
- Check types
- Verify dependencies
- Review changes

### Deployment Safety

- Use staging environments
- Implement rollback procedures
- Monitor deployments
- Verify security settings

### Post-deployment

- Verify application health
- Check monitoring alerts
- Validate functionality
- Review logs

## Quick Reference

### Common Commands

```bash
# Navigate to the infrastructure workspace
cd infrastructure

# Deploy all stacks
pnpm cdk deploy --all

# Deploy a specific stack
pnpm cdk deploy prod-portfolio-email

# Review planned changes without deploying
pnpm cdk diff

# Roll back to the previous successful deployment
pnpm cdk deploy --all --previous-parameters
```

### Important Links

- AWS Console
- Monitoring Dashboard
- Error Logs
- Health Checks

For detailed information about specific aspects of deployment, refer to the
individual documentation sections listed above.
