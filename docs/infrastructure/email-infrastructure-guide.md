# AWS Email Infrastructure Implementation Guide

## Overview

This guide provides a comprehensive plan for implementing secure email service integration for bjornmelin.io using AWS CDK v2, Systems Manager Parameter Store, and Route 53.

## Architecture Overview

The email infrastructure consists of:

1. **Secrets Management Stack**: AWS Systems Manager Parameter Store with KMS encryption for API keys
2. **Email Configuration Stack**: Route 53 DNS records for email authentication
3. **Monitoring & Compliance**: CloudWatch dashboards and CloudTrail audit logging
4. **Automatic Rotation**: Lambda-based API key rotation every 90 days

## Current State Analysis

### Existing Infrastructure
- **CDK Version**: v2.189.1 (latest as of implementation)
- **Stacks**: DNS, Storage, Deployment, Monitoring
- **Domain**: bjornmelin.io (hosted zone exists in Route 53)
- **Missing**: Parameter store configuration and email service setup

### Gap Analysis
- No centralized parameter/secrets management
- No email service DNS records (SPF, DKIM)
- No automatic secret rotation
- No audit logging for secrets access

## Implementation Plan

### Phase 1: Infrastructure Setup (Day 1)

#### 1.1 Deploy Parameter Store Configuration
```bash
cd infrastructure
pnpm install
pnpm run build
pnpm run deploy:parameters
```

This creates:
- Customer-managed KMS key with rotation
- Parameter Store SecureString parameter for Resend API key
- IAM policies for least-privilege access
- CloudTrail logging integration

#### 1.2 Add Resend API Key
After stack deployment:
```bash
# Store the parameter value
aws ssm put-parameter \
  --name "/prod/portfolio/resend-api-key" \
  --value '{
    "apiKey": "re_YOUR_ACTUAL_API_KEY",
    "domain": "bjornmelin.io",
    "fromEmail": "noreply@bjornmelin.io"
  }' \
  --type SecureString \
  --key-id "alias/portfolio-kms-key" \
  --description "Resend API configuration" \
  --overwrite
```

### Phase 2: Email Service Configuration (Day 1-2)

#### 2.1 Add Domain to Resend
1. Log into Resend dashboard
2. Add domain: bjornmelin.io
3. Copy verification values:
   - Domain verification TXT record
   - DKIM TXT records (usually 2-3 records)

#### 2.2 Update Email Stack Configuration
Update `bin/app.ts` with actual values:
```typescript
const emailStack = new EmailStack(app, getStackName("email", "prod"), {
  // ... existing config
  resendDomainVerification: "resend-verification-xxxxx",
  resendDkimRecords: [
    { name: "resend._domainkey", value: "k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND" },
    { name: "resend2._domainkey", value: "k=rsa; p=SECOND_DKIM_PUBLIC_KEY_FROM_RESEND" },
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
- DKIM TXT records
- CloudWatch monitoring dashboard
- SNS topic for alarms

### Phase 3: Application Integration (Day 2-3)

#### 3.1 Update Lambda Functions
Example integration for contact form handler:

```typescript
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Resend } from "resend";

const ssmClient = new SSMClient({});
let cachedConfig: { apiKey: string; domain: string; fromEmail: string } | null = null;
let cacheExpiry = 0;

async function getResendConfig() {
  const now = Date.now();
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig;
  }

  const command = new GetParameterCommand({
    Name: process.env.RESEND_PARAMETER_NAME,
    WithDecryption: true
  });
  
  const response = await ssmClient.send(command);
  cachedConfig = JSON.parse(response.Parameter!.Value!);
  cacheExpiry = now + 3600000; // Cache for 1 hour
  
  return cachedConfig;
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
    RESEND_PARAMETER_NAME: "/prod/portfolio/resend-api-key",
  },
});

// Grant read access to the parameter
contactLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ["ssm:GetParameter"],
  resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/prod/portfolio/resend-api-key`],
}));

// Grant KMS decrypt permissions
contactLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ["kms:Decrypt"],
  resources: [kmsKey.keyArn],
  conditions: {
    StringEquals: {
      "kms:ViaService": `ssm.${this.region}.amazonaws.com`
    }
  }
}));
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

#### 4.2 Manual Rotation Process
Since Parameter Store doesn't support automatic rotation, implement a quarterly manual rotation:
```bash
# Update parameter with new API key
aws ssm put-parameter \
  --name "/prod/portfolio/resend-api-key" \
  --value '{
    "apiKey": "re_NEW_API_KEY",
    "domain": "bjornmelin.io",
    "fromEmail": "noreply@bjornmelin.io"
  }' \
  --type SecureString \
  --key-id "alias/portfolio-kms-key" \
  --overwrite
```

## Security Checklist

- [x] No hardcoded secrets in code
- [x] Encryption at rest using customer-managed KMS key
- [x] Encryption in transit (TLS/HTTPS only)
- [x] Least privilege IAM policies
- [x] Audit logging via CloudTrail
- [x] Manual rotation process documented
- [x] Parameter history maintained
- [x] CloudWatch alarms for unusual access patterns
- [x] KMS key rotation enabled
- [x] Retention policy on KMS key (30 days)

## Cost Analysis

### Monthly Costs (Production)
- **Parameter Store**: $0.00 (standard parameters free)
- **API Calls**: $0.00 (standard throughput free)
- **KMS**: $1.00 per key + $0.03/10k requests
- **CloudWatch**: ~$0.30 (logs, metrics, dashboard)
- **Total**: ~$1.33/month

### Cost Optimization
- Free Parameter Store vs paid Secrets Manager ($0.40/month savings)
- Single parameter with JSON structure
- Aggressive caching in Lambda functions (reduce API calls)
- Optimized log retention periods (3 days for non-critical)

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
Type: TXT
Name: resend._domainkey.bjornmelin.io
Value: "k=rsa; p=DKIM_PUBLIC_KEY_FROM_RESEND"
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

1. **Parameter Access Denied**
   - Check IAM role has ssm:GetParameter permission
   - Verify KMS decrypt permissions with ViaService condition
   - Ensure correct parameter name in environment variables

2. **Email Delivery Issues**
   - Verify all DNS records are properly configured
   - Check domain verification status in Resend dashboard
   - Review SPF/DKIM alignment

3. **Manual Rotation Process**
   - Update parameter value in Parameter Store
   - Update Resend dashboard with new API key
   - Test email delivery after rotation
   - Document rotation date and new key version

## Migration Rollback Plan

If issues arise:

1. **Immediate Rollback**:
   ```bash
   # Parameter Store maintains history - revert if needed
   # First, get the previous value
   aws ssm get-parameter-history \
     --name "/prod/portfolio/resend-api-key" \
     --with-decryption
   
   # Then restore previous value
   aws ssm put-parameter \
     --name "/prod/portfolio/resend-api-key" \
     --value 'PREVIOUS_VALUE' \
     --type SecureString \
     --overwrite
   ```

2. **Stack Rollback**:
   ```bash
   # Delete stacks in reverse order
   pnpm run destroy:email
   pnpm run destroy:parameters
   ```

## Next Steps

1. Implement email templates with Resend
2. Add email analytics and tracking
3. Implement bounce/complaint handling
4. Set up email rate limiting
5. Add support for transactional emails
6. Implement email queue with SQS for reliability

## References

- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Parameter Store Best Practices](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-best-practices.html)
- [Route 53 DNS Record Types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)
- [Resend Documentation](https://resend.com/docs)
- [AWS CDK v2 API Reference](https://docs.aws.amazon.com/cdk/api/v2/)