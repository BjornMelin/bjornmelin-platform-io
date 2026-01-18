---
ADR: 0008
Title: OIDC bootstrap remains manual (GitHub deploy role not managed by CDK)
Status: Accepted
Version: 1.0
Date: 2026-01-18
Supersedes: []
Superseded-by: []
Related: []
Tags: infrastructure, security, deployment
References:
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp.html
  - https://docs.aws.amazon.com/service-authorization/latest/reference/list_awscloudformation.html
  - https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
  - https://github.com/aws-actions/configure-aws-credentials
---

## Status

Accepted (2026-01-18).

## Description

Keep GitHub Actions OIDC provider and deploy role creation as a manual, one-time prerequisite
outside of CDK; document required permissions and add workflow preflight checks.

## Context

Forks need a predictable deployment setup. Today, GitHub Actions authenticates to AWS via OIDC
and assumes a deploy role. That role and the account-wide OIDC provider are prerequisites; they
must exist before the workflow can assume the role and before CDK can deploy stacks. Automating
these from GitHub Actions would require long-lived AWS credentials, which conflicts with
security best practices.

## Decision Drivers

- Avoid long-lived AWS credentials in GitHub Secrets.
- Preserve a reliable bootstrap path that works for first-time forks.
- Keep deployment permissions least-privileged and auditable.

## Alternatives

- A: **Manual OIDC provider + role creation (current)** — Pros: secure, no long-lived creds,
  avoids bootstrapping loop. Cons: manual step for new forks.
- B: CDK stack to create OIDC provider + role, run manually with local AWS admin creds — Pros:
  IaC for repeatability. Cons: still manual; adds infra surface area to maintain.
- C: Bootstrap from GitHub Actions using static AWS keys — Pros: fully automated. Cons:
  insecure (long-lived credentials), violates least-privilege guidance.

### Decision Framework

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.0 | 3.15 |
| Application value | 0.30 | 9.5 | 2.85 |
| Maintenance & cognitive load | 0.25 | 9.5 | 2.375 |
| Architectural adaptability | 0.10 | 8.5 | 0.85 |

**Total:** 9.225 / 10.0

## Decision

We will keep OIDC provider and GitHub deploy role creation as a manual, documented prerequisite.
We will also document required permissions (including `cloudformation:ListExports`) and add a
workflow preflight step to fail fast when permissions are missing.

## Constraints

- The OIDC provider is account-wide and must exist before any OIDC role can be assumed.
- A GitHub Actions workflow cannot assume a role that does not yet exist.
- Avoid storing long-lived AWS credentials in repository secrets.

## High-Level Architecture

- Manual step: create OIDC provider + deploy role in the AWS account.
- CI/CD: `aws-actions/configure-aws-credentials` assumes the deploy role via OIDC.
- Deploy: workflow runs CDK + static export; preflight checks validate required AWS permissions.

## Related Requirements

### Functional Requirements

- **FR-1:** Deployment workflow can assume a role via OIDC without static credentials.
- **FR-2:** Static deploy can resolve CloudFormation exports for S3/KVS/CloudFront targets.

### Non-Functional Requirements

- **NFR-1:** Least-privilege IAM policies.
- **NFR-2:** Reproducible setup guidance for forks.

## Design

- Keep IAM OIDC provider + deploy role creation manual.
- Add deploy workflow preflight check for `cloudformation:ListExports`.
- Update documentation to include missing IAM permission.

## Testing

- Workflow preflight should fail with a clear message when `cloudformation:ListExports`
  is missing.

## Implementation Notes

- Add preflight step in `.github/workflows/deploy.yml`.
- Update `infrastructure/README.md` and `.github/workflows/README.md`.

## Consequences

### Positive Outcomes

- Avoids storing AWS static keys.
- Clearer error messages and documented permissions.

### Negative Consequences / Trade-offs

- Manual bootstrap remains a required step for new forks.

### Ongoing Maintenance & Considerations

- Revisit if AWS introduces secure, first-class bootstrapping support for OIDC roles.

### Dependencies

- **Added**: None
- **Removed**: None

## Changelog

- **1.0 (2026-01-18)**: Initial version.
