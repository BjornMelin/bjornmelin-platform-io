# CodeArtifact Integration Guide

This guide provides quick reference for using AWS CodeArtifact as a backup repository for npm releases.

## Quick Start

### 1. Initial Setup (One-time)

```bash
# Run the setup script to create all AWS resources
./scripts/codeartifact-setup.sh setup

# This will:
# - Create CodeArtifact domain and repository
# - Set up GitHub OIDC provider
# - Create IAM role with proper permissions
# - Display the AWS Account ID to add as GitHub secret
```

### 2. GitHub Configuration

Add the following secret to your GitHub repository:
- `AWS_ACCOUNT_ID`: Your AWS account ID (shown by setup script)

The workflow is already configured in `.github/workflows/codeartifact-backup.yml`

### 3. Infrastructure as Code (Alternative)

If you prefer to use CDK:

```bash
cd infrastructure
npm install
npm run build

# Deploy the stack
npx cdk deploy BjornmelinCodeArtifactStack \
  --context githubRepository=bjornmelin/bjornmelin-platform-io
```

## Usage

### Automatic Backups

Backups happen automatically when:
1. A release workflow completes successfully
2. The CodeArtifact backup workflow is triggered

### Manual Backup

Trigger a manual backup from GitHub Actions:
1. Go to Actions → CodeArtifact Backup
2. Click "Run workflow"
3. Optionally specify a version to backup

### Local Testing

```bash
# Configure npm for CodeArtifact
./scripts/codeartifact-setup.sh configure-npm

# Test publishing
./scripts/codeartifact-setup.sh test
```

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

### Backup Metadata

```bash
# Create local backup of all metadata
./scripts/codeartifact-recovery.sh backup
```

## Monitoring

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

Check the workflow runs at:
`https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeartifact-backup.yml`

## Troubleshooting

### Authentication Issues

```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check role trust policy
aws iam get-role --role-name GitHubActionsCodeArtifact
```

### Publishing Failures

```bash
# Check if package already exists
aws codeartifact describe-package-version \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io \
  --package-version 1.0.1

# View repository permissions
aws codeartifact get-repository-permissions-policy \
  --domain bjornmelin-platform \
  --repository platform-releases
```

### Token Issues

```bash
# Generate new token (valid for 12 hours)
aws codeartifact get-authorization-token \
  --domain bjornmelin-platform \
  --query authorizationToken \
  --output text

# Use with npm
npm config set //[domain-url]/npm/[repo]/:_authToken=[token]
```

## Cost Management

### View Storage Usage

```bash
# Check repository size (via CloudWatch metrics)
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

To manage costs, consider removing old versions:

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

## Security Best Practices

1. **Least Privilege**: The IAM role only has permissions for specific CodeArtifact operations
2. **OIDC Authentication**: No long-lived credentials stored in GitHub
3. **Branch Protection**: Only the main branch can publish by default
4. **Audit Trail**: All operations are logged in CloudTrail

## Advanced Configuration

### Multiple Branches

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

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CodeArtifact documentation
3. Check GitHub Actions logs for detailed error messages
4. Open an issue in the repository