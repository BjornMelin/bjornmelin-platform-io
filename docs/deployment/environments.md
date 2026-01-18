# Environment Configurations

## Overview

This document outlines the environment configurations for
bjornmelin-platform-io.

## Environment Types

### Local development (`.env.local`)

Local development runs the Next.js dev server and uses `.env.local` for public client config and build-time validation.

```bash
AWS_REGION=us-east-1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Contact form API base URL (must be deployed; the web app is a static export and has no local /api route).
# Examples:
#   https://api.your-domain.com
#   https://your-domain.com/api
NEXT_PUBLIC_API_URL=https://api.example.com

# Used for build-time validation only (not a production secret in this repo).
CONTACT_EMAIL=test@example.com
```

### Production (GitHub Environment + AWS SSM)

Production deploys use:

- GitHub Environment `production` **variables** for public client config:
  - `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `CONTACT_EMAIL`
- GitHub Environment `production` **secrets** for AWS auth:
  - `AWS_DEPLOY_ROLE_ARN` (OIDC role ARN assumed by GitHub Actions)
- AWS SSM Parameter Store for server-only values consumed by Lambda:
  - `/portfolio/prod/CONTACT_EMAIL` (SecureString)
  - `/portfolio/prod/resend/api-key` (SecureString)

CDK stack defaults are defined in `infrastructure/lib/constants.ts`. You can override alert recipients at deploy time via:

- `PROD_ALERT_EMAILS` (optional comma-separated list; overrides the default `alerts@<domain>`)

## Environment Variables

### GitHub Secrets (CI/CD)

| Secret | Purpose | Example |
| -------- | --------- | --------- |
| `AWS_DEPLOY_ROLE_ARN` | IAM role for OIDC deployment (recommended: **Environment secret** in GitHub Environment `production`) | `arn:aws:iam::123456789:role/prod-portfolio-deploy` |
| `OPENAI_API_KEY` | Auto-release (optional) | `sk-proj-...` |

### GitHub Variables (CI/CD)

| Variable | Purpose | Example |
| ---------- | --------- | --------- |
| `NEXT_PUBLIC_BASE_URL` | Production domain | `https://example.com` |
| `NEXT_PUBLIC_API_URL` | API endpoint | `https://api.example.com` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://example.com` |
| `CONTACT_EMAIL` | Build-time validation | `contact@example.com` |

### AWS SSM Parameters

| Parameter | Type | Purpose |
| ----------- | ------ | --------- |
| `/portfolio/prod/CONTACT_EMAIL` | SecureString | Contact form recipient email |
| `/portfolio/prod/resend/api-key` | SecureString | Resend API key for email delivery |
| `/portfolio/prod/resend/email-from` | SecureString | Sender email address (optional) |

## Notes

- The CDK app in `infrastructure/bin/app.ts` currently synthesizes **production** stacks only.
- If you add additional environments, ensure:
  - CloudFormation export names remain consistent with the deploy script (`scripts/deploy-static-site.mjs`).
  - GitHub Actions workflows are updated to use the correct environment prefix.
