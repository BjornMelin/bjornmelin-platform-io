# AWS Email Infrastructure Implementation Guide

## Overview

This guide provides a comprehensive plan for implementing secure email service integration for bjornmelin.io using AWS CDK v2, Secrets Manager, and Route 53.

## Architecture Overview

The email infrastructure consists of:

1. **Secrets Management Stack**: AWS Secrets Manager with KMS encryption for API keys
2. **Email Configuration Stack**: Route 53 DNS records for email authentication
3. **Monitoring & Compliance**: CloudWatch dashboards and CloudTrail audit logging
4. **Automatic Rotation**: Lambda-based API key rotation every 90 days

## Current State Analysis

### Existing Infrastructure
- **CDK Version**: v2.189.1 (latest as of implementation)
- **Stacks**: DNS, Storage, Deployment, Monitoring
- **Domain**: bjornmelin.io (hosted zone exists in Route 53)
- **Missing**: Secrets management and email service configuration

### Gap Analysis
- No centralized secrets management
- No email service DNS records (SPF, DKIM)
- No automatic secret rotation
- No audit logging for secrets access

## Implementation Plan

### Phase 1: Infrastructure Setup (Day 1)

#### 1.1 Deploy Secrets Stack
```bash
cd infrastructure
pnpm install
pnpm run build
pnpm run deploy:secrets
```

This creates:
- Customer-managed KMS key with rotation
- Secrets Manager secret for Resend API key
- IAM policies for least-privilege access
- CloudTrail logging integration

#### 1.2 Add Resend API Key
After stack deployment:
```bash
# Get the secret ARN from CloudFormation outputs
aws secretsmanager update-secret \
  --secret-id "prod/portfolio/resend-api-key" \
  --secret-string '{
    "apiKey": "re_YOUR_ACTUAL_API_KEY",
    "domain": "bjornmelin.io",
    "fromEmail": "noreply@bjornmelin.io"
  }'
```

### Phase 2: Email Service Configuration (Day 1-2)

#### 2.1 Add Domain to Resend
1. Log into Resend dashboard
2. Add domain: bjornmelin.io
3. Copy verification values:
   - Domain verification TXT record
   - DKIM CNAME records (usually 2-3 records)

#### 2.2 Update Email Stack Configuration
Update `bin/app.ts` with actual values:
```typescript
const emailStack = new EmailStack(app, getStackName("email", "prod"), {
  // ... existing config
  resendDomainVerification: "resend-verification-xxxxx",
  resendDkimRecords: [
    { name: "resend._domainkey", value: "xxxxx.dkim.resend.com" },
    { name: "resend2._domainkey", value: "xxxxx.dkim.resend.com" },
  ],
});
```

#### 2.3 Deploy Email Stack
```bash
pnpm run deploy:email
```

This creates:
- SPF record: `v=spf1 include:_spf.resend.com ~all`
- Domain verification TXT record
- DKIM CNAME records
- CloudWatch monitoring dashboard
- SNS topic for alarms

### Phase 3: Application Integration (Day 2-3)

#### 3.1 Update Lambda Functions
Example integration for contact form handler:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Resend } from "resend";

const secretsClient = new SecretsManagerClient({});
let cachedSecret: { apiKey: string; domain: string; fromEmail: string } | null = null;
let cacheExpiry = 0;

async function getResendConfig() {
  const now = Date.now();
  if (cachedSecret && now < cacheExpiry) {
    return cachedSecret;
  }

  const command = new GetSecretValueCommand({
    SecretId: process.env.RESEND_SECRET_ARN,
  });
  
  const response = await secretsClient.send(command);
  cachedSecret = JSON.parse(response.SecretString!);
  cacheExpiry = now + 3600000; // Cache for 1 hour
  
  return cachedSecret;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const config = await getResendConfig();
  const resend = new Resend(config.apiKey);
  
  return await resend.emails.send({
    from: config.fromEmail,
    to,
    subject,
    html,
  });
}
```

#### 3.2 Update Lambda Environment Variables
```typescript
const contactLambda = new lambda.Function(this, "ContactFormHandler", {
  // ... existing config
  environment: {
    RESEND_SECRET_ARN: secretsStack.resendApiKeySecret.secretArn,
  },
});

