---
spec: SPEC-0006
title: CSP hashes via CloudFront Function + KeyValueStore (KVS)
version: 1.0.0
date: 2026-01-18
owners: ["ai-arch"]
status: Implemented
related_requirements: ["NFR-601", "NFR-602", "NFR-603"]
related_adrs: ["ADR-0001", "ADR-0005"]
notes: "Defines the end-to-end implementation for per-path CSP hashes without exceeding CloudFront Function size limits."
---

## Summary

This spec defines the final implementation for a strict `Content-Security-Policy` on a Next.js static export hosted on
S3/CloudFront. It keeps CSP strict (no `unsafe-inline`) while avoiding CloudFront Function size limits by storing
per-path hash selections in CloudFront KeyValueStore (KVS).

## Context

CloudFront Function size limits require compact CSP hash selection data at runtime.

## Goals / Non-goals

### Goals

- Keep CSP strict without `unsafe-inline`.
- Avoid CloudFront Function size limit failures.
- Keep per-path hash selection data manageable and deployable.

### Non-goals

- Switching away from CloudFront Functions or KVS.

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Non-functional requirements

- **NFR-601:** CSP stays strict without Server Actions/nonces.
- **NFR-602:** No CloudFront Function 10 KB outages.
- **NFR-603:** Fully IaC deployable on forks.

## Constraints

- CloudFront Function source size limit: 10,240 bytes.
- KVS value size limit: 1,024 bytes.

## Design

### Target architecture (AWS best practice, scales)

- A **viewer-response CloudFront Function** (JS runtime 2.0) sets `Content-Security-Policy` for HTML responses.
- Per-path “which hashes apply” data is stored in **CloudFront KeyValueStore (KVS)** (CloudFront Function code is capped
  at 10,240 bytes).
- Because KVS values are capped at 1,024 bytes, KVS stores compact **per-path indices**, not full hash strings.
  - Function code contains a global array of base64 digests: `HASH_B64[]` (no `sha256-` prefix).
  - KVS stores per-path values as dot-delimited base36 indices: `0.1.2.k.10`.

### Data formats

Generated artifacts:

- `infrastructure/lib/generated/next-inline-script-hashes.ts` (global allow-list; audit/debug)
- `infrastructure/lib/generated/next-inline-script-hashes.json` (per-path hashes; optional tooling)
- `infrastructure/lib/generated/next-inline-script-hashes.kvs.json` (KVS sync payload)
  - Format: `{ "data": [ { "key": "/about/index.html", "value": "0.1.2.k.10" }, ... ] }`
- `infrastructure/lib/functions/cloudfront/next-csp-response.js` (CSP CloudFront Function source)

Note: The generated JS artifacts are intentionally compact to preserve CloudFront Function size limits.
Biome excludes them from formatting checks via negated patterns in `biome.json`.

### Guardrails (hard failures)

Build-time validation in `scripts/generate-next-inline-csp-hashes.mjs` must fail the build if:

- Generated CloudFront Function source exceeds **10,240 bytes**.
- Any KVS key exceeds **512 bytes**.
- Any KVS value exceeds **1,024 bytes**.
- Total KVS payload exceeds **5 MB**.

### CloudFront Function behavior

Implementation lives in `infrastructure/lib/functions/cloudfront/next-csp-response.js` (generated).

- Uses KVS:
  - `import cf from "cloudfront";`
  - `var kvsHandle = cf.kvs();`
- Performance:
  - Only reads KVS for HTML responses (by `content-type` and request path rules).
  - Skips `/_next/*` and non-HTML assets.
- CSP construction:
  - Base directives are stable constants in function code.
  - `script-src 'self'` + per-path hashes (decoded from KVS indices).
  - `connect-src` is derived from host mapping.
- Reliability:
  - If the per-path KVS entry is missing, the function tries `"/404.html"` then `"/index.html"`.
  - **Fail-soft:** If KVS is unavailable/unpopulated (no entry found after fallbacks), the function returns the response
    unchanged (does not set `Content-Security-Policy`) to avoid a hard outage during rollout. The deploy pipeline invalidates
    CloudFront after syncing KVS so responses are recached with the strict CSP.

### Infrastructure (CDK)

Storage stack wiring is in `infrastructure/lib/stacks/storage-stack.ts`:

- Provisions (and outputs) the CSP hashes **KVS ARN** as a CloudFormation export: `${env}-csp-hashes-kvs-arn`.
- Associates the KVS with the CSP CloudFront Function (`keyValueStore: ...`) on `VIEWER_RESPONSE`.
- KVS provisioning is fully IaC via a Lambda-backed Custom Resource (`infrastructure/lib/functions/custom-resources/cloudfront-kvs/index.ts`)
  to avoid CloudFormation limitations creating KVS directly.

## Acceptance criteria

- CSP hashes are applied per path without `unsafe-inline`.
- KVS payload sizes stay within AWS limits.
- Build fails on size limit violations.

## Testing

Infra tests validate CloudFront Function behavior by executing the generated JS in a VM context:

- File: `infrastructure/test/next-csp-response.test.ts`
- Coverage:
  - known path sets CSP with hashes
  - unknown path falls back to `"/404.html"`
  - **fail-soft** when KVS is unpopulated (no CSP header)
  - non-HTML requests skip KVS reads

## Operational notes

### Deployment workflow

The authoritative pipeline is in `.github/workflows/deploy.yml` and uses:

1. `pnpm build` (creates `out/` + regenerates CSP artifacts)
2. `pnpm -C infrastructure cdk deploy prod-portfolio-storage`
3. `pnpm deploy:static:prod` (implemented by `scripts/deploy-static-site.mjs`):
   - reads CloudFormation exports (`cloudformation list-exports`)
   - syncs KVS from `infrastructure/lib/generated/next-inline-script-hashes.kvs.json`
   - uploads `out/` to S3
   - invalidates CloudFront

## Failure modes and mitigation

- KVS missing entries → fail-soft (no CSP header) until KVS sync completes.

## Decision Framework Score (must be ≥ 9.0)

Chosen option: CloudFront Function + KVS (indices encoding)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.6 | 3.36 |
| Application value | 0.30 | 9.4 | 2.82 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 9.1 | 0.91 |

**Total:** 9.34 / 10.0

## Key files

- `infrastructure/lib/generated/next-inline-script-hashes.ts`
- `infrastructure/lib/generated/next-inline-script-hashes.kvs.json`
- `infrastructure/lib/functions/cloudfront/next-csp-response.js`
- `scripts/generate-next-inline-csp-hashes.mjs`

## References

- ADR-0001 (CSP hash requirements)
- ADR-0005 (static export constraints)

## Changelog

- **1.0 (2026-01-18)**: Initial version.
