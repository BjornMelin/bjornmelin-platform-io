# AWS Services

This document outlines the AWS services used in the
bjornmelin-platform-io platform.

## Core Services

### AWS CDK

Used for Infrastructure as Code (IaC) to define and provision AWS
infrastructure. Our CDK stacks live in `infrastructure/lib/stacks/`:

- **DNS Stack** (`dns-stack.ts`): Manages DNS configuration
- **Email Stack** (`email-stack.ts`): Configures email services
- **Monitoring Stack** (`monitoring-stack.ts`): Sets up monitoring and alerts
- **Storage Stack** (`storage-stack.ts`): Manages storage resources
- **Deployment Stack** (`deployment-stack.ts`): Handles deployment configuration

### Simple Email Service (SES)

- Used for sending contact form emails
- Configuration managed through the Email Stack
- Implementation in `src/lib/aws/ses.ts`

## Infrastructure Organization

The infrastructure code is organized as follows:

```text
infrastructure/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   ├── constants.ts           # Shared constants
│   ├── functions/             # Lambda functions
│   │   └── contact-form/      # Contact form handler
│   ├── stacks/               # CDK stack definitions
│   └── types/                # TypeScript types
└── cdk.json                  # CDK configuration
```

## Environment Configuration

Environment-specific configurations are managed through:

- GitHub Environment `production` variables for public client config
- AWS SSM Parameter Store / Secrets Manager for server-only values
- `cdk.context.json` for CDK context values
- IAM OIDC + region for AWS credentials (no long-lived keys)

### Reading SSM Parameters (Node.js)

For Lambda/back-end code, prefer fetching configuration at startup from SSM:

```ts
// src/lib/aws/ssm.ts
import { getParameter } from "@/lib/aws/ssm";

// Example (decrypted secret):
const contactEmail = await getParameter("/portfolio/prod/CONTACT_EMAIL");
```

## Monitoring and Logging

Monitoring is configured through the monitoring stack, which sets up:

- CloudWatch metrics and alarms
- Log groups for application logs
- Infrastructure health monitoring

## Security

Infrastructure security is implemented through:

- IAM roles and policies defined in stack configurations
- Resource access controls
- Environment-based security groups
