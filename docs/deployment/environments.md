# Environment Configurations

## Overview

This document outlines the environment configurations for
bjornmelin-platform-io.

## Environment Types

### Development

```bash
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3000
AWS_REGION=us-east-1
```

#### Development Settings

- Debug logging enabled
- Local AWS services
- Development CDK stack
- Hot reload enabled

### Production (GitHub Environment + AWS SSM)

- Public client config comes from the GitHub Environment `production` variables:
  - `NEXT_PUBLIC_BASE_URL`
  - `NEXT_PUBLIC_API_URL`
- Server-side values are stored in AWS SSM Parameter Store or Secrets Manager
  (e.g., `/portfolio/prod/CONTACT_EMAIL` stored as a `SecureString`).
- CDK deployment expects the following environment variables before synth:
  - `PROD_ALERT_EMAILS` (comma-separated list of alert recipients; required)
  - `DEV_ALERT_EMAILS` (optional override for development alerts)

#### Production Settings

- Production logging
- Live AWS services
- Production CDK stack
- Optimized builds

## Environment Variables

### GitHub Secrets (CI/CD)

| Secret | Purpose | Example |
| -------- | --------- | --------- |
| `AWS_DEPLOY_ROLE_ARN` | IAM role for OIDC deployment (recommended: **Environment secret** in GitHub Environment `production`) | `arn:aws:iam::123456789:role/prod-portfolio-deploy` |
| `OPENAI_API_KEY` | Auto-release version detection | `sk-proj-...` |

### GitHub Variables (CI/CD)

| Variable | Purpose | Example |
| ---------- | --------- | --------- |
| `NEXT_PUBLIC_BASE_URL` | Production domain | `https://bjornmelin.io` |
| `NEXT_PUBLIC_API_URL` | API endpoint | `https://api.bjornmelin.io` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://bjornmelin.io` |
| `CONTACT_EMAIL` | Build-time validation | `contact@bjornmelin.io` |

### AWS SSM Parameters

| Parameter | Type | Purpose |
| ----------- | ------ | --------- |
| `/portfolio/prod/CONTACT_EMAIL` | SecureString | Contact form recipient email |
| `/portfolio/prod/resend/api-key` | SecureString | Resend API key for email delivery |
| `/portfolio/prod/resend/email-from` | SecureString | Sender email address (optional) |

### Local Development (.env.local)

```bash
AWS_REGION=us-east-1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
CONTACT_EMAIL=test@example.com

# Optional: For testing email functionality locally
# RESEND_API_KEY=re_xxxxxxxxx
# EMAIL_FROM=Contact Form <noreply@yourdomain.com>
```

### Optional Variables

```bash
# Development Settings
DEBUG=
NODE_ENV=
PORT=
```

## AWS Configuration

### Development Stack

```typescript
// infrastructure/lib/stacks/development-stack.ts
export class DevelopmentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Development resources
  }
}
```

### Production Stack

```typescript
// infrastructure/lib/stacks/production-stack.ts
export class ProductionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Production resources
  }
}
```

## Configuration Management

### Environment Files (local only)

```text
.env.local          # Local overrides (not committed)
.env.development    # Development settings (optional, not required for CI)
```

### Type Safety

```typescript
// src/env.mjs
export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  AWS_REGION: process.env.AWS_REGION,
} as const;
```

## Service Configuration

### Email Service (Resend)

```typescript
// Development (local)
const emailConfig = {
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
};

// Production (Lambda)
const emailConfig = {
  provider: "resend",
  apiKey: "ssm:/portfolio/prod/resend/api-key",
  from: "ssm:/portfolio/prod/resend/email-from",
};
```

### Storage (S3)

```typescript
// Development
const storageConfig = {
  bucketName: "dev-storage",
  publicAccess: true,
};

// Production
const storageConfig = {
  bucketName: "prod-storage",
  publicAccess: false,
};
```

## Security Settings

### Development Security

- Local AWS credentials (CLI profile or environment variables)
- Debug enabled
- Relaxed CORS
- Development domains

### Production Security

- GitHub OIDC deployment roles (no long-lived secrets)
- Strict CORS
- Production domains
- Enhanced security

## Monitoring Configuration

### Development Monitoring

```typescript
// Low priority alerts
const monitoringConfig = {
  logLevel: "debug",
  alertPriority: "low",
};
```

### Production Monitoring

```typescript
// High priority alerts
const monitoringConfig = {
  logLevel: "info",
  alertPriority: "high",
};
```

## Deployment Configuration

### Development Deployment

```bash
# Development deployment
cdk deploy --context environment=development
```

### Production Deployment

```bash
# Production deployment
cdk deploy --context environment=production
```

## Best Practices

1. Never commit sensitive values
2. Use environment-specific settings
3. Validate all configurations
4. Document all variables
5. Use type-safe configurations
6. Regular security reviews

## Troubleshooting

### Common Issues

1. Missing environment variables
2. Invalid AWS credentials
3. Wrong environment settings
4. Configuration conflicts

### Resolution Steps

1. Verify environment files
2. Check AWS credentials
3. Validate configurations
4. Review deployment context
