# SPEC-0007: Deploy workflow permissions drift (ListExports + CSP KVS)

Status: Final
Date: 2026-01-18

## Summary

Production deploy (`.github/workflows/deploy.yml`) assumes an AWS IAM role via GitHub OIDC
(`AWS_DEPLOY_ROLE_ARN`) and runs:

1. CDK deployments (`pnpm -C infrastructure cdk deploy ...`)
2. Static export deployment (`pnpm deploy:static:prod` → `scripts/deploy-static-site.mjs`)

On 2026-01-18, the deploy job failed because the assumed role lacked `cloudformation:ListExports`.
This spec defines the minimum required IAM permissions for the deploy role, adds repo guardrails to
catch drift early, and provides a repeatable remediation path without introducing long-lived AWS
credentials.

## Problem Statement

### Observed failure

Deploy job failed with AWS CLI AccessDenied:

- `cloudformation:ListExports` was not authorized for the assumed role.

This blocks `scripts/deploy-static-site.mjs` from discovering targets via exports:

- `${env}-website-bucket-name`
- `${env}-distribution-id`
- `${env}-csp-hashes-kvs-arn`

### Root cause

OIDC deploy role policies drifted from documented minimum permissions:

- Missing `cloudformation:ListExports` (required).
- Missing `cloudfront-keyvaluestore:*` actions (required for CSP KVS sync).
- Potentially incomplete S3 permissions for `aws s3 sync` (multipart edge cases).

## Goals / Non-goals

### Goals

- Ensure `deploy.yml` succeeds on merges to `main`.
- Keep the deployment role least-privileged while supporting:
  - CDK modern bootstrap usage
  - static export upload
  - CSP hashes KVS sync
  - CloudFront invalidation
- Detect IAM drift early with clear, actionable workflow failures.
- Provide a one-command remediation path for role policy updates.

### Non-goals

- Managing the GitHub OIDC provider or deploy role from CI.
- Migrating away from CloudFormation exports as the discovery mechanism.

## Constraints

- OIDC provider + deploy role remain manual prerequisites (see `docs/architecture/adr/ADR-0008-oidc-bootstrap-manual.md`).
- `cloudformation:ListExports` requires `Resource: "*"` (account+region scoped operation).
- Deploy remains static export (`output: "export"`) and must keep CSP hashes KVS in sync with `out/`.

## Design

### A) Minimum IAM permissions

#### A.1 CDK modern bootstrap access

Minimum permissions (see `scripts/ops/fix-gh-oidc-cdk-bootstrap-policy.sh`):

- `ssm:GetParameter` / `ssm:GetParameters` on `/cdk-bootstrap/hnb659fds/version`
- `sts:AssumeRole` on CDK bootstrap roles:
  - `cdk-hnb659fds-deploy-role-<account>-<region>`
  - `cdk-hnb659fds-file-publishing-role-<account>-<region>`
  - `cdk-hnb659fds-image-publishing-role-<account>-<region>`
  - `cdk-hnb659fds-lookup-role-<account>-<region>`

#### A.2 Static deploy access (required by `scripts/deploy-static-site.mjs`)

Minimum permissions (see `scripts/ops/fix-gh-oidc-static-deploy-policy.sh`):

- CloudFormation exports discovery:
  - `cloudformation:ListExports` on `*`
- S3 upload:
  - `s3:ListBucket` on `arn:aws:s3:::<bucket>`
  - `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts` on `arn:aws:s3:::<bucket>/*`
- CloudFront invalidation:
  - `cloudfront:CreateInvalidation` (plus `GetInvalidation`/`ListInvalidations` recommended) on the distribution ARN
- CSP hashes KeyValueStore sync:
  - `cloudfront-keyvaluestore:DescribeKeyValueStore`, `ListKeys`, `UpdateKeys` on the KVS ARN

### B) Guardrails (repo preflight checks)

Add explicit preflight checks before attempting deployments to surface IAM drift immediately:

- Validate `cloudformation list-exports`.
- Resolve bucket / distribution / KVS exports.
- Verify:
  - `aws s3 ls s3://<bucket>` succeeds
  - `aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn <arn>` succeeds
  - `aws cloudfront list-invalidations --distribution-id <id>` succeeds

## Implementation

### Repo changes

- Add preflight checks:
  - `.github/workflows/deploy.yml`
  - `.github/workflows/manual-deploy.yml`
- Add helper remediation script:
  - `scripts/ops/fix-gh-oidc-static-deploy-policy.sh`
- Update documentation pointers:
  - `infrastructure/README.md`
  - `docs/deployment/README.md`
  - `.github/workflows/README.md`

### Operational procedure (AWS admin, when drift occurs)

1. Attach/refresh CDK bootstrap access:

   ```bash
   bash scripts/ops/fix-gh-oidc-cdk-bootstrap-policy.sh --role-name prod-portfolio-deploy
   ```

2. Attach/refresh static deploy access:

   ```bash
   bash scripts/ops/fix-gh-oidc-static-deploy-policy.sh --role-name prod-portfolio-deploy --env prod
   ```

### Validation checklist

With AWS admin credentials (or by assuming the role), validate:

```bash
aws cloudformation list-exports --region us-east-1 --max-items 1
aws s3 ls s3://<bucket-from-exports>
aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn <kvs-from-exports>
aws cloudfront list-invalidations --distribution-id <distribution-id-from-exports> --max-items 1
```

## Decision Framework

Option selected: manual OIDC role + documented/automated remediation scripts + workflow preflights.

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.5 | 3.325 |
| Application value | 0.30 | 9.6 | 2.88 |
| Maintenance & cognitive load | 0.25 | 9.2 | 2.30 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

Total: **9.405 / 10.0**

## References

- AWS Security Blog: Use IAM roles to connect GitHub Actions to actions in AWS
- AWS CLI: `cloudformation list-exports`
- AWS Service Authorization Reference: Amazon CloudFront KeyValueStore (`cloudfront-keyvaluestore`)
