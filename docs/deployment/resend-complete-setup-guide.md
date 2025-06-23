# Complete Resend API Setup Guide

This comprehensive guide covers all aspects of setting up Resend API for email notifications in the bjornmelin.io portfolio application, including local development, AWS infrastructure, DNS configuration, and production deployment.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Resend Account Setup](#resend-account-setup)
4. [DNS Configuration](#dns-configuration)
5. [AWS Infrastructure Setup](#aws-infrastructure-setup)
6. [Local Development Setup](#local-development-setup)
7. [Testing Configuration](#testing-configuration)
8. [Production Deployment](#production-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Cost Analysis](#cost-analysis)

## Overview

The portfolio application uses Resend API for handling contact form submissions. This implementation includes:

- **Service**: Resend API (TypeScript SDK)
- **Infrastructure**: AWS Parameter Store for secure API key storage
- **DNS**: Route 53 for email authentication records
- **Security**: CSRF protection, rate limiting, input validation
- **Cost**: $0/month (free tier: 3,000 emails/month)

## Prerequisites

Before starting, ensure you have:

- [ ] AWS CLI configured with appropriate permissions
- [ ] Access to your domain's DNS settings (Route 53 or external provider)
- [ ] Node.js 20+ and pnpm installed
- [ ] Git repository cloned locally

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
2. **DKIM Records**: 2-3 CNAME records for email authentication
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
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "xxxxx.dkim.resend.com"
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
Type: CNAME
Name: resend._domainkey
Value: xxxxx.dkim.resend.com (from Resend dashboard)
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
dig CNAME resend._domainkey.bjornmelin.io +short
```

Return to Resend dashboard - records should show as verified within 48 hours (usually much faster).

## AWS Infrastructure Setup

### Step 1: Deploy Parameter Store Stack

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
pnpm install

# Deploy the parameter store stack
pnpm deploy:parameters
```

This creates:
- Customer-managed KMS key for encryption
- Parameter Store structure for API keys
- IAM policies for secure access
- CloudTrail logging for audit

### Step 2: Store Resend API Key

```bash
# Store your Resend API key securely
aws ssm put-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --value '{
    "apiKey": "re_YOUR_ACTUAL_API_KEY_HERE",
    "domain": "bjornmelin.io",
    "fromEmail": "no-reply@bjornmelin.io",
    "version": 1,
    "rotatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' \
  --type SecureString \
  --key-id "alias/prod-portfolio-parameters" \
  --region us-east-1 \
  --overwrite \
  --description "Resend API configuration for portfolio contact form"
```

### Step 3: Verify Parameter Storage

```bash
# Verify the parameter was created (won't show actual value)
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Values=/portfolio/prod/resend/api-key" \
  --region us-east-1

# Test decryption (will show the actual value)
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --with-decryption \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text | jq .
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
    { name: "resend._domainkey", value: "xxxxx.dkim.resend.com" },
    { name: "resend2._domainkey", value: "yyyyy.dkim.resend.com" },
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
   aws ssm put-parameter \
     --name "/portfolio/prod/resend/api-key" \
     --value '{
       "apiKey": "re_NEW_API_KEY_HERE",
       "domain": "bjornmelin.io",
       "fromEmail": "no-reply@bjornmelin.io",
       "version": 2,
       "rotatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
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

## Troubleshooting

### Common Issues and Solutions

#### 1. Domain Verification Failing
**Symptoms**: "Domain not verified" error
**Solutions**:
- Wait up to 48 hours for DNS propagation
- Verify DNS records are exactly as shown in Resend
- Use `onboarding@resend.dev` temporarily for testing
- Check for typos in DNS record values

#### 2. API Key Errors
**Symptoms**: "Invalid API key" or "Unauthorized"
**Solutions**:
```bash
# Verify API key in Parameter Store
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --with-decryption \
  --region us-east-1

# Check API key format (should start with re_)
# Ensure no extra spaces or characters
# Verify key hasn't been revoked in Resend dashboard
```

#### 3. Emails Not Delivered
**Symptoms**: Emails sent but not received
**Solutions**:
- Check spam/junk folders
- Verify SPF/DKIM records are properly configured
- Review Resend dashboard for bounce reasons
- Ensure recipient email is correct
- Check if you've hit rate limits (100/day free tier)

#### 4. Parameter Store Access Denied
**Symptoms**: Cannot retrieve API key from Parameter Store
**Solutions**:
```bash
# Check IAM permissions
aws iam get-role-policy \
  --role-name YOUR_ROLE_NAME \
  --policy-name YOUR_POLICY_NAME

# Verify KMS key permissions
aws kms describe-key \
  --key-id "alias/prod-portfolio-parameters"

# Test parameter access
aws ssm get-parameter \
  --name "/portfolio/prod/resend/api-key" \
  --with-decryption
```

#### 5. Rate Limiting
**Symptoms**: "Rate limit exceeded" errors
**Solutions**:
- Free tier: 100 emails/day, 3,000/month
- Implement client-side rate limiting
- Add retry logic (already in service)
- Consider upgrading Resend plan
- Monitor usage in Resend dashboard

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

## Next Steps

1. **Complete DNS verification** in Resend dashboard
2. **Test end-to-end** email flow
3. **Set up monitoring alerts**
4. **Document rotation schedule**
5. **Plan for scaling** if needed

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [AWS Parameter Store Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Route 53 DNS Guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

For support or questions, consult the Resend dashboard support chat or AWS documentation.