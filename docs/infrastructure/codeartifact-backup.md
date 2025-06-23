# AWS CodeArtifact Integration - Optional Feature

> **⚠️ OPTIONAL FEATURE - NOT DEPLOYED**
> 
> This documentation describes an optional AWS CodeArtifact integration for automated npm package backups.
> This feature is **NOT currently deployed** and is provided as a reference implementation that can be
> enabled if needed in the future.

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Security](#architecture--security)
3. [Implementation Guide](#implementation-guide)
4. [Quick Start Guide](#quick-start-guide)
5. [Scripts & Tools](#scripts--tools)
6. [Recovery Operations](#recovery-operations)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
8. [Cost Management](#cost-management)
9. [Files Created](#files-created)

## Overview

AWS CodeArtifact integration provides automated backup of npm releases from the bjornmelin-platform-io project. The integration uses GitHub Actions with OpenID Connect (OIDC) for secure, credential-less authentication to AWS.

### Key Features

#### Security
- **OIDC Authentication**: No long-lived AWS credentials stored in GitHub
- **Least Privilege IAM**: Role limited to CodeArtifact operations only
- **Branch Protection**: Only main branch can publish by default
- **CDK Nag Compliance**: Security best practices enforced

#### Automation
- **Triggered on Release**: Automatically backs up packages after successful releases
- **Manual Trigger**: Workflow dispatch for on-demand backups
- **Version Verification**: Confirms package upload to CodeArtifact
- **Idempotent**: Handles existing package versions gracefully

#### Recovery
- **List Versions**: View all available package versions
- **Download Packages**: Retrieve specific versions locally
- **Restore to NPM**: Bulk or individual version restoration
- **Metadata Backup**: Export package information

## Architecture & Security

### Components
1. **GitHub Actions OIDC Provider**: Provides temporary AWS credentials
2. **IAM Role**: Assumes permissions for CodeArtifact operations
3. **CodeArtifact Domain**: Organization-level artifact management (`bjornmelin-platform`)
4. **CodeArtifact Repository**: Stores npm packages (`platform-releases`)
5. **GitHub Workflow**: Publishes packages on release

### Security Model
- No long-lived AWS credentials stored in GitHub
- Temporary credentials via OIDC token exchange
- Least-privilege IAM policies
- Repository-scoped access control
- Audit trail via CloudTrail

### Repository Structure
```
Domain: bjornmelin-platform
└── Repository: platform-releases
    └── Package: bjornmelin-platform-io
        └── Versions: 1.0.0, 1.0.1, etc.
```

### GitHub Actions OIDC Flow
1. GitHub requests OIDC token from GitHub's provider
2. Token presented to AWS STS
3. AWS validates token against trust policy
4. Temporary credentials issued
5. CodeArtifact operations performed

### IAM Permissions Required
- `codeartifact:GetAuthorizationToken` - Generate auth tokens
- `codeartifact:PublishPackageVersion` - Upload packages
- `codeartifact:DescribePackageVersion` - Verify uploads
- `sts:GetServiceBearerToken` - Required for CodeArtifact auth

## Implementation Guide

### 1. AWS Infrastructure Setup

#### Option A: Using Setup Script (Recommended)
```bash
# Run the setup script to create all AWS resources
./scripts/codeartifact-setup.sh setup

# This will:
# - Create CodeArtifact domain and repository
# - Set up GitHub OIDC provider
# - Create IAM role with proper permissions
# - Display the AWS Account ID to add as GitHub secret
```

#### Option B: Using CDK
```bash
cd infrastructure
pnpm install
pnpm run deploy:codeartifact
```

#### Option C: Manual AWS CLI Commands

Create CodeArtifact Domain:
```bash
aws codeartifact create-domain \
  --domain bjornmelin-platform \
  --domain-description "Domain for bjornmelin platform artifacts"
```

Create CodeArtifact Repository:
```bash
aws codeartifact create-repository \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --description "Repository for platform npm releases" \
  --repository-type npm
```

Connect to npmjs upstream (optional):
```bash
aws codeartifact associate-external-connection \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --external-connection public:npmjs
```

### 2. GitHub OIDC Setup

Create OIDC Identity Provider:
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
              1c58a3a8518e8759bf075b76b750d4f2df264fcd
```

Create IAM Role with Trust Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:bjornmelin/bjornmelin-platform-io:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

IAM Policy for CodeArtifact:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codeartifact:GetAuthorizationToken",
        "codeartifact:ReadFromRepository",
        "codeartifact:PublishPackageVersion",
        "codeartifact:PutPackageMetadata",
        "codeartifact:DescribePackageVersion"
      ],
      "Resource": [
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:domain/bjornmelin-platform",
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:repository/bjornmelin-platform/platform-releases",
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:package/bjornmelin-platform/platform-releases/*/*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "sts:GetServiceBearerToken",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "sts:AWSServiceName": "codeartifact.amazonaws.com"
        }
      }
    }
  ]
}
```

### 3. GitHub Configuration

Add the following secret to your GitHub repository:
- `AWS_ACCOUNT_ID`: Your AWS account ID (shown by setup script)

The workflow is already configured in `.github/workflows/codeartifact-backup.yml`

### 4. Testing Strategy

#### Local Testing
```bash
# Configure local npm to use CodeArtifact
export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token \
  --domain bjornmelin-platform \
  --query authorizationToken \
  --output text)

npm config set registry $(aws codeartifact get-repository-endpoint \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --query repositoryEndpoint \
  --output text)

# Test publishing
npm publish --dry-run
```

#### GitHub Actions Testing
1. Go to Actions → CodeArtifact Backup
2. Click "Run workflow"
3. Monitor execution
4. Verify package appears in CodeArtifact

## Quick Start Guide

### Initial Setup (One-time)

```bash
# Run the setup script to create all AWS resources
./scripts/codeartifact-setup.sh setup
```

### Usage

#### Automatic Backups
Backups happen automatically when:
1. A release workflow completes successfully
2. The CodeArtifact backup workflow is triggered

#### Manual Backup
Trigger from GitHub Actions:
1. Go to Actions → CodeArtifact Backup
2. Click "Run workflow"
3. Optionally specify a version to backup

#### Local Testing
```bash
# Configure npm for CodeArtifact
./scripts/codeartifact-setup.sh configure-npm

# Test publishing
./scripts/codeartifact-setup.sh test
```

## Scripts & Tools

### Setup Script (`scripts/codeartifact-setup.sh`)
Manages AWS CodeArtifact infrastructure:
- `setup` - Creates all required AWS resources
- `configure-npm` - Configures npm for CodeArtifact
- `test` - Tests publishing capability
- `info` - Shows current configuration
- `cleanup` - Removes all AWS resources

### Recovery Script (`scripts/codeartifact-recovery.sh`)
Handles package recovery operations:
- `list` - List all available versions
- `download [version]` - Download specific version
- `restore [version]` - Restore to npm registry
- `backup` - Create metadata backup

## Recovery Operations

### List Available Versions
```bash
./scripts/codeartifact-recovery.sh list
```

### Download a Specific Version
```bash
# Download latest
./scripts/codeartifact-recovery.sh download

# Download specific version
./scripts/codeartifact-recovery.sh download 1.0.1
```

### Restore to NPM Registry
```bash
# Set your NPM token
export NPM_TOKEN=your-npm-token

# Restore all versions
./scripts/codeartifact-recovery.sh restore

# Restore specific version
./scripts/codeartifact-recovery.sh restore 1.0.1
```

### Bulk Migration Script
```bash
#!/bin/bash
# List all package versions
aws codeartifact list-package-versions \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io \
  --query 'versions[].version' \
  --output text | while read version; do
    # Download and republish each version
    npm pack bjornmelin-platform-io@$version
    npm publish bjornmelin-platform-io-$version.tgz --registry https://registry.npmjs.org/
done
```

## Monitoring & Troubleshooting

### Check Package Status
```bash
# View package info
aws codeartifact describe-package \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io

# List versions
aws codeartifact list-package-versions \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io \
  --output table
```

### GitHub Actions Logs
Check workflow runs at:
`https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeartifact-backup.yml`

### Common Issues & Solutions

#### Authentication Failures
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check role trust policy
aws iam get-role --role-name GitHubActionsCodeArtifact
```

#### Publishing Failures
```bash
# Check if package already exists
aws codeartifact describe-package-version \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io \
  --package-version 1.0.1
```

#### Token Issues
```bash
# Generate new token (valid for 12 hours)
aws codeartifact get-authorization-token \
  --domain bjornmelin-platform \
  --query authorizationToken \
  --output text
```

### Debug Commands
```bash
# Check domain status
aws codeartifact describe-domain --domain bjornmelin-platform

# List packages
aws codeartifact list-packages \
  --domain bjornmelin-platform \
  --repository platform-releases

# View repository permissions
aws codeartifact get-repository-permissions-policy \
  --domain bjornmelin-platform \
  --repository platform-releases
```

## Cost Management

### Estimated Costs
- **Storage**: $0.05 per GB per month
- **Data Transfer**: $0.09 per GB (egress to internet)
- **Requests**: $0.05 per 10,000 requests
- **Estimated monthly cost**: ~$5-10 for typical usage

### View Storage Usage
```bash
# Check repository size via CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/CodeArtifact \
  --metric-name StorageSize \
  --dimensions Name=Domain,Value=bjornmelin-platform \
               Name=Repository,Value=platform-releases \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum
```

### Implement Lifecycle Policy
```bash
# List versions older than 90 days
aws codeartifact list-package-versions \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io \
  --query 'versions[?publishedTime<`'$(date -d '90 days ago' --iso-8601)'`].version' \
  --output text
```

## Files Created

### Documentation
- `/docs/infrastructure/codeartifact-backup.md` - This consolidated guide

### GitHub Workflow
- `/.github/workflows/codeartifact-backup.yml` - Automated backup workflow

### Infrastructure as Code
- `/infrastructure/lib/codeartifact-stack.ts` - CDK stack definition
- `/infrastructure/bin/codeartifact-app.ts` - CDK application entry point

### Scripts
- `/scripts/codeartifact-setup.sh` - Setup and management script
- `/scripts/codeartifact-recovery.sh` - Recovery operations script

### Configuration Updates
- `/infrastructure/package.json` - Added CDK scripts and dependencies
- `/infrastructure/cdk.json` - Added CodeArtifact context values

## Advanced Configuration

### Multiple Branches Support
To allow multiple branches to publish, update the CDK stack:
```typescript
new CodeArtifactStack(app, 'BjornmelinCodeArtifactStack', {
  allowedBranches: ['main', 'develop', 'release/*'],
  // ... other props
});
```

### Custom Domain/Repository Names
Set environment variables before running scripts:
```bash
export CODEARTIFACT_DOMAIN=my-custom-domain
export CODEARTIFACT_REPOSITORY=my-custom-repo
export AWS_REGION=eu-west-1

./scripts/codeartifact-setup.sh setup
```

## Maintenance Tasks

### Regular Tasks
- Review IAM permissions quarterly
- Update OIDC thumbprints if GitHub changes them
- Monitor storage costs and implement lifecycle policies
- Test recovery procedures monthly

### Security Best Practices
1. **Least Privilege**: IAM role only has permissions for specific CodeArtifact operations
2. **OIDC Authentication**: No long-lived credentials stored in GitHub
3. **Branch Protection**: Only the main branch can publish by default
4. **Audit Trail**: All operations are logged in CloudTrail
5. **CDK Nag Compliance**: Security best practices enforced

## Benefits Summary

1. **Resilience**: Backup of all releases in AWS-managed service
2. **Security**: No credentials stored, OIDC-based authentication
3. **Automation**: Triggered automatically on successful releases
4. **Compliance**: Artifacts stored in controlled AWS environment
5. **Performance**: Fast artifact retrieval from AWS network
6. **Recovery**: Multiple restore options available

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CodeArtifact documentation
3. Check GitHub Actions logs for detailed error messages
4. Open an issue in the repository

---

> **Note**: This is an optional feature that provides enterprise-grade package backup capabilities.
> It is not required for standard operation of the platform but can be enabled when needed.