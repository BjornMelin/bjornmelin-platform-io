# ADR-001: Keep Resend for Email Service

## Date

2025-01-23

## Status

Accepted

## Context

After implementing a contact form using Resend for email delivery, we considered migrating to AWS SES as part of a broader AWS architecture. This decision arose from:

- A desire to demonstrate AWS expertise in the portfolio
- Consideration of future scalability needs
- Security concerns that needed addressing (CSRF protection, rate limiting)

However, analysis revealed that the portfolio receives approximately 10-50 visitors monthly, resulting in only 10-20 emails sent per month (including confirmations). This is 0.3-0.7% of Resend's free tier limit of 3,000 emails/month.

## Decision Drivers

- **Actual Volume**: 10-20 emails/month vs 3,000 free tier limit
- **Complexity Cost**: AWS requires 6+ services vs 1 with Resend
- **Time Investment**: 3 weeks for AWS migration vs 2 days for security fixes
- **Operational Overhead**: Managing IAM, monitoring, cost alerts vs single API key
- **Financial Impact**: $0/month with Resend vs $14+/month with AWS after free tier
- **YAGNI Principle**: No evidence we'll need AWS's scale
- **Portfolio Purpose**: Demonstrate good architectural judgment

## Considered Options

### Option 1: Keep Resend (Chosen)
Continue using Resend with security enhancements:
- Fix CSRF protection
- Improve rate limiting
- Enhance input validation
- Add monitoring through Resend dashboard

### Option 2: Migrate to AWS
Implement full AWS architecture:
- API Gateway → Lambda → SES
- Parameter Store for configuration
- CloudWatch for monitoring
- Redis/ElastiCache for rate limiting
- Full CDK infrastructure

### Option 3: Hybrid Approach
Keep Resend but add AWS monitoring:
- Continue using Resend for email
- Add CloudWatch for custom metrics
- Use Parameter Store for secrets

## Decision

We will keep Resend as our email service provider and focus on implementing security best practices within our existing architecture.

Specifically, we will:
1. Maintain the current Resend integration
2. Fix CSRF token validation in the contact form
3. Enhance the in-memory rate limiter with better cleanup
4. Add DOMPurify for input sanitization
5. Monitor usage through Resend's built-in dashboard
6. Store API keys in environment variables (already implemented)

## Consequences

### Positive

- **Immediate Security**: Fix critical issues in 2 days instead of 3 weeks
- **Zero Cost**: Stay within free tier indefinitely at current scale
- **Simplicity**: One service to monitor, one API key to manage
- **Maintainability**: Future developers understand the system immediately
- **Reliability**: Fewer moving parts means fewer failure points
- **Focus**: Time saved can be invested in actual features

### Negative

- **Learning Opportunity**: Less hands-on AWS experience
- **Scale Limitations**: Would need migration if we exceed 3,000 emails/month
- **Feature Set**: Fewer advanced email features (though unused currently)

### Risks and Mitigations

- **Risk**: Resend service disruption
  - **Mitigation**: Implement proper error handling and user feedback
  - **Mitigation**: Monitor service status and have AWS migration plan ready

- **Risk**: Exceeding free tier limits
  - **Mitigation**: Set up usage alerts at 80% of limit
  - **Mitigation**: Document AWS migration path for future reference

## Validation

We will validate this decision by monitoring:

- **Email Delivery Rate**: Should remain >95%
- **Monthly Volume**: Confirm staying well under 3,000 emails
- **Error Rate**: Monitor failed email attempts
- **User Feedback**: Track contact form success
- **Development Time**: Complete security fixes in 2 days

Review after 6 months to confirm volume assumptions remain valid.

## Implementation Example

```typescript
// Current simple implementation that works
await resend.emails.send({
  from: 'Contact Form <onboarding@resend.dev>',
  to: process.env.CONTACT_EMAIL!,
  subject: `New Contact: ${data.subject}`,
  react: ContactEmailTemplate({ ...data }),
});

// vs. AWS implementation requiring:
// - Lambda function setup
// - IAM roles and policies  
// - SES domain verification
// - Parameter Store setup
// - CloudWatch configuration
// - Error handling for each service
```

## References

- [ARCHITECTURE-COMPARISON.md](../../ARCHITECTURE-COMPARISON.md) - Detailed comparison
- [REASSESSMENT-SUMMARY.md](../../REASSESSMENT-SUMMARY.md) - Decision analysis
- [Resend Documentation](https://resend.com/docs)
- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)

## Notes

This decision exemplifies choosing the right tool for the job. A portfolio website is not a SaaS product—it's a demonstration of judgment. Good architecture means solving the actual problem, not the imagined future problem.

The AWS architecture would be appropriate for a product expecting thousands of users. For a portfolio, it's over-engineering that demonstrates poor judgment rather than expertise.