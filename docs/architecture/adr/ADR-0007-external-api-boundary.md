---
ADR: 0007
Title: External API boundary for static export (contact form)
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0005", "ADR-0002", "ADR-0004"]
Tags: ["architecture", "api", "static-export", "aws", "security"]
References:
  - "[Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports)"
---

## Status

Implemented (2026-01-16).

## Description

Keep server-side behavior out of the Next.js app (static export) and route contact form submissions
to an AWS Lambda API behind CloudFront.

## Context

The site is deployed as a strict static export to S3/CloudFront (ADR-0005). The contact form requires
server-side email delivery (Resend) and abuse prevention. Implementing this as a Next.js Route Handler
would introduce server/runtime requirements and violates the static export architecture.

## Decision Drivers

- Preserve static export capability with a pure static `/out` artifact.
- Keep the backend independently deployable and secured via AWS IAM/SSM.
- Ensure contact form reliability (retries, logging, operational visibility).

## Alternatives

- Implement a Next.js Route Handler (`src/app/api/contact/route.ts`) (rejected: violates static export constraints).
- Use a third-party form provider (rejected: vendor lock-in and weaker control over security posture).
- Use email delivery directly from the browser (rejected: exposes secrets and is not reliable).

## Decision

- The web app submits `POST ${NEXT_PUBLIC_API_URL}/contact`.
- In production, CloudFront routes `/api/*` to the contact Lambda/API stack deployed by CDK.
- In tests, Playwright mocks the `POST */contact` request for determinism.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.0 | 3.15 |
| Application value | 0.30 | 9.2 | 2.76 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.06 / 10.0

## Constraints

- No server-side request handling inside the Next.js app.
- API must be deployable and operable independently of the static site assets.
- Environment variables for the web app must be build-time safe (`NEXT_PUBLIC_*` only).

## Consequences

### Positive Outcomes

- Static export remains pure static hosting.
- Backend can enforce security controls (rate limiting, validation, logging).

### Negative Consequences / Trade-offs

- Local development requires either pointing `NEXT_PUBLIC_API_URL` to a deployed API or mocking the boundary.

## Implementation Notes

- Web app: `src/components/contact/contact-form.tsx` posts to `${NEXT_PUBLIC_API_URL}/contact`.
- Infra: `infrastructure/lib/functions/contact-form/index.ts` implements the Lambda handler.
- Routing: CloudFront routes `/api/*` to the API stack in production.
- Tests: `e2e/contact.spec.ts` mocks `**/contact` (POST only).

## Testing

- Unit: Zod schema tests cover request validation (ADR-0002).
- E2E: Playwright asserts payload and UI behavior without external network calls (ADR-0004).

## Changelog

- **1.0 (2026-01-16)**: Establish external API boundary and testing approach.
