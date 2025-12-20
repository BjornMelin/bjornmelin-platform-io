# Infrastructure Documentation

## First-Time Deployment Setup

This section guides you through setting up AWS infrastructure from scratch for a fresh clone or fork of this repository.

### Prerequisites

- AWS account with admin access
- Domain registered in Route 53 (or DNS delegated to Route 53)
- AWS CLI installed and configured (`aws configure`)
- Node.js 20+ and pnpm installed
- GitHub repository with this code

### Step 1: Create GitHub OIDC Provider in AWS

> **Note:** Steps 1-3 are **manual prerequisites** that must be completed before running CDK. The CDK stacks do not provision these resources because:
> - The OIDC provider is account-wide (one per AWS account, not per project)
> - The IAM role is needed to run CDK itself (chicken-and-egg problem)
> - GitHub secrets must be configured in the repository settings
>
> After completing these prerequisites, CDK handles all other infrastructure (DNS, storage, email, monitoring). The CDK code in `lib/` is configured to only manage DNS, storage, email, and monitoring stacks—it explicitly does not attempt to create the OIDC provider or GitHub Actions IAM role. See the [Stack Architecture section](#stack-architecture) below for details on what each CDK stack provisions.

Run once per AWS account to enable keyless GitHub Actions authentication:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

> **Note:** The `--thumbprint-list` parameter is no longer required. Since July 2023, AWS automatically retrieves and trusts GitHub's root certificate authorities.

### Step 2: Create IAM Role for GitHub Actions

Create a role named `prod-portfolio-deploy` with the following trust policy:

> **Placeholders to replace:**
> - `YOUR_ACCOUNT_ID`: Your 12-digit AWS account ID
> - `YOUR_ORG/YOUR_REPO`: Your GitHub username or organization name, followed by the repository name (e.g., `BjornMelin/bjornmelin-platform-io`)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
      }
    }
  }]
}
```

**Attach IAM policy:** Use scoped CDK/S3/CloudFront permissions (recommended for production). For initial setup/testing only, `AdministratorAccess` may be used temporarily but should be replaced with least-privilege permissions before production use.

<details>
<summary>Example least-privilege policy for CDK deployments</summary>

The role needs permissions for:
- CloudFormation (create/update/delete stacks)
- S3 (create buckets, manage objects)
- CloudFront (create/update distributions)
- Route 53 (manage DNS records)
- ACM (request/validate certificates)
- IAM (create roles for Lambda)
- Lambda (deploy functions)
- SSM (read parameters)

See [AWS CDK Bootstrap Permissions](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) for guidance on minimal permissions.
</details>

### Step 3: Configure GitHub Repository

Navigate to your repository Settings → Environments → **production**.

**Environment secrets** (required):

| Secret | Value |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::YOUR_ACCOUNT_ID:role/prod-portfolio-deploy` |
| `OPENAI_API_KEY` | OpenAI key for auto-release (optional) |

**Environment variables** (required):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com` |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `CONTACT_EMAIL` | `contact@your-domain.com` (build-time validation) |

### Step 4: Create AWS SSM Parameter for Contact Email

The contact form Lambda reads the recipient email from SSM at runtime:

```bash
aws ssm put-parameter \
  --name "/portfolio/prod/CONTACT_EMAIL" \
  --value "your-email@gmail.com" \
  --type "SecureString" \
  --region us-east-1
```

Or use the helper script: `./scripts/ops/setup-aws-ssm.sh your-email@gmail.com`

### Step 5: Deploy Infrastructure

```bash
cd infrastructure
pnpm install
pnpm cdk deploy prod-portfolio-dns --require-approval never
pnpm cdk deploy prod-portfolio-storage --require-approval never
pnpm cdk deploy prod-portfolio-email --require-approval never
pnpm cdk deploy prod-portfolio-monitoring --require-approval never
```

> **Tip:** The `--require-approval never` flag bypasses CDK's change review prompts. For first-time deployments, consider running `pnpm cdk diff <stack-name>` first to review changes, or omit the flag to get interactive approval prompts. Keep `--require-approval never` primarily for automated CI/CD pipelines.

### Step 6: Deploy Application

Push to `main` branch or run manually:

```bash
gh workflow run deploy.yml
```

---

## Stack Architecture

### Overview

The infrastructure is organized into four main stacks:

- **DNS Stack:** Manages domain and SSL certificates
- **Storage Stack:** Handles S3 and CloudFront configuration
- **Deployment Stack:** Manages IAM and deployment credentials
- **Monitoring Stack:** Configures CloudWatch alarms

### Resource Relationships

```mermaid
graph TD
    DNS[DNS Stack] --> |Certificate & Zone| Storage[Storage Stack]
    Storage --> |Bucket & Distribution| Deployment[Deployment Stack]
    Storage --> |Bucket & Distribution| Monitoring[Monitoring Stack]
