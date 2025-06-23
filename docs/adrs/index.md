# Architecture Decision Records Index

## Overview

This index provides a quick reference to all Architecture Decision Records (ADRs) in the project. ADRs document significant architectural decisions and their rationale.

## ADR List

| ADR | Title | Status | Date | Summary |
|-----|-------|--------|------|---------|
| [ADR-001](./ADR-001-keep-resend-for-email.md) | Keep Resend for Email Service | Accepted | 2025-01-23 | Decided to keep Resend instead of migrating to AWS SES due to simplicity, cost-effectiveness, and appropriate scale for a portfolio site |
| [ADR-002](./ADR-002-security-implementation-approach.md) | Security Implementation Approach | Accepted | 2025-01-23 | Implement pragmatic security fixes appropriate for portfolio scale rather than enterprise-grade security stack |

## Key Decisions Summary

### Email Infrastructure
- **Service**: Resend (3,000 free emails/month)
- **Rationale**: 300x more capacity than needed, zero operational overhead
- **Alternative Rejected**: AWS SES + Lambda + CloudWatch stack

### Security Approach
- **Strategy**: Pragmatic, risk-appropriate security
- **Implementation**: 2-day focused security enhancement
- **Alternative Rejected**: Enterprise security stack with WAF, SIEM, IDS

## Decision Themes

1. **YAGNI (You Aren't Gonna Need It)**: Avoid building for imaginary future scale
2. **Appropriate Complexity**: Match solution complexity to actual problem complexity
3. **Operational Simplicity**: Minimize services and dependencies to maintain
4. **Cost Effectiveness**: Use free tiers effectively for low-traffic applications
5. **Time to Value**: Deliver working solutions quickly rather than perfect architectures slowly

## Next ADRs to Consider

- ADR-003: Testing Strategy (unit vs integration vs E2E balance)
- ADR-004: Deployment Pipeline (GitHub Actions vs Vercel auto-deploy)
- ADR-005: Monitoring Approach (application logs vs external monitoring)

## References

- [ADR Template](./adr-template.md) - Template for creating new ADRs
- [ADR Process](./README.md) - How we use ADRs in this project