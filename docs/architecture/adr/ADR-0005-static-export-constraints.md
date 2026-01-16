---
ADR: 0005
Title: Static export constraints
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0004", "ADR-0001"]
Tags: ["architecture", "nextjs", "static-export"]
References:
  - "[Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports)"
---

## Status

Implemented (2026-01-16).

## Description

Keep the Next.js site deployable as a static export to S3 + CloudFront by
avoiding features that require a server runtime.

## Context

The application is deployed as a static export to S3 + CloudFront. Static export
is compatible with Server Components at build time but disallows runtime features
that require a server.

## Decision Drivers

- Production deployment target is static hosting on S3 + CloudFront.
- Lower operational complexity and cost than a long-running server runtime.
- Predictable build-time rendering and cache behavior.

## Alternatives

- Deploy as a Next.js server (`next start`) on compute (rejected: increases operational surface area).
- Move to a managed runtime (rejected: conflicts with current hosting constraints).
- Introduce Server Actions/ISR (rejected: not supported with static export).

## Decision

Commit to static export constraints:

- Keep `output: "export"` in `next.config.mjs`.
- Avoid runtime server features that require per-request data.
- Use AWS Lambda (via CDK) for server-side contact form processing in production.

## Constraints

The following are not supported with static export and must not be introduced
in app code:

- Request-time APIs (cookies, headers)
- Redirects/rewrites/headers in Next.js config
- Server Actions
- ISR
- Dynamic Route Handlers that depend on request data

## High-Level Architecture

- `pnpm build` produces `out/` for static hosting.
- CloudFront serves static content from S3.
- CloudFront routes `/api/*` to Lambda for contact processing in production.

## Related Requirements

### Functional Requirements

- **FR-1:** The site can be hosted from `out/` on S3 with CloudFront.
- **FR-2:** Contact form works in production via Lambda routing.

### Non-Functional Requirements

- **NFR-1:** No long-running server runtime required for the web app.
- **NFR-2:** Architecture remains compatible with strict CSP for static export (see ADR-0001).

## Design

### Configuration

- `next.config.mjs`: `output: "export"`
- `scripts/deploy-static-site.mjs`: uploads `out/` and invalidates CloudFront
- Infrastructure stacks route `/api/*` to Lambda in production.

## Consequences

### Positive Outcomes

- Any dynamic behavior is either build-time or client-side.
- The site remains deployable to low-cost static infrastructure.

### Negative Consequences / Trade-offs

- Features requiring request-time data (cookies/headers, Server Actions) are not available.

### Ongoing Maintenance & Considerations

- Treat introduction of unsupported features as a breaking architectural change requiring a new ADR.
- Keep docs aligned with the static export limitations and deployment pipeline.

#### Explicit Deploy Sequence

To ensure CSP/static-export sync and prevent hash drift, follow this repeatable sequence:

1. **Build the static export**: Run `pnpm build` to generate the `out/` directory.
2. **Generate/Validate CSP hashes**: Ensure all inline script/style hashes used by the app are generated and validated
   against the build output.
3. **Publish static assets**: Upload the `out/` directory to the CDN/storage (e.g., S3).
4. **Deploy server-side components**: Deploy components that serve or validate CSP, including local dev API routes in
   `src/app/api/` (for dev) and the CDK-deployed Lambda (for production).
5. **Update/Flush CDN**: Invalidate the CDN cache (e.g., CloudFront) and update downstream configurations to ensure
   the new assets and CSP are active.

### Dependencies

- **Added**: None.
- **Removed**: None.

## Implementation Notes

- Local dev API routes in `src/app/api/` exist for local development only.
- Production contact processing is handled by CDK-deployed Lambda.

## Testing

- Validate static export with `pnpm build` and `pnpm serve`.
- Ensure E2E coverage continues to pass against the dev server configuration.

## Changelog

- **1.0 (2026-01-16)**: Document and enforce static export constraints.