```

### Configuration Details

- **Domain:** bjornmelin.io
- **Environment:** Production
- **Region:** us-east-1 (primary)
- **CDK Version:** 2.99.1

### Security Measures

- SSL/TLS encryption (TLS 1.2+)
- S3 bucket public access blocked
- Strict security headers
- IAM least privilege access
- DNS validation for certificates

## Deployment Guide

### Prerequisites

- AWS CLI configured
- Node.js 24.x LTS (use `nvm use` from repo root)
- pnpm package manager (align with repository CI version)
- Domain registered in Route 53

### Configuration Parameters

```typescript
export const CONFIG = {
  prod: {
    domainName: "bjornmelin.io",
    environment: "prod",
  },
};
```

### Deployment Steps

1. Install dependencies:

   ```bash
   cd infrastructure
   pnpm install
   ```

2. Deploy stacks in order:

   ```bash
   # Deploy DNS stack first (wait for certificate validation)
   pnpm deploy:dns

   # Deploy remaining stacks
   pnpm deploy:storage
   pnpm deploy:deployment
   pnpm deploy:monitoring
   pnpm deploy:email
   ```

### Troubleshooting Steps

1. **Certificate Issues:**

   - Verify DNS validation records
   - Check certificate region (must be us-east-1)

2. **CloudFront Issues:**

   - Verify distribution status
   - Check origin access configuration
   - Validate SSL certificate status

3. **Deployment Issues:**
   - Verify IAM permissions
   - Check GitHub Actions secrets
   - Validate S3 bucket permissions

### Rollback Procedures

```bash
# Rollback specific stack
cdk destroy prod-portfolio-[stack-name]

# Rollback all stacks
pnpm destroy:all
```

## Monitoring Documentation

### Available Metrics

1. **CloudFront:**

   - 5xx Error Rate
   - Cache Hit/Miss Rate
   - Total Requests

2. **S3:**
   - 4xx Errors
   - Total Requests
   - Bucket Size

### Alarm Thresholds

- CloudFront 5xx Errors: > 5% over 2 periods
- S3 4xx Errors: > 10 errors over 2 periods

### Response Procedures

1. **High Error Rates:**

   - Check CloudWatch logs
   - Verify origin health
   - Review security configurations

2. **Performance Issues:**
   - Monitor cache hit rates
   - Check origin response times
   - Verify CloudFront settings

### Maintenance Tasks

1. **Regular:**

   - Monitor SSL certificate expiration
   - Review CloudWatch alarms
   - Check S3 lifecycle rules

2. **Monthly:**
   - Review access logs
   - Verify backup retention
   - Check cost optimization

## Tests

- Runner: Vitest (Node environment). No AWS account or credentials are required.
- Location: `infrastructure/test/*.test.ts`
- Why it’s fast:
  - Tests mock `route53.HostedZone.fromLookup` and stub `aws-cdk-lib/aws-lambda-nodejs.NodejsFunction`
    to avoid AWS lookups and esbuild bundling.

Commands

```bash
# Install deps (once)
pnpm -C infrastructure install

# Run the infra test suite
pnpm -C infrastructure test

# With coverage (v8)
pnpm -C infrastructure test:coverage

# Run a single test file
pnpm -C infrastructure vitest run test/storage-stack.test.ts
```

Notes

- Type-check/build excludes tests (`tsconfig.json` includes only `bin/**` and `lib/**`).
- Vitest config lives in `infrastructure/vitest.config.ts` with sensible coverage excludes.