// Grant read access to the secret
secretsStack.resendApiKeySecret.grantRead(contactLambda);
```

### Phase 4: Monitoring & Rotation (Day 3-4)

#### 4.1 Set Up Monitoring
1. Access CloudWatch Dashboard: `prod-portfolio-email-dashboard`
2. Configure SNS email notifications:
```bash
aws sns subscribe \
  --topic-arn "arn:aws:sns:region:account:prod-portfolio-email-alarms" \
  --protocol email \
  --notification-endpoint your-email@example.com
```

#### 4.2 Test Rotation
```bash
# Manually trigger rotation to test
aws secretsmanager rotate-secret \
  --secret-id "prod/portfolio/resend-api-key" \
  --rotation-lambda-arn "arn:aws:lambda:region:account:function:RotationLambda"
```

## Security Checklist

- [x] No hardcoded secrets in code
- [x] Encryption at rest using customer-managed KMS key
- [x] Encryption in transit (TLS/HTTPS only)
- [x] Least privilege IAM policies
- [x] Audit logging via CloudTrail
- [x] Automatic rotation capability
- [x] Secret versioning enabled
- [x] CloudWatch alarms for unusual access patterns
- [x] KMS key rotation enabled
- [x] Retention policy on KMS key (30 days)

## Cost Analysis

### Monthly Costs (Production)
- **Secrets Manager**: $0.40 per secret
- **API Calls**: ~$0.01 (1000 calls @ $0.05/10k)
- **KMS**: $1.00 per key + $0.03/10k requests
- **Lambda Rotation**: ~$0.01 (minimal invocations)
- **CloudWatch**: ~$0.50 (logs, metrics, dashboard)
- **Total**: ~$2.00/month

### Cost Optimization
- Single secret with JSON structure (vs multiple secrets)
- Caching in Lambda functions (reduce API calls)
- Appropriate log retention periods

## DNS Records Reference

### SPF Record
```
Type: TXT
Name: bjornmelin.io
Value: "v=spf1 include:_spf.resend.com ~all"
TTL: 300
```

### DKIM Records (Example)
```
Type: CNAME
Name: resend._domainkey.bjornmelin.io
Value: xxxxx.dkim.resend.com
TTL: 300
```

### Domain Verification
```
Type: TXT
Name: _resend.bjornmelin.io
Value: "resend-verification-xxxxx"
TTL: 300
```

## Troubleshooting

### Common Issues

1. **Secret Access Denied**
   - Check IAM role has the managed policy attached
   - Verify KMS key permissions
   - Ensure correct secret ARN in environment variables

2. **Email Delivery Issues**
   - Verify all DNS records are properly configured
   - Check domain verification status in Resend dashboard
   - Review SPF/DKIM alignment

3. **Rotation Failures**
   - Check Lambda function logs in CloudWatch
   - Verify Resend API key has permission to create new keys
   - Ensure Lambda has internet access (NAT Gateway if in VPC)

## Migration Rollback Plan

If issues arise:

1. **Immediate Rollback**:
   ```bash
   # Revert to previous secret version
   aws secretsmanager update-secret-version-stage \
     --secret-id "prod/portfolio/resend-api-key" \
     --version-stage AWSCURRENT \
     --move-to-version-id "previous-version-id"
   ```

2. **Stack Rollback**:
   ```bash
   # Delete stacks in reverse order
   pnpm run destroy:email
   pnpm run destroy:secrets
   ```

## Next Steps

1. Implement email templates with Resend
2. Add email analytics and tracking
3. Implement bounce/complaint handling
4. Set up email rate limiting
5. Add support for transactional emails
6. Implement email queue with SQS for reliability

## References

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Route 53 DNS Record Types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)
- [Resend Documentation](https://resend.com/docs)
- [AWS CDK v2 API Reference](https://docs.aws.amazon.com/cdk/api/v2/)