# CI/CD Pipeline Documentation

This document outlines the deployment process for bjornmelin-platform-io.

## Infrastructure Deployment

### Prerequisites

- AWS credentials provisioned for the target account
- AWS CDK CLI (`npm install -g aws-cdk`) or `pnpm dlx aws-cdk`
- Node.js 20.11.x
- pnpm 10.18.x (Corepack enables the pinned version automatically)

### CDK Deployment Process

1. Install dependencies in the infrastructure workspace:

   ```bash
   cd infrastructure
   pnpm install
   ```

2. Build the CDK app:

   ```bash
   pnpm build
   ```

3. Review changes prior to deployment:

   ```bash
   pnpm cdk diff
   ```

4. Deploy the stacks that need to change:

   ```bash
   pnpm cdk deploy prod-portfolio-storage
   pnpm cdk deploy prod-portfolio-monitoring
   pnpm cdk deploy prod-portfolio-deployment
   ```

   Use `pnpm cdk deploy --all` when a coordinated full rollout is required.

All environments assume AWS roles through GitHub’s OpenID Connect provider. The
CDK stacks do **not** create IAM users or access keys.

## Next.js Application Deployment

### Production Build

1. Install web application dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Produce an optimized build:

   ```bash
   pnpm build
   ```

3. Run the production server locally (optional smoke test):

   ```bash
   pnpm start
   ```

### Environment Variables

GitHub Actions environments define the full variable set for each target stage.
Production uses:

- `NEXT_PUBLIC_BASE_URL`
- `AWS_REGION`
- `CONTACT_EMAIL`
- Resend API key (secret)
- Any feature-specific tokens

Secrets live in environment-scoped GitHub secrets; infrastructure credentials
are provided exclusively through role assumption.

## Deployment Environments

### Development

- Ad hoc deployments via CDK or branch workflows
- Shares infrastructure code with production
- Uses the `dev-portfolio-deploy` OIDC role for automation

### Production

- Deployments run through GitHub Actions using the `prod-portfolio-deploy`
  role
- Daily security audit workflow with pnpm audit severity gating
- CodeQL advanced workflow is the single SARIF publisher (default setup is
  disabled)

## Monitoring

- SNS alert recipients are configured in `CONFIG.prod.alerts.emails`
- CloudWatch dashboards and alarms are provisioned by `MonitoringStack`
- Audit SNS subscriptions are parameterized and can be rotated without code change

## Rollback Procedures

1. Review CloudWatch alarms and deployment logs.
2. Identify the faulty change via `pnpm cdk diff`.
3. Redeploy the previous stack version:

   ```bash
   pnpm cdk deploy --all --previous-parameters
   ```

4. Re-run the CI pipeline to confirm the rollback.

## Security Considerations

- GitHub OIDC federation is enforced across all workflows; no IAM access keys
  are provisioned.
- Secrets are stored in AWS Secrets Manager and referenced via GitHub
  environment variables.
- pnpm audit runs on every push/PR and fails the build on high or critical
  findings.
- CodeQL default setup is disabled in repository settings; the advanced
  workflow manages scanning.
