# AWS CodeArtifact Integration Plan

## Overview

This document outlines the integration of AWS CodeArtifact as a backup repository for npm releases from the bjornmelin-platform-io project. The integration uses GitHub Actions with OpenID Connect (OIDC) for secure, credential-less authentication to AWS.

## Architecture

### Components
1. **GitHub Actions OIDC Provider**: Provides temporary AWS credentials
2. **IAM Role**: Assumes permissions for CodeArtifact operations
3. **CodeArtifact Domain**: Organization-level artifact management
4. **CodeArtifact Repository**: Stores npm packages
5. **GitHub Workflow**: Publishes packages on release

### Security Model
- No long-lived AWS credentials stored in GitHub
- Temporary credentials via OIDC token exchange
- Least-privilege IAM policies
- Repository-scoped access control

## Implementation Steps

### 1. AWS Infrastructure Setup

#### Create CodeArtifact Domain
```bash
aws codeartifact create-domain \
  --domain bjornmelin-platform \
  --domain-description "Domain for bjornmelin platform artifacts"
```

#### Create CodeArtifact Repository
```bash
aws codeartifact create-repository \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --description "Repository for platform npm releases" \
  --repository-type npm
```

#### Create Upstream Repository (Optional)
Connect to npmjs for dependency resolution:
```bash
aws codeartifact associate-external-connection \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --external-connection public:npmjs
```

### 2. GitHub OIDC Setup

#### Create OIDC Identity Provider
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
              1c58a3a8518e8759bf075b76b750d4f2df264fcd
```

#### Create IAM Role
Create a role with trust policy for GitHub Actions:

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

#### IAM Policy for CodeArtifact
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
        "codeartifact:PutPackageMetadata"
      ],
      "Resource": [
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:domain/bjornmelin-platform",
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:repository/bjornmelin-platform/platform-releases",
        "arn:aws:codeartifact:REGION:ACCOUNT_ID:package/bjornmelin-platform/platform-releases/*"
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

### 3. GitHub Workflow Configuration

Create `.github/workflows/codeartifact-backup.yml`:

```yaml
name: CodeArtifact Backup

on:
  workflow_run:
    workflows: ["Release"]
    types:
      - completed
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: us-east-1
  CODEARTIFACT_DOMAIN: bjornmelin-platform
  CODEARTIFACT_REPOSITORY: platform-releases

jobs:
  backup-to-codeartifact:
    name: Backup to CodeArtifact
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build package
        run: pnpm build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsCodeArtifact
          role-session-name: GitHubActions-CodeArtifact
          aws-region: ${{ env.AWS_REGION }}

      - name: Get CodeArtifact token
        id: codeartifact
        run: |
          CODEARTIFACT_TOKEN=$(aws codeartifact get-authorization-token \
            --domain ${{ env.CODEARTIFACT_DOMAIN }} \
            --query authorizationToken \
            --output text)
          echo "::add-mask::$CODEARTIFACT_TOKEN"
          echo "token=$CODEARTIFACT_TOKEN" >> $GITHUB_OUTPUT

      - name: Configure npm for CodeArtifact
        run: |
          aws codeartifact get-repository-endpoint \
            --domain ${{ env.CODEARTIFACT_DOMAIN }} \
            --repository ${{ env.CODEARTIFACT_REPOSITORY }} \
            --format npm \
            --query repositoryEndpoint \
            --output text | sed 's/https://' > repo_url.txt
          
          REPO_URL=$(cat repo_url.txt)
          npm config set registry https:$REPO_URL
          npm config set $REPO_URL:_authToken=${{ steps.codeartifact.outputs.token }}

      - name: Publish to CodeArtifact
        run: |
          # Check if package.json has publishConfig
          if ! grep -q "publishConfig" package.json; then
            # Add CodeArtifact registry to package.json
            node -e "
              const pkg = require('./package.json');
              pkg.publishConfig = {
                registry: 'https:$(cat repo_url.txt)'
              };
              require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
            "
          fi
          
          # Publish the package
          npm publish --access public

      - name: Verify package in CodeArtifact
        run: |
          PACKAGE_NAME=$(node -p "require('./package.json').name")
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          
          aws codeartifact describe-package-version \
            --domain ${{ env.CODEARTIFACT_DOMAIN }} \
            --repository ${{ env.CODEARTIFACT_REPOSITORY }} \
            --format npm \
            --package $PACKAGE_NAME \
            --package-version $PACKAGE_VERSION
