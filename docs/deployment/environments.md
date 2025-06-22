# Environment Configurations

## Overview

This document outlines the environment configurations for bjornmelin-platform-io.

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

### Production

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.example.com
AWS_REGION=us-east-1
```

#### Production Settings

- Production logging
- Live AWS services
- Production CDK stack
- Optimized builds

## Environment Variables

### Required Variables

```bash
# Email Configuration
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CONTACT_EMAIL=

# AWS Configuration (for CDK deployment)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Application Settings
NEXT_PUBLIC_API_URL=
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

### Environment Files

```
.env.local          # Local overrides
.env.development    # Development settings
.env.production     # Production settings
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
// Development & Production
const emailConfig = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM_EMAIL,
  to: process.env.CONTACT_EMAIL,
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

### Development

- Local credentials
- Debug enabled
- Relaxed CORS
- Development domains

### Production

- AWS IAM roles
- Strict CORS
- Production domains
- Enhanced security

## Monitoring Configuration

### Development

```typescript
// Low priority alerts
const monitoringConfig = {
  logLevel: "debug",
  alertPriority: "low",
};
```

### Production

```typescript
// High priority alerts
const monitoringConfig = {
  logLevel: "info",
  alertPriority: "high",
};
```

## Deployment Configuration

### Development

```bash
# Development deployment
cdk deploy --context environment=development
```

### Production

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
