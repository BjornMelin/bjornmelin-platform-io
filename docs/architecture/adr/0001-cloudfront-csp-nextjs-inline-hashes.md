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

## Security Model

CSP script hashes work through **cryptographic integrity verification**, not secrecy.

### Why hashes are safe to be public

1. **Collision resistance**: SHA-256 makes it computationally infeasible to craft different content that
   produces the same hash
2. **Exact match required**: The browser computes the hash of each inline script and compares it to the
   allowlist - only identical content executes
3. **Public by design**: These hashes appear in the `Content-Security-Policy` header sent to every
   browser; they were never intended to be secret
4. **One-way function**: Knowing the hash reveals nothing about how to create content that matches

An attacker knowing `sha256-abc123...` cannot:

- Inject arbitrary scripts (no matching hash in allowlist)
- Modify existing scripts (hash would no longer match)
- Reverse-engineer exploitable content (cryptographically impossible)

### Why hashes instead of nonces

| Approach | Requirement | Our Situation |
| --- | --- | --- |
| **Nonces** | Server middleware to generate fresh value per request | Not possible - static export |
| **Hashes** | Pre-computed checksums of known inline scripts | Correct for static exports |

Static exports have no server-side middleware to inject per-request nonces. Hashes are the only viable
strict CSP approach for CloudFront-served static content.

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

- Any change that affects inline bootstrap scripts will automatically regenerate the hash allow-list during
  the build (via `pnpm generate:csp-hashes`). Ensure the full build completes successfully before deploying
  to production.
- Deploy order matters; mismatched CSP and static export can break rendering.

## References

- CSP hash generation: `scripts/generate-next-inline-csp-hashes.mjs`
- CloudFront CSP policy: `infrastructure/lib/stacks/storage-stack.ts`
- Static upload helper: `scripts/deploy-static-site.mjs`