```

### 4. Infrastructure as Code (CDK)

Create `infrastructure/codeartifact-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codeartifact from 'aws-cdk-lib/aws-codeartifact';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CodeArtifactStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create CodeArtifact domain
    const domain = new codeartifact.CfnDomain(this, 'BjornmelinPlatformDomain', {
      domainName: 'bjornmelin-platform',
    });

    // Create CodeArtifact repository
    const repository = new codeartifact.CfnRepository(this, 'PlatformReleasesRepo', {
      domainName: domain.domainName,
      repositoryName: 'platform-releases',
      description: 'Repository for platform npm releases',
      externalConnections: ['public:npmjs'],
    });

    repository.addDependency(domain);

    // Create OIDC provider for GitHub Actions
    const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: [
        '6938fd4d98bab03faadb97b34396831e3780aea1',
        '1c58a3a8518e8759bf075b76b750d4f2df264fcd'
      ],
    });

    // Create IAM role for GitHub Actions
    const githubRole = new iam.Role(this, 'GitHubActionsCodeArtifactRole', {
      roleName: 'GitHubActionsCodeArtifact',
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': 'repo:bjornmelin/bjornmelin-platform-io:ref:refs/heads/main',
          },
        }
      ),
      description: 'Role for GitHub Actions to publish to CodeArtifact',
    });

    // Add CodeArtifact permissions
    githubRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codeartifact:GetAuthorizationToken',
        'codeartifact:ReadFromRepository',
        'codeartifact:PublishPackageVersion',
        'codeartifact:PutPackageMetadata',
        'codeartifact:DescribePackageVersion',
      ],
      resources: [
        domain.attrArn,
        `arn:aws:codeartifact:${this.region}:${this.account}:repository/${domain.domainName}/${repository.repositoryName}`,
        `arn:aws:codeartifact:${this.region}:${this.account}:package/${domain.domainName}/${repository.repositoryName}/*/*/*`,
      ],
    }));

    // Add STS bearer token permission
    githubRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:GetServiceBearerToken'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'sts:AWSServiceName': 'codeartifact.amazonaws.com',
        },
      },
    }));

    // Output values
    new cdk.CfnOutput(this, 'CodeArtifactDomainName', {
      value: domain.domainName,
      description: 'CodeArtifact domain name',
    });

    new cdk.CfnOutput(this, 'CodeArtifactRepositoryName', {
      value: repository.repositoryName,
      description: 'CodeArtifact repository name',
    });

    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: githubRole.roleArn,
      description: 'ARN of the IAM role for GitHub Actions',
    });
  }
}
```

### 5. Testing Strategy

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
1. Create a test branch
2. Modify workflow to run on push to test branch
3. Verify OIDC authentication
4. Confirm package appears in CodeArtifact

### 6. Monitoring and Alerting

#### CloudWatch Metrics
- Package publish success/failure rate
- Repository storage usage
- Authentication token generation

#### GitHub Actions Notifications
- Workflow failure notifications
- Successful backup confirmations

### 7. Recovery Procedures

#### Restore from CodeArtifact
```bash
# Install specific version from CodeArtifact
npm install bjornmelin-platform-io@1.0.1 --registry https://[domain-account].d.codeartifact.[region].amazonaws.com/npm/[repository]/
```

#### Bulk Migration
Script to migrate all versions to npm registry:
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

## Benefits

1. **Resilience**: Backup of all releases in AWS-managed service
2. **Security**: No credentials stored, OIDC-based authentication
3. **Automation**: Triggered automatically on successful releases
4. **Compliance**: Artifacts stored in controlled AWS environment
5. **Performance**: Fast artifact retrieval from AWS network

## Maintenance

### Regular Tasks
- Review IAM permissions quarterly
- Update OIDC thumbprints if GitHub changes them
- Monitor storage costs and implement lifecycle policies
- Test recovery procedures monthly

### Troubleshooting

#### Common Issues
1. **Authentication failures**: Check OIDC provider and role trust policy
2. **Publishing errors**: Verify package.json format and permissions
3. **Token expiration**: Ensure token lifetime is sufficient (default: 12 hours)

#### Debug Commands
```bash
# Check domain status
aws codeartifact describe-domain --domain bjornmelin-platform

# List packages
aws codeartifact list-packages \
  --domain bjornmelin-platform \
  --repository platform-releases

# View package details
aws codeartifact describe-package \
  --domain bjornmelin-platform \
  --repository platform-releases \
  --format npm \
  --package bjornmelin-platform-io
```

## Cost Estimation

- **Storage**: $0.05 per GB per month
- **Data Transfer**: $0.09 per GB (out to internet)
- **Requests**: $0.05 per 10,000 requests

Estimated monthly cost for 100 releases: ~$5-10

## Next Steps

1. Create AWS resources using CDK
2. Configure GitHub secrets (AWS_ACCOUNT_ID)
3. Add workflow to repository
4. Test with a pre-release version
5. Enable for production releases
6. Document in project README