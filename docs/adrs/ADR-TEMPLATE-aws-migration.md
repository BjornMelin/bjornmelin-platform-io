# ADR-XXX: Migrate to AWS Email Infrastructure (TEMPLATE)

> **Note**: This is a template ADR for future reference if email volume exceeds Resend's free tier.

## Date

YYYY-MM-DD

## Status

Template (Not Proposed)

## Context

This template documents how we would approach migrating to AWS if our email volume exceeds 3,000 emails/month (Resend's free tier limit).

Current indicators that would trigger this decision:
- Email volume consistently above 2,400/month (80% of limit)
- Need for advanced email features (templates, analytics, campaigns)
- Requirement for multi-region email delivery
- Integration with other AWS services becomes necessary

## Decision Drivers

When this decision becomes relevant, consider:

- **Volume**: Actual monthly email count
- **Cost**: Resend paid tiers vs AWS SES pricing
- **Features**: Required email capabilities
- **Complexity**: Team size and AWS expertise
- **Integration**: Other AWS services in use

## Considered Options

### Option 1: Upgrade Resend Plan
- Pro tier: $20/month for 50,000 emails
- Simple upgrade path
- No architectural changes

### Option 2: Migrate to AWS SES
- $0.10 per 1,000 emails
- Requires Lambda, monitoring setup
- More complex but more flexible

### Option 3: Alternative Services
- SendGrid, Mailgun, Postmark
- Evaluate based on current needs

## Decision

[To be filled when decision is needed]

## Implementation Approach

If AWS migration is chosen:

1. **Phase 1**: Set up AWS infrastructure
   - SES domain verification
   - Lambda function for email sending
   - CloudWatch monitoring

2. **Phase 2**: Parallel running
   - Route percentage of emails through AWS
   - Monitor deliverability
   - Compare costs

3. **Phase 3**: Migration
   - Switch all email traffic
   - Decommission Resend
   - Update documentation

## Validation Criteria

- Email delivery rate maintained above 95%
- No increase in bounce rate
- Cost remains predictable
- Monitoring and alerting functional

## References

- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)
- [Original Architecture Comparison](../../ARCHITECTURE-COMPARISON.md)
- [ADR-001](./ADR-001-keep-resend-for-email.md) - Original decision to use Resend