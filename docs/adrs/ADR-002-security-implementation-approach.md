# ADR-002: Security Implementation Approach

## Date

2025-01-23

## Status

Accepted

## Context

Our contact form implementation requires security enhancements to address:

1. **CVE-2025-29927**: Next.js vulnerability requiring upgrade to 15.2.3+
2. **CSRF Protection**: Token validation not properly implemented
3. **Rate Limiting**: Current in-memory implementation needs improvement
4. **Input Validation**: Additional sanitization needed beyond Zod validation

We need to decide between a comprehensive security overhaul with enterprise-grade solutions or pragmatic fixes appropriate for our scale.

## Decision Drivers

- **Actual Threat Model**: Portfolio site with 10-50 monthly visitors
- **Time Constraints**: Need to address vulnerabilities quickly
- **Complexity Budget**: Avoid over-engineering for hypothetical threats
- **Maintenance Burden**: Solo developer maintaining the project
- **Security Best Practices**: Still need proper protection
- **Demonstration Value**: Show security awareness without overcomplication

## Considered Options

### Option 1: Pragmatic Security Fixes (Chosen)
Implement appropriate security for a portfolio:
- Upgrade Next.js to patch CVE
- Fix CSRF token validation
- Enhance in-memory rate limiter
- Add DOMPurify for XSS protection
- Keep security measures proportional to risk

### Option 2: Enterprise Security Stack
Implement comprehensive security:
- Web Application Firewall (WAF)
- Distributed rate limiting with Redis
- Security Information and Event Management (SIEM)
- Intrusion Detection System (IDS)
- Full security audit and penetration testing

### Option 3: Minimal Fixes Only
Just patch the CVE:
- Upgrade Next.js
- Leave other security as-is
- Accept the risk for a low-traffic site

## Decision

We will implement pragmatic security fixes appropriate for a portfolio website while maintaining security best practices.

Specifically, we will:

1. **Immediate Patches** (Day 1):
   - Upgrade to Next.js 15.2.3+ for CVE-2025-29927
   - Fix CSRF token validation in the API route
   - Enhance rate limiter with proper cleanup

2. **Security Enhancements** (Day 1):
   - Add DOMPurify for HTML sanitization
   - Implement proper error messages that don't leak information
   - Add security headers (HSTS, CSP, etc.)

3. **Testing & Validation** (Day 2):
   - Write security-focused tests
   - Add E2E tests for security features
   - Document security measures

## Consequences

### Positive

- **Quick Resolution**: Security issues fixed in 2 days
- **Appropriate Protection**: Security matches actual threat model
- **Maintainable**: Simple enough to understand and modify
- **Best Practices**: Still follows OWASP guidelines
- **Learning Value**: Demonstrates security awareness
- **No External Dependencies**: No Redis, WAF, or monitoring services needed

### Negative

- **Not Enterprise-Grade**: Wouldn't scale to high-traffic scenarios
- **Basic Monitoring**: Limited to application logs and Resend dashboard
- **Manual Processes**: No automated security scanning

### Risks and Mitigations

- **Risk**: Sophisticated attack on portfolio
  - **Mitigation**: Monitor logs for unusual patterns
  - **Mitigation**: Have incident response plan ready
  
- **Risk**: Rate limiter memory leak
  - **Mitigation**: Implement periodic cleanup
  - **Mitigation**: Monitor memory usage in production

## Validation

Success criteria for security implementation:

- **Vulnerability Scan**: Pass basic security scanners
- **Rate Limit Testing**: Confirm limits work correctly
- **CSRF Testing**: Verify token validation prevents attacks
- **Memory Usage**: No increase over 24-hour period
- **User Experience**: Legitimate users unaffected

Review security posture quarterly or if traffic patterns change significantly.

## Implementation Example

```typescript
// Pragmatic rate limiting for portfolio scale
const attempts = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every hour (not every request)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (value.resetAt < now) {
      attempts.delete(key);
    }
  }
}, 60 * 60 * 1000);

// vs. Enterprise solution requiring:
// - Redis cluster setup
// - Connection pool management
// - Distributed lock mechanisms
// - Failover handling
// - Monitoring infrastructure
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [CVE-2025-29927 Details](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-29927)
- [SIMPLIFIED-IMPLEMENTATION-PLAN.md](../../SIMPLIFIED-IMPLEMENTATION-PLAN.md)

## Notes

Security is not about implementing every possible protection—it's about appropriate protection for your threat model. A portfolio website doesn't face the same threats as a banking application. 

This approach demonstrates security awareness and best practices while avoiding the trap of security theater. The goal is actual security, not the appearance of security through unnecessary complexity.