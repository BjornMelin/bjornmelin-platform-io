# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Bjornmelin Platform IO project, following 2025 best practices.

## What is an ADR?

An Architecture Decision Record (ADR) captures a single architectural decision along with its context and consequences. ADRs help us:
- Document why decisions were made, not just what was decided
- Enable new team members to understand past decisions
- Avoid revisiting the same discussions
- Track the evolution of our architecture

## ADR Process

### When to Create an ADR
Create an ADR for decisions that:
- Affect the structure, dependencies, or interfaces of the system
- Impact non-functional requirements (security, performance, scalability)
- Choose between multiple viable alternatives
- Would be expensive or difficult to reverse
- Need to be understood by future team members

### ADR Lifecycle
1. **Draft** - Initial proposal being written
2. **Proposed** - Ready for team review
3. **Accepted** - Approved and implemented
4. **Deprecated** - No longer relevant but kept for history
5. **Superseded** - Replaced by a newer ADR

### Best Practices
- Keep ADRs concise and focused on a single decision
- Use clear, active voice ("We will..." not "It should be...")
- Include actual code examples where helpful
- Link to relevant documentation and prior ADRs
- Review ADRs in short, focused meetings (30-45 minutes max)
- Store ADRs in version control with the code

## ADR Format

We use a hybrid format combining the simplicity of Michael Nygard's template with MADR's structured approach:

- **Title**: ADR-NNN: [Short descriptive title]
- **Date**: YYYY-MM-DD
- **Status**: Draft | Proposed | Accepted | Deprecated | Superseded
- **Context**: The issue motivating this decision
- **Decision Drivers**: Key factors influencing the decision
- **Considered Options**: Alternatives evaluated
- **Decision**: The choice we're making
- **Consequences**: What becomes easier/harder
- **Validation**: How we'll verify this decision was correct

## Current ADRs

1. [ADR-001: Keep Resend for Email Service](./ADR-001-keep-resend-for-email.md) - Decision to maintain Resend instead of migrating to AWS SES
2. [ADR-002: Security Implementation Approach](./ADR-002-security-implementation-approach.md) - Pragmatic security fixes without over-engineering

## Creating a New ADR

1. Copy the [ADR template](./adr-template.md)
2. Name it `ADR-NNN-short-descriptive-title.md` (increment NNN)
3. Fill out all sections, focusing on the "why"
4. Submit for review through normal PR process
5. Update this README with the new ADR once accepted

## References

- [Architectural Decision Records](https://adr.github.io/) - ADR GitHub Organization
- [MADR](https://adr.github.io/madr/) - Markdown Architectural Decision Records
- [AWS Prescriptive Guidance on ADRs](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/welcome.html)