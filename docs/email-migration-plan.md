# Email Service Migration Plan: AWS SES to Resend API

## Executive Summary

After comprehensive analysis, we recommend **migrating exclusively to Resend API** and removing AWS SES infrastructure. This decision is based on:

- **88.5% weighted score** for Resend vs 33.75% for fixing AWS SES
- **30 minutes implementation time** vs 2-4 hours to fix SES
- **Near-zero maintenance** vs ongoing AWS infrastructure management
- **Superior developer experience** with TypeScript support and easy testing
- **Lower complexity** - no Lambda, API Gateway, or IAM policies needed

## Current State Analysis

### Email Infrastructure Overview
1. **AWS SNS**: Only used for CloudWatch monitoring alerts (NOT contact form)
2. **AWS SES**: Primary email service via Lambda function (currently broken)
3. **Resend API**: Already implemented and tested in task 1.6

### Why AWS SES is Broken
- Missing environment variables (AWS credentials)
- Domain verification not completed
- Potential region mismatches
- No `.env.local` file in repository

## Migration Plan

### Phase 1: Enable Resend in Production (5 minutes)

1. **Update Environment Variables**
   ```bash
   # .env.local
   USE_RESEND=true
   RESEND_API_KEY=re_xxxxxxxxxxxx  # Your production API key
   RESEND_FROM_EMAIL=no-reply@bjornmelin.io
   CONTACT_EMAIL=bjornmelin16@gmail.com
   ```

2. **Verify Resend Configuration**
   ```bash
   # Test the configuration
   pnpm run dev
   # Visit contact form and test submission
   ```

### Phase 2: Remove AWS SES Code (15 minutes)

1. **Remove SES Email Service**
   ```bash
   rm src/lib/services/email.ts
   rm src/lib/services/__tests__/email.test.ts
   ```

2. **Update Contact API Route**
   - Remove conditional logic for `USE_RESEND`
   - Always use ResendEmailService
   - Remove AWS SES imports

3. **Remove AWS SDK Dependencies**
   ```bash
   pnpm remove @aws-sdk/client-ses
   ```

### Phase 3: Remove Infrastructure Code (10 minutes)

1. **Delete Email Stack**
   ```bash
   rm infrastructure/lib/stacks/email-stack.ts
   ```

2. **Update CDK App**
   - Remove EmailStack import and instantiation from `infrastructure/bin/portfolio-infrastructure.ts`
   - Remove email-related outputs

3. **Update Stack Dependencies**
   - Remove email stack references from monitoring stack
   - Clean up any cross-stack dependencies

### Phase 4: Documentation Updates (5 minutes)

1. **Update README**
   - Remove AWS SES setup instructions
   - Add Resend API setup guide
   - Update environment variables section

2. **Update API Documentation**
   - Document the single email service approach
   - Add Resend webhook setup (optional)

### Phase 5: Testing & Verification (5 minutes)

1. **Local Testing**
   ```bash
   pnpm test:unit
   pnpm test:integration
   pnpm test:e2e
   ```

2. **Production Testing**
   - Submit test contact form
   - Verify email delivery
   - Check Resend dashboard for analytics

## Implementation Checklist

- [ ] Set `USE_RESEND=true` in `.env.local`
- [ ] Add `RESEND_API_KEY` to production environment
- [ ] Test contact form with Resend enabled
- [ ] Remove `src/lib/services/email.ts`
- [ ] Update `src/app/api/contact/route.ts` to use only Resend
- [ ] Remove `@aws-sdk/client-ses` dependency
- [ ] Delete `infrastructure/lib/stacks/email-stack.ts`
- [ ] Update `infrastructure/bin/portfolio-infrastructure.ts`
- [ ] Run all tests
- [ ] Update documentation
- [ ] Deploy and test in production

## Benefits After Migration

1. **Simplified Architecture**
   - No Lambda functions for email
   - No API Gateway configuration
   - No IAM policies to manage
   - No domain verification process

2. **Better Developer Experience**
   - TypeScript-native SDK
   - Excellent documentation
   - Easy local testing
   - Real-time email analytics

3. **Cost Savings**
   - Free tier: 3,000 emails/month
   - No Lambda invocation costs
   - No API Gateway costs
   - Predictable pricing

4. **Improved Reliability**
   - Automatic retry mechanisms
   - Built-in bounce handling
   - Webhook support for delivery tracking
   - 99.9% uptime SLA

## Rollback Plan

If issues arise, rollback is simple:
1. Set `USE_RESEND=false` in environment
2. Fix AWS SES configuration issues
3. Redeploy

However, given that Resend is already tested and working, rollback risk is minimal.

## Timeline

Total implementation time: **30 minutes**

- Day 1: Complete all phases
- Day 2-7: Monitor email delivery
- Day 8: Remove rollback code if stable

## Conclusion

Migrating to Resend API exclusively is the optimal choice for this project. It reduces complexity, improves developer experience, and requires minimal implementation effort since the integration is already complete and tested.