# Complete Resend API Setup Guide for AWS Infrastructure

This comprehensive guide covers all aspects of setting up Resend API for email notifications in the bjornmelin.io portfolio application, including local development, AWS infrastructure, DNS configuration, and production deployment with security best practices.

> **📋 Architecture Reference**: For detailed system architecture diagrams and technical specifications, see the [Email Service Architecture](../infrastructure/email-service-architecture.md), [Security Architecture](../infrastructure/security-architecture.md), and [DNS Configuration Guide](../infrastructure/dns-configuration-guide.md) documentation.

> **📋 Documentation Updated**: All AWS CLI commands have been validated for v2 compatibility and SSO authentication. Key fixes include: proper date command escaping, `--key-id` parameter usage, and TXT record configuration for DKIM authentication.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Resend Account Setup](#resend-account-setup)
4. [DNS Configuration](#dns-configuration)
5. [AWS Infrastructure Setup](#aws-infrastructure-setup)
6. [Local Development Setup](#local-development-setup)
7. [Testing Configuration](#testing-configuration)
8. [Production Deployment](#production-deployment)
9. [Security Best Practices](#security-best-practices)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Cost Analysis](#cost-analysis)

## Overview

The portfolio application uses Resend API for handling contact form submissions with enterprise-grade security and AWS infrastructure integration. This implementation includes:

- **Service**: Resend API (TypeScript SDK with retry logic and error handling)
- **Infrastructure**: AWS Parameter Store with KMS encryption for secure API key storage
- **DNS**: Route 53 with SPF, DKIM, and DMARC records for email authentication
- **Security**: CSRF protection, rate limiting, input validation, and encrypted secret storage
- **Monitoring**: CloudWatch dashboards, custom metrics, and SNS alerting
- **Cost**: ~$0.83/month (Resend free tier: 3,000 emails/month)

### Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │───▶│  AWS Parameter   │───▶│   Resend API    │
│  (Contact Form)│    │     Store        │    │  (Email Service)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│      CSRF       │    │   KMS Customer   │    │   Route 53 DNS  │
│   Protection    │    │  Managed Key     │    │ (SPF/DKIM/DMARC)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

Before starting, ensure you have:

### Required Tools & Access
- [ ] **AWS CLI** configured with appropriate permissions (see below)
- [ ] **Access to your domain's DNS settings** (Route 53 recommended, external providers supported)
- [ ] **Node.js 20+** and **pnpm** installed
- [ ] **Git repository** cloned locally
- [ ] **AWS Account** with billing enabled

### Required AWS Permissions

Your AWS IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:GetParameterHistory",
        "ssm:DescribeParameters",
        "ssm:GetParametersByPath",
        "ssm:AddTagsToResource",
        "ssm:ListTagsForResource"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/portfolio/*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:CreateAlias",
        "kms:DescribeKey",
        "kms:GetKeyPolicy",
        "kms:PutKeyPolicy",
        "kms:EnableKeyRotation",
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:TagResource",
        "kms:ListAliases"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:CreateHostedZone",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:CreatePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "cloudwatch:*",
        "sns:*",
        "lambda:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Verify AWS Configuration

```bash
# Test AWS CLI access (works with SSO profiles)
aws sts get-caller-identity

# Verify permissions
aws ssm describe-parameters --max-items 1
aws kms list-aliases --limit 1
aws route53 list-hosted-zones --max-items 1

# If using AWS SSO, ensure your profile is configured and authenticated:
# aws sso login --profile your-profile-name
# export AWS_PROFILE=your-profile-name
```

## Resend Account Setup

### Step 1: Create Resend Account

1. Visit [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Access the dashboard at [resend.com/dashboard](https://resend.com/dashboard)

### Step 2: Add Your Domain

1. Navigate to [Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain: `bjornmelin.io` (or your domain)
4. Click **"Add"**

### Step 3: Copy DNS Records

Resend will provide several DNS records to add:

1. **Domain Verification**: TXT record for domain ownership
2. **DKIM Records**: 2-3 TXT records for email authentication
3. **Note these values** - you'll need them for DNS configuration

### Step 4: Generate API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Configuration:
   - **Name**: `Portfolio Production`
   - **Permission**: `Full Access` or `Send email`
   - **Domain**: Select your domain
4. Click **"Create"**
5. **Copy the API key immediately** (format: `re_xxxxxxxxxxxx`)
   - This key will only be shown once!

## DNS Configuration

### Option A: Using AWS Route 53

If your domain is hosted in Route 53:

```bash
# 1. Get your hosted zone ID
aws route53 list-hosted-zones --query "HostedZones[?Name=='bjornmelin.io.'].Id" --output text

# 2. Create a JSON file for the DNS changes
cat > dns-records.json << 'EOF'
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "bjornmelin.io",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "\"v=spf1 include:_spf.resend.com ~all\""
          }
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_resend.bjornmelin.io",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "\"resend-verification-xxxxx\""
          }
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "resend._domainkey.bjornmelin.io",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "\"k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND\""
          }
        ]
      }
    }
  ]
}
EOF

# 3. Apply the DNS changes (replace ZONE_ID with your actual zone ID)
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dns-records.json
```

### Option B: Manual DNS Configuration

Add these records in your DNS provider's control panel:

#### SPF Record (Email Authentication)
```
Type: TXT
Name: @ (or bjornmelin.io)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 300 (5 minutes)
```

#### Domain Verification
```
Type: TXT
Name: _resend
Value: resend-verification-xxxxx (from Resend dashboard)
TTL: 300 (5 minutes)
```

#### DKIM Records (usually 2-3 records)
```
Type: TXT
Name: resend._domainkey
Value: k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND (from Resend dashboard)
TTL: 300 (5 minutes)
```

Repeat for each DKIM record provided by Resend.

### Verify DNS Configuration

After adding records, verify propagation:

```bash
# Check SPF record
dig TXT bjornmelin.io +short

# Check domain verification
dig TXT _resend.bjornmelin.io +short

# Check DKIM records
dig TXT resend._domainkey.bjornmelin.io +short
```

Return to Resend dashboard - records should show as verified within 48 hours (usually much faster).

## AWS Infrastructure Setup

### Step 1: Verify AWS Environment

```bash
# Ensure you're in the correct AWS region
export AWS_DEFAULT_REGION=us-east-1
echo "Using AWS region: $AWS_DEFAULT_REGION"

# Verify AWS credentials and permissions
aws sts get-caller-identity
aws ssm describe-parameters --max-items 1 --region $AWS_DEFAULT_REGION

# Check if KMS alias already exists
aws kms list-aliases --query "Aliases[?AliasName=='alias/prod-portfolio-parameters']" --region $AWS_DEFAULT_REGION
```

### AWS CLI v2 Compatibility Notes

All commands in this guide have been validated for AWS CLI v2 compatibility and SSO authentication:

- **Parameter Names**: Uses `--key-id` (not `--kms-key-id`) for AWS CLI v2 compatibility
- **Command Substitution**: Properly escaped with quotes: `"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"`
- **SSO Support**: All commands work with `aws sso login` and profile-based authentication
- **JSON Validation**: All JSON structures have been verified for correct syntax
- **Regional Consistency**: Explicit `--region` flags ensure commands work across environments

### Step 2: Deploy Infrastructure Stacks

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
pnpm install

# Build the CDK application
pnpm build

# (Optional) Review what will be deployed
pnpm cdk diff prod-portfolio-parameters

# Deploy the parameter store stack
pnpm deploy:parameters

# Verify stack deployment
aws cloudformation describe-stacks \
  --stack-name "prod-portfolio-parameters" \
  --region $AWS_DEFAULT_REGION \
  --query 'Stacks[0].StackStatus'
```

This creates:
- **Customer-managed KMS key** with automatic rotation enabled
- **Parameter Store structure** for secure API key storage
- **IAM policies** following least privilege principle
- **CloudWatch dashboards** for monitoring
- **SNS topics** for alerting (optional)
- **Lambda function** for automated rotation (optional)

### Step 3: Store Resend API Key Securely

```bash
# Get the KMS key ID from the deployed stack
KMS_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name "prod-portfolio-parameters" \
  --query 'Stacks[0].Outputs[?OutputKey==`KmsKeyArn`].OutputValue' \
  --output text)

echo "Using KMS Key: $KMS_KEY_ID"

# Store your Resend API key securely
# Replace 're_YOUR_ACTUAL_API_KEY_HERE' with your actual API key from Resend
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
aws ssm put-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --value '{
    "apiKey": "re_YOUR_ACTUAL_API_KEY_HERE",
    "domain": "bjornmelin.io",
    "fromEmail": "no-reply@bjornmelin.io",
    "version": 1,
    "rotatedAt": "'$TIMESTAMP'"
  }' \
  --type "SecureString" \
  --key-id "alias/prod-portfolio-parameters" \
  --region us-east-1 \
  --overwrite \
  --description "Resend API configuration for portfolio contact form" \
  --tags 'Key=Environment,Value=production' 'Key=Service,Value=EmailService' 'Key=Rotation,Value=Quarterly'

# Note: Use --key-id (not --kms-key-id) for AWS CLI v2 compatibility

# Verify parameter was created successfully
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Values=/portfolio/prod/resend/api-key" \
  --region us-east-1
```

### Step 4: Verify Parameter Storage & Security

```bash
# Verify parameter metadata (won't show actual value)
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Values=/portfolio/prod/resend/api-key" \
  --region us-east-1

# Test decryption to ensure KMS is working (will show the actual value)
echo "Testing parameter decryption..."
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --with-decryption \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text | jq .

# Verify KMS key rotation is enabled
aws kms describe-key \
  --key-id "alias/prod-portfolio-parameters" \
  --query 'KeyMetadata.KeyRotationStatus' \
  --region us-east-1

# Check parameter access permissions
aws iam get-policy-version \
  --policy-arn "$(aws iam list-policies \
    --query 'Policies[?PolicyName==`prod-ResendParameterAccess`].Arn' \
    --output text)" \
  --version-id v1 \
  --query 'PolicyVersion.Document'
```

### Step 4: Update Email Stack with DNS Values

Edit `infrastructure/bin/infrastructure.ts`:

```typescript
// Add your Resend DNS values from the dashboard
const emailStack = new EmailStack(app, `${envConfig.environment}-portfolio-email`, {
  ...stackProps,
  hostedZone: dnsStack.hostedZone,
  resendApiKeyParameter: parameterStack.resendApiKeyParameter,
  resendDomainVerification: "resend-verification-xxxxx", // Your actual value
  resendDkimRecords: [
    { name: "resend._domainkey", value: "k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND" },
    { name: "resend2._domainkey", value: "k=rsa; p=SECOND_DKIM_PUBLIC_KEY_FROM_RESEND" },
    // Add all DKIM records from Resend
  ],
});
```

### Step 5: Deploy Email Infrastructure

```bash
# Deploy the email stack with DNS records
pnpm deploy:email
```

This creates:
- Route 53 DNS records (if using Route 53)
- CloudWatch monitoring dashboard
- SNS topic for email alerts
- Log groups for email service

## Local Development Setup

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env.local
```

### Step 2: Configure Environment Variables

Edit `.env.local`:

```env
# Email Configuration (Required for contact form)
RESEND_API_KEY="re_YOUR_ACTUAL_API_KEY_HERE"
RESEND_FROM_EMAIL="no-reply@bjornmelin.io"
CONTACT_EMAIL="your-personal-email@example.com"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AWS Configuration (optional for local dev)
AWS_REGION="us-east-1"
```

### Step 3: Install Dependencies

```bash
# From project root
pnpm install
```

## Testing Configuration

### Step 1: Test Email Script

```bash
# Run the test email script
node scripts/test-email.mjs
```

Expected output:
```
🚀 Testing email configuration...

From: no-reply@bjornmelin.io
To: your-personal-email@example.com
API Key: re_xxxxxxx...

✅ Email sent successfully!
📧 Email ID: msg_xxxxxxxxxxxx

✉️  Check your inbox at: your-personal-email@example.com
```

### Step 2: If Domain Not Yet Verified

If you get a domain verification error, temporarily use Resend's test domain:

```bash
# Temporarily update .env.local
RESEND_FROM_EMAIL="onboarding@resend.dev"

# Run test again
node scripts/test-email.mjs
```

### Step 3: Test Contact Form Locally

```bash
# Start development server
pnpm dev
```

1. Navigate to `http://localhost:3000/#contact`
2. Fill out the contact form:
   - Name: Test User
   - Email: test@example.com
   - Message: This is a test message
   - Check GDPR consent
3. Submit the form
4. Check console for any errors
5. Verify email arrives at your configured address

### Step 4: Run Integration Tests

```bash
# Run all tests
pnpm test

# Run specific email service tests
pnpm test:unit src/lib/services/__tests__/resend-email.test.ts

# Run with coverage
pnpm test:coverage
```

## Security Best Practices

### API Key Security

#### 1. Never Commit API Keys to Version Control

```bash
# Ensure .env files are gitignored
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Check for accidentally committed secrets
git log --grep="api" --grep="key" --grep="secret" -i
```

#### 2. Use AWS Parameter Store SecureString

```bash
# Store API key with KMS encryption
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
aws ssm put-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --value '{
    "apiKey": "re_YOUR_ACTUAL_API_KEY_HERE",
    "domain": "bjornmelin.io",
    "fromEmail": "no-reply@bjornmelin.io",
    "version": 1,
    "rotatedAt": "'$TIMESTAMP'"
  }' \
  --type "SecureString" \
  --key-id "alias/prod-portfolio-parameters" \
  --region us-east-1 \
  --overwrite \
  --description "Resend API configuration with encrypted storage"
```

#### 3. IAM Least Privilege Access

Create service-specific IAM policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ParameterStoreRead",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:us-east-1:*:parameter/portfolio/prod/resend/api-key",
      "Condition": {
        "StringEquals": {
          "ssm:version": "$LATEST"
        }
      }
    },
    {
      "Sid": "KMSDecrypt",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:us-east-1:*:key/*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

### DNS Security

#### 1. SPF Record Configuration

```dns
# Record Type: TXT
# Name: @ (root domain)
# Value: v=spf1 include:_spf.resend.com ~all
# TTL: 300

# Explanation:
# v=spf1        - SPF version 1
# include:      - Include Resend's SPF record
# ~all          - Soft fail for unauthorized senders
```

#### 2. DKIM Records (Domain Keys Identified Mail)

```bash
# Get DKIM records from Resend dashboard
# Add as TXT records:

# Record 1:
# Type: TXT
# Name: resend._domainkey
# Value: k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND (from Resend)
# TTL: 300

# Record 2 (if provided):
# Type: TXT  
# Name: resend2._domainkey
# Value: k=rsa; p=SECOND_DKIM_PUBLIC_KEY_FROM_RESEND (from Resend)
# TTL: 300
```

#### 3. DMARC Policy (Recommended)

```dns
# Record Type: TXT
# Name: _dmarc
# Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@bjornmelin.io; pct=100
# TTL: 300

# For production, consider upgrading to:
# v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@bjornmelin.io; pct=100
```

### Application Security

#### 1. Input Validation & Sanitization

The contact form implements comprehensive validation:

```typescript
// Honeypot anti-spam protection
honeypot: z.string().max(0).optional(),

// GDPR compliance
gdprConsent: z.boolean().refine((val) => val === true),

// Email validation with domain checking
email: z.string().email().max(100),

// Rate limiting per IP
// See: src/lib/security/rate-limiter.ts
```

#### 2. CSRF Protection

```typescript
// Modern CSRF implementation with rolling tokens
// See: src/lib/security/csrf-modern.ts

// Verify CSRF token on every form submission
const csrfValid = await verifyCsrfToken(token, sessionId);
if (!csrfValid) {
  throw new Error('Invalid CSRF token');
}
```

#### 3. Environment Variable Validation

```typescript
// Runtime environment validation
// See: src/env.mjs

import { z } from 'zod';

const envSchema = z.object({
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),
  CONTACT_EMAIL: z.string().email(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export const env = envSchema.parse(process.env);
```

### Network Security

#### 1. TLS/HTTPS Enforcement

```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https://')) {
  return new Response('HTTPS Required', { status: 426 });
}
```

#### 2. Security Headers

```typescript
// Next.js security headers configuration
// See: next.config.mjs

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  }
];
```

### Monitoring & Alerting

#### 1. CloudWatch Alarms

```bash
# Set up email service error alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "portfolio-email-service-errors" \
  --alarm-description "Alert on email service errors" \
  --metric-name "Errors" \
  --namespace "Portfolio/EmailService" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1
```

#### 2. Parameter Access Monitoring

```bash
# Monitor unusual parameter access patterns
aws cloudwatch put-metric-alarm \
  --alarm-name "portfolio-parameter-access-anomaly" \
  --alarm-description "Unusual parameter access detected" \
  --metric-name "ParameterAccess" \
  --namespace "Portfolio/EmailService" \
  --statistic "Sum" \
  --period 3600 \
  --threshold 100 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1
```

### Key Rotation Strategy

#### 1. Quarterly API Key Rotation

```bash
#!/bin/bash
# scripts/rotate-resend-key.sh

set -euo pipefail

OLD_KEY_VERSION=$(aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --query 'Parameter.Version' \
  --output text)

echo "Current key version: $OLD_KEY_VERSION"
echo "Generate new API key in Resend dashboard and enter it:"
read -s NEW_API_KEY

# Update parameter with new key
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
aws ssm put-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --value '{
    "apiKey": "'$NEW_API_KEY'",
    "domain": "bjornmelin.io", 
    "fromEmail": "no-reply@bjornmelin.io",
    "version": '$((OLD_KEY_VERSION + 1))',
    "rotatedAt": "'$TIMESTAMP'"
  }' \
  --type "SecureString" \
  --key-id "alias/prod-portfolio-parameters" \
  --overwrite

echo "✅ API key rotated successfully"
echo "⚠️  Remember to revoke old key in Resend dashboard"
```

#### 2. Automated Rotation with Lambda (Optional)

The infrastructure includes an optional Lambda function for automated rotation. Enable it by setting `enableRotation: true` in the CDK stack.

### Compliance & Audit

#### 1. CloudTrail Logging

```bash
# Ensure CloudTrail is logging Parameter Store access
aws cloudtrail describe-trails \
  --trail-name-list "portfolio-audit-trail"

# Check recent parameter access
aws logs filter-log-events \
  --log-group-name "/aws/cloudtrail" \
  --filter-pattern "{ $.eventName = GetParameter && $.requestParameters.name = \"/portfolio/prod/resend/api-key\" }"
```

#### 2. Regular Security Reviews

- [ ] **Monthly**: Review access logs for unusual patterns
- [ ] **Quarterly**: Rotate API keys and review IAM permissions
- [ ] **Semi-annually**: Audit DNS records and email deliverability
- [ ] **Annually**: Complete security assessment and penetration testing

### Security Checklist

- [ ] API keys stored in AWS Parameter Store with KMS encryption
- [ ] Environment variables validated at runtime
- [ ] CSRF protection enabled and tested
- [ ] Rate limiting configured on contact form endpoint
- [ ] Input validation and sanitization implemented
- [ ] Security headers configured in Next.js
- [ ] HTTPS enforced in production
- [ ] SPF, DKIM, and DMARC records configured
- [ ] CloudWatch alarms set up for error monitoring
- [ ] CloudTrail logging enabled for audit trail
- [ ] IAM policies follow least privilege principle
- [ ] API key rotation schedule established
- [ ] Security review process documented
- [ ] Incident response plan in place

## Production Deployment

### Option A: Vercel Deployment

#### Via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add variables:
   - `AWS_REGION`: `us-east-1`
   - `NEXT_PUBLIC_APP_URL`: `https://bjornmelin.io`
4. Deploy your application

#### Via Vercel CLI:
```bash
# Install Vercel CLI
pnpm add -g vercel

# Add environment variables
vercel env add AWS_REGION production
vercel env add NEXT_PUBLIC_APP_URL production

# Deploy
vercel --prod
```

### Option B: AWS Amplify

```bash
# Configure environment variables
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --environment-variables \
    AWS_REGION=us-east-1 \
    NEXT_PUBLIC_APP_URL=https://bjornmelin.io
```

### Option C: Other Platforms

For Netlify, Railway, Render, etc., add these environment variables:
- `AWS_REGION`: `us-east-1`
- `NEXT_PUBLIC_APP_URL`: `https://yourdomain.com`

### IAM Permissions for Production

If your application runs on AWS (EC2, ECS, Lambda), attach this IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameterHistory"
      ],
      "Resource": "arn:aws:ssm:us-east-1:*:parameter/portfolio/prod/resend/api-key"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:us-east-1:*:key/*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

### Verify Production Deployment

1. **Check Application Health**:
   ```bash
   curl https://bjornmelin.io/api/health
   ```

2. **Test Contact Form**:
   - Submit a test message through the live contact form
   - Check Resend dashboard for delivery status
   - Verify email received

3. **Monitor Logs**:
   - Check application logs for any errors
   - Review CloudWatch dashboard if using AWS

## Monitoring & Maintenance

### CloudWatch Dashboard

Access your monitoring dashboard:
1. Go to AWS CloudWatch Console
2. Navigate to Dashboards
3. Open `prod-portfolio-email-dashboard`

Metrics available:
- Parameter access frequency
- Email service errors
- API response times

### Set Up Alerts

```bash
# Subscribe to email alerts
aws sns subscribe \
  --topic-arn "arn:aws:sns:us-east-1:YOUR_ACCOUNT:prod-portfolio-email-alarms" \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Quarterly API Key Rotation

Since Parameter Store doesn't support automatic rotation:

1. **Generate New API Key** in Resend dashboard
2. **Update Parameter Store**:
   ```bash
   TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
   aws ssm put-parameter \
     --name "/portfolio/prod/resend/api-key" \
     --value '{
       "apiKey": "re_NEW_API_KEY_HERE",
       "domain": "bjornmelin.io",
       "fromEmail": "no-reply@bjornmelin.io",
       "version": 2,
       "rotatedAt": "'$TIMESTAMP'"
     }' \
     --type SecureString \
     --key-id "alias/prod-portfolio-parameters" \
     --region us-east-1 \
     --overwrite
   ```
3. **Test new key** with test email script
4. **Revoke old key** in Resend dashboard
5. **Document rotation** in security log

### Monitor Usage

Check Resend dashboard regularly for:
- Email delivery rates
- Bounce/complaint rates
- API usage vs limits
- Domain reputation

## Command Validation & Testing

### Pre-deployment Validation

Before running any AWS CLI commands, validate your setup:

```bash
# 1. Verify AWS CLI v2 is installed
aws --version
# Expected: aws-cli/2.x.x or higher

# 2. Test basic AWS connectivity
aws sts get-caller-identity

# 3. Verify region configuration
echo "Current region: $(aws configure get region)"
echo "Profile: ${AWS_PROFILE:-default}"

# 4. Test Parameter Store permissions (dry run)
aws ssm describe-parameters --max-items 1 --region us-east-1

# 5. Test KMS permissions
aws kms list-aliases --limit 1 --region us-east-1

# 6. Validate date command escaping (should show timestamp)
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Generated timestamp: $TIMESTAMP"
```

### Command Syntax Validation

Test critical commands without side effects:

```bash
# Validate JSON structure (use jq if available)
TEST_JSON='{
  "apiKey": "re_test_key",
  "domain": "bjornmelin.io",
  "fromEmail": "no-reply@bjornmelin.io",
  "version": 1,
  "rotatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}'

# Validate JSON syntax
echo "$TEST_JSON" | python3 -m json.tool > /dev/null && echo "✅ JSON syntax valid" || echo "❌ JSON syntax invalid"

# Test AWS CLI parameter syntax (without creating parameter)
aws ssm describe-parameters \
  --parameter-filters "Key=Type,Values=SecureString" \
  --max-items 1 \
  --region us-east-1 > /dev/null && echo "✅ AWS CLI syntax valid" || echo "❌ AWS CLI syntax invalid"
```

### SSO Authentication Verification

For AWS SSO users:

```bash
# Check SSO session status
aws sts get-caller-identity

# If expired, re-authenticate
# aws sso login --profile your-profile-name

# Verify profile is correctly set
echo "Active profile: ${AWS_PROFILE:-default}"
echo "Account ID: $(aws sts get-caller-identity --query Account --output text)"
echo "User/Role: $(aws sts get-caller-identity --query Arn --output text)"
```

## Troubleshooting

### Diagnostic Commands

Before troubleshooting specific issues, run these diagnostic commands:

```bash
# Check overall system health
echo "=== AWS Configuration ==="
aws sts get-caller-identity
aws configure list

echo "=== Parameter Store Status ==="
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Values=/portfolio/prod/resend/api-key" \
  --region us-east-1

echo "=== KMS Key Status ==="
aws kms describe-key \
  --key-id "alias/prod-portfolio-parameters" \
  --query 'KeyMetadata.{KeyId:KeyId,KeyState:KeyState,KeyRotationStatus:KeyRotationStatus}' \
  --region us-east-1

echo "=== DNS Records ==="
dig TXT bjornmelin.io +short
dig TXT _resend.bjornmelin.io +short
dig TXT resend._domainkey.bjornmelin.io +short
```

### Common Issues and Solutions

#### 1. Domain Verification Failing
**Symptoms**: "Domain not verified" error in Resend dashboard

**Diagnostic Steps**:
```bash
# Check domain verification record
dig TXT _resend.bjornmelin.io +short

# Check global DNS propagation
curl -s "https://dns.google/resolve?name=_resend.bjornmelin.io&type=TXT" | jq .

# Verify SPF record
dig TXT bjornmelin.io +short | grep "v=spf1"
```

**Solutions**:
- Wait up to 48 hours for DNS propagation (usually much faster)
- Verify DNS records are exactly as shown in Resend dashboard
- Use `onboarding@resend.dev` temporarily for testing
- Check for typos in DNS record values
- Ensure TTL is set to 300 seconds or less for faster propagation

#### 2. API Key Errors
**Symptoms**: "Invalid API key" or "Unauthorized" responses

**Diagnostic Steps**:
```bash
# Check if parameter exists and is accessible
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --region us-east-1 \
  --query 'Parameter.{Name:Name,Type:Type,Version:Version,LastModifiedDate:LastModifiedDate}'

# Verify API key format and content
API_KEY=$(aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --with-decryption \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text | jq -r .apiKey)

echo "API Key prefix: ${API_KEY:0:3}"
echo "API Key length: ${#API_KEY}"

# Test API key directly with curl
curl -X GET https://api.resend.com/domains \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"
```

**Solutions**:
- Ensure API key starts with `re_` and is exactly as copied from Resend
- Check for extra spaces, newlines, or hidden characters
- Verify key hasn't been revoked in Resend dashboard
- Ensure Parameter Store has correct JSON format
- Check IAM permissions for parameter access
- Regenerate API key if corrupted during storage

#### 3. Emails Not Delivered
**Symptoms**: Emails sent successfully but not received

**Diagnostic Steps**:
```bash
# Check recent email logs in Resend dashboard
echo "Check Resend dashboard for delivery status and bounce information"

# Test email deliverability with different providers
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "no-reply@bjornmelin.io",
    "to": ["deliverability-test@gmail.com"],
    "subject": "Deliverability Test",
    "text": "Testing email deliverability"
  }'

# Check domain reputation
dig TXT bjornmelin.io +short | grep -E "(spf|dmarc)"
```

**Solutions**:
- Check recipient's spam/junk folders first
- Verify SPF, DKIM, and DMARC records are properly configured
- Review Resend dashboard for bounce/complaint reasons
- Ensure recipient email address is valid and accepting mail
- Check if you've hit rate limits (100 emails/day on free tier)
- Verify "From" address matches verified domain
- Consider implementing DMARC policy for better deliverability
- Monitor domain reputation with third-party tools

#### 4. Parameter Store Access Denied
**Symptoms**: Cannot retrieve API key from Parameter Store

**Diagnostic Steps**:
```bash
# Check current AWS identity
aws sts get-caller-identity

# Test parameter access without decryption first
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --region us-east-1

# Check IAM permissions for current user/role
aws iam simulate-principal-policy \
  --policy-source-arn "$(aws sts get-caller-identity --query 'Arn' --output text)" \
  --action-names "ssm:GetParameter" "kms:Decrypt" \
  --resource-arns "arn:aws:ssm:us-east-1:*:parameter/portfolio/prod/resend/api-key"

# Verify KMS key permissions and status
aws kms describe-key \
  --key-id "alias/prod-portfolio-parameters" \
  --query 'KeyMetadata.{KeyState:KeyState,KeyUsage:KeyUsage}' \
  --region us-east-1
```

**Solutions**:
- Ensure your AWS credentials have the required IAM permissions
- Check that the KMS key policy allows your user/role to decrypt
- Verify the parameter exists in the correct region (us-east-1)
- Ensure you're using the correct parameter path
- Check CloudTrail logs for access denied errors with specific details
- Re-deploy the parameter store stack if IAM policies are corrupted

#### 5. Rate Limiting
**Symptoms**: "Rate limit exceeded" errors from Resend API

**Diagnostic Steps**:
```bash
# Check current usage in Resend dashboard
echo "Log into Resend dashboard to check current usage against limits"

# Review application logs for rate limit patterns
aws logs filter-log-events \
  --log-group-name "/aws/lambda/contact-form" \
  --filter-pattern "rate limit" \
  --start-time $(date -d '1 hour ago' +%s)000

# Test rate limiting behavior
for i in {1..5}; do
  echo "Test email $i"
  node scripts/test-email.mjs
  sleep 2
done
```

**Solutions**:
- **Free tier limits**: 100 emails/day, 3,000 emails/month
- Implement client-side rate limiting in contact form
- Use the built-in retry logic in ResendEmailService
- Monitor usage in Resend dashboard regularly
- Consider upgrading to paid plan if limits are consistently hit
- Add exponential backoff for retry attempts
- Cache successful sends to avoid duplicate submissions

### Debug Commands

```bash
# Check DNS propagation globally
curl "https://dns.google/resolve?name=_resend.bjornmelin.io&type=TXT"

# Test SMTP connection (if using SMTP)
openssl s_client -connect smtp.resend.com:587 -starttls smtp

# View CloudWatch logs
aws logs tail /aws/email-service/prod --follow

# Check Parameter Store history
aws ssm get-parameter-history \
  --name "/portfolio/prod/resend/api-key" \
  --max-items 10
```

## Cost Analysis

### Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| **Resend API** | $0 | Free tier: 3,000 emails/month |
| **Parameter Store** | $0 | Standard parameters free |
| **KMS Encryption** | ~$0.03 | Within free tier |
| **CloudWatch** | ~$0.30 | Minimal logs/metrics |
| **Route 53** | ~$0.50 | Hosted zone (if used) |
| **Total** | **~$0.83/month** | |

### Cost Optimization

1. **Use Parameter Store** instead of Secrets Manager (saves $0.40/month)
2. **Cache API responses** to reduce Parameter Store API calls
3. **Set appropriate log retention** (7 days for non-critical)
4. **Stay within Resend free tier** (3,000 emails/month)

### When to Upgrade

Consider paid tiers when:
- Sending >100 emails/day consistently
- Need higher rate limits
- Require dedicated IPs
- Need advanced analytics

## Security Checklist

- [ ] API key stored in Parameter Store (not in code)
- [ ] KMS encryption enabled for Parameter Store
- [ ] IAM policies follow least privilege
- [ ] CloudTrail logging enabled for audit
- [ ] Environment variables properly configured
- [ ] Domain verified with proper DNS records
- [ ] SPF/DKIM/DMARC configured for deliverability
- [ ] Rate limiting implemented on API endpoint
- [ ] Input validation and sanitization active
- [ ] CSRF protection enabled
- [ ] Quarterly key rotation scheduled

## Implementation Summary

### Quick Start Checklist

For a complete implementation, follow these steps in order:

1. **Prerequisites** ✓
   - [ ] AWS CLI configured with proper permissions
   - [ ] Domain access (Route 53 recommended)
   - [ ] Node.js 20+ and pnpm installed

2. **Resend Setup** ✓
   - [ ] Create Resend account
   - [ ] Add domain to Resend
   - [ ] Generate API key
   - [ ] Copy DNS records (don't add yet)

3. **AWS Infrastructure** ✓
   - [ ] Deploy Parameter Store stack: `pnpm deploy:parameters`
   - [ ] Store API key securely with KMS encryption
   - [ ] Verify parameter access and decryption

4. **DNS Configuration** ✓
   - [ ] Add SPF record: `v=spf1 include:_spf.resend.com ~all`
   - [ ] Add domain verification TXT record
   - [ ] Add DKIM TXT records
   - [ ] (Optional) Add DMARC policy

5. **Local Development** ✓
   - [ ] Create `.env.local` with API key
   - [ ] Test with `node scripts/test-email.mjs`
   - [ ] Test contact form at `localhost:3000`

6. **Production Deployment** ✓
   - [ ] Configure production environment variables
   - [ ] Deploy to Vercel/Netlify/AWS
   - [ ] Test production contact form

7. **Security & Monitoring** ✓
   - [ ] Verify security checklist
   - [ ] Set up CloudWatch monitoring
   - [ ] Configure SNS alerts
   - [ ] Document rotation schedule

### Expected Timeline

- **Initial Setup**: 2-4 hours
- **DNS Propagation**: 5 minutes - 48 hours (usually under 1 hour)
- **Domain Verification**: Immediate after DNS propagation
- **Production Testing**: 30 minutes

### Next Steps

#### Immediate (First Week)
1. **Complete DNS verification** in Resend dashboard
2. **Test end-to-end** email flow in production
3. **Set up monitoring alerts** and SNS notifications
4. **Document the deployed configuration** for team reference

#### Short Term (First Month)  
1. **Monitor email deliverability** and domain reputation
2. **Establish API key rotation schedule** (quarterly recommended)
3. **Set up DMARC reporting** for enhanced security
4. **Create runbook** for troubleshooting common issues

#### Long Term (Ongoing)
1. **Plan for scaling** if email volume increases significantly
2. **Regular security reviews** (quarterly)
3. **Cost optimization** as usage patterns emerge
4. **Consider advanced features** (webhooks, templates, etc.)

### Success Criteria

Your implementation is successful when:

- [ ] ✅ Contact form emails are delivered reliably
- [ ] ✅ All DNS records show as verified in Resend dashboard  
- [ ] ✅ API key is securely stored and accessible via Parameter Store
- [ ] ✅ CloudWatch monitoring shows healthy metrics
- [ ] ✅ Security checklist is 100% complete
- [ ] ✅ Team can troubleshoot issues using this guide
- [ ] ✅ Cost is within expected range (~$0.83/month)

### Scaling Considerations

**When email volume grows beyond free tier:**

1. **Resend Plan Upgrade**:
   - Starter: $20/month (50,000 emails)
   - Pro: $99/month (1,000,000 emails)

2. **AWS Infrastructure Scaling**:
   - Parameter Store remains cost-effective at any scale
   - Consider AWS SES for very high volumes (>1M emails/month)
   - Implement email queuing for burst traffic

3. **Application Scaling**:
   - Add database logging for email audit trail
   - Implement webhook handling for delivery status
   - Consider rate limiting per user/IP for abuse prevention

### Support Resources

- **This Guide**: Comprehensive setup and troubleshooting
- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **AWS Parameter Store Guide**: [AWS Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- **Emergency Contact**: Check Resend dashboard support for urgent issues

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [AWS Parameter Store Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Route 53 DNS Guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

For support or questions, consult the Resend dashboard support chat or AWS documentation.