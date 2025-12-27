# ADR 0001: CloudFront CSP for Next.js static export uses hash allow-list

## Status

Accepted (2025-12-27)

## Context

`bjornmelin.io` is a Next.js App Router **static export** served from S3 behind CloudFront.
Next.js static exports emit **inline bootstrap scripts** (e.g. `self.__next_f.push(...)`)
that must execute for the page to render.

We want a strict `Content-Security-Policy` that avoids `script-src 'unsafe-inline'` while still allowing
these required inline scripts.

An incident on 2025-12-27 caused the site to render a blank page because CloudFront’s CSP `script-src`
hash allow-list did not match the currently deployed static export.

## Decision

- CloudFront sets CSP via a `ResponseHeadersPolicy` in `StorageStack`.
- CSP `script-src` uses:
  - `'self'` for external JS served from the same origin, and
  - a **SHA-256 hash allow-list** for required inline scripts.
- The allow-list is generated from the static export (`out/**/*.html`) by `pnpm generate:csp-hashes`,
  which writes `infrastructure/lib/generated/next-inline-script-hashes.ts`.

## Operational requirements (to prevent outages)

- **Never deploy `prod-portfolio-storage` (CSP) without also deploying the matching static export.**
  The CSP hashes and the contents of `out/` must be produced by the same build.
- Production deployments should follow this order:
  1. Build/export (`pnpm build`) to refresh `out/` and regenerate CSP hashes.
  2. Deploy storage stack (`pnpm -C infrastructure deploy:storage`) to apply the CSP.
  3. Upload `out/` to S3 and invalidate CloudFront (see `pnpm deploy:static:prod`).

## Consequences

Positive:
- Strict CSP without `unsafe-inline` for scripts.
- CSP remains compatible with Next.js App Router static export requirements.

Negative:
- Any change that affects inline bootstrap scripts requires regenerating the hash allow-list.
- Deploy order matters; mismatched CSP and static export can break rendering.

## References

- CSP hash generation: `scripts/generate-next-inline-csp-hashes.mjs`
- CloudFront CSP policy: `infrastructure/lib/stacks/storage-stack.ts`
- Static upload helper: `scripts/deploy-static-site.mjs`
