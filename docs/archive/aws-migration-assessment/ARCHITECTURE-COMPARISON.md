# Architecture Comparison: Complex AWS vs Simple Resend

> **Note**: This analysis has been formalized into [ADR-001: Keep Resend for Email Service](./docs/adrs/ADR-001-keep-resend-for-email.md). Please refer to the ADR for the official architectural decision.

## Side-by-Side Comparison

| Aspect | Complex AWS Approach | Simple Resend Approach | Winner |
|--------|---------------------|----------------------|---------|
| **Email Service** | AWS SES | Resend | Resend ✅ |
| **Compute** | AWS Lambda | Vercel API Routes | Vercel ✅ |
| **Rate Limiting** | Redis/ElastiCache ($13+/mo) | In-memory Map | Simple ✅ |
| **Config Storage** | AWS Parameter Store | Environment Variables | Simple ✅ |
| **Monitoring** | CloudWatch + Dashboards | Vercel Logs + Resend Dashboard | Simple ✅ |
| **Infrastructure** | AWS CDK | None needed | Simple ✅ |
| **Implementation Time** | 3 weeks | 2 days | Simple ✅ |
| **Monthly Cost** | $5-20 (after free tier) | $0 | Simple ✅ |
| **Services to Manage** | 6+ AWS services | 2 (Vercel + Resend) | Simple ✅ |
| **Operational Overhead** | High | Minimal | Simple ✅ |

## Detailed Analysis

### Email Volume Reality Check

```yaml
Expected Portfolio Traffic:
  Monthly Visitors: 10-50
  Contact Form Submissions: 5-10
  Emails Sent: 10-20 (with confirmations)
  
Service Limits:
  Resend Free Tier: 3,000 emails/month
  Usage Percentage: 0.3% - 0.7%
  
  AWS SES Free Tier: 3,000 emails/month (12 months only)
  After Free Tier: $0.10 per 1,000 emails
```

### Complexity Comparison

#### Complex AWS Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Contact Form   │────▶│   API Gateway   │────▶│  AWS Lambda     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                ┌─────────────────────────┼─────────────────────────┐
                                │                         │                         │
                                ▼                         ▼                         ▼
                        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
                        │   AWS SES    │        │ Parameter    │        │  CloudWatch  │
                        │              │        │   Store      │        │   Metrics    │
                        └──────────────┘        └──────────────┘        └──────────────┘
                                                          │
                                                          ▼
                                                ┌──────────────┐
                                                │ Redis/Upstash│
                                                │(Rate Limit)  │
                                                └──────────────┘
```

#### Simple Resend Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Contact Form   │────▶│ Vercel API Route│────▶│     Resend      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  In-Memory   │
                        │ Rate Limiter │
                        └──────────────┘
```

### Cost Breakdown

#### AWS Approach (After 12-month Free Tier)
```
Monthly Costs:
- AWS Lambda: $0 (within always-free tier)
- AWS SES: $0.01 (10 emails × $0.10/1000)
- CloudWatch Logs: $0.50 (minimal logging)
- CloudWatch Metrics: $0.30 (first 10 metrics free)
- Parameter Store: $0 (standard parameters free)
- Redis/ElastiCache: $13+ (no free tier)
- Total: ~$14/month

Hidden Costs:
- 3 weeks development time
- AWS account management
- Monitoring and maintenance
- Debugging distributed systems
```

#### Simple Approach
```
Monthly Costs:
- Resend: $0 (3,000 free emails/month)
- Vercel: $0 (hobby tier sufficient)
- Total: $0/month

Hidden Costs:
- 2 days development time
- That's it.
```

### Maintenance Burden

#### AWS Approach - Things That Can Break:
1. Lambda cold starts affecting performance
2. IAM permissions between services
3. SES domain verification expiring
4. Parameter Store access issues
5. CloudWatch log retention costs
6. Redis connection failures
7. API Gateway throttling
8. Lambda timeout issues
9. VPC configuration (if used)
10. Cost overruns from misconfigurartion

#### Simple Approach - Things That Can Break:
1. Resend API key expiring
2. Rate limit memory leak (easily fixed)
3. That's it.

### Skills Demonstration Comparison

#### What AWS Approach Shows:
- ❌ Poor architectural judgment
- ❌ Tendency to over-engineer
- ✅ Knowledge of AWS services
- ❌ Ignoring YAGNI principle
- ❌ Adding complexity without benefit

#### What Simple Approach Shows:
- ✅ Pragmatic problem-solving
- ✅ Understanding of actual requirements
- ✅ Security best practices (CSRF, rate limiting)
- ✅ Clean, maintainable code
- ✅ Wise architectural decisions

### When Each Approach Makes Sense

#### Use AWS Approach When:
- Sending 100,000+ emails/month
- Need complex email workflows
- Require detailed analytics
- Have dedicated DevOps team
- Building enterprise SaaS

#### Use Simple Approach When:
- Building a portfolio website ✅
- Sending <1,000 emails/month ✅
- Want minimal maintenance ✅
- Value simplicity ✅
- Need to ship quickly ✅

## Final Verdict

For a portfolio website contact form handling 10 emails per month, the AWS approach is like:
- Using a semi-truck to deliver a pizza
- Building a factory to make one sandwich
- Hiring a construction crew to hang a picture

**The simple approach wins in every meaningful metric for this use case.**

## Quotes from Experienced Developers

> "The best code is no code. The second best is simple code." - Every senior developer

> "Complexity is the enemy of reliability." - Anonymous

> "YAGNI - You Aren't Gonna Need It" - Extreme Programming principle

> "Make it work, make it right, make it fast - in that order." - Kent Beck

The simple Resend approach makes it work and makes it right. The AWS approach makes it complex.