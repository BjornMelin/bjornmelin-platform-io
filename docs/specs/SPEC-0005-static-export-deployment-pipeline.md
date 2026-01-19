---
spec: SPEC-0005
title: Static export deployment pipeline (CSP + S3/CloudFront)
version: 1.0.0
date: 2026-01-16
owners: ["ai-arch"]
status: Implemented
related_requirements: ["FR-501", "NFR-501"]
related_adrs: ["ADR-0001", "ADR-0005"]
notes: "Defines the required build/deploy sequencing for static export + CSP hash allow-list."
---

## Summary

This spec defines the required production deployment sequence for a strict static export hosted on
S3/CloudFront with a CSP hash allow-list for Next.js inline scripts.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.1 | 3.19 |
| Application value | 0.30 | 9.3 | 2.79 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 8.9 | 0.89 |

**Total:** 9.12 / 10.0

## Production pipeline (authoritative)

Production deploys are performed by GitHub Actions (`.github/workflows/deploy.yml`) on merges to
`main` (docs-only changes are ignored by that workflow).

The workflow sequence is:

1. `pnpm build`
2. `pnpm -C infrastructure cdk deploy prod-portfolio-storage`
3. `pnpm deploy:static:prod` (S3 upload + CSP hashes KVS sync + CloudFront invalidation)

## Why ordering matters

The CloudFront `Content-Security-Policy` includes a script hash allow-list generated from the
static export HTML output. Deploying CSP configuration (CloudFront Function + KVS wiring) without uploading the
matching `out/` artifacts can cause a blank page due to CSP violations (ADR-0001).

## Manual deployment (break-glass)

Manual deployments must follow:

```bash
pnpm build
pnpm -C infrastructure deploy:storage
pnpm deploy:static:prod
```

## Acceptance criteria

- `pnpm build` produces:
  - `out/` containing fully static HTML/CSS/JS/assets
  - updated `infrastructure/lib/generated/next-inline-script-hashes.ts`
  - updated `infrastructure/lib/generated/next-inline-script-hashes.kvs.json`
  - updated `infrastructure/lib/functions/cloudfront/next-csp-response.js`
- `deploy.yml` deploys the matching `out/` directory, syncs the CSP hashes KVS, and invalidates CloudFront.
- Post-deploy smoke check passes (`curl $NEXT_PUBLIC_APP_URL` returns 2xx/3xx).

## Operational guardrails

- Never manually edit `infrastructure/lib/generated/next-inline-script-hashes.ts`.
- Do not deploy `prod-portfolio-storage` without a preceding successful build from the same commit.
- If `deploy.yml` is skipped (docs-only changes), use `manual-deploy.yml` when a site deploy is
  intentionally required.

## Key files

- `.github/workflows/deploy.yml`
- `scripts/generate-next-inline-csp-hashes.mjs`
- `scripts/deploy-static-site.mjs`
- `infrastructure/lib/stacks/storage-stack.ts`
