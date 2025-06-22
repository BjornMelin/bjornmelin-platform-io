import * as cdk from "aws-cdk-lib";
import * as codeartifact from "aws-cdk-lib/aws-codeartifact";
import * as iam from "aws-cdk-lib/aws-iam";
import { NagSuppressions } from "cdk-nag";
import type { Construct } from "constructs";

export interface CodeArtifactStackProps extends cdk.StackProps {
  /**
   * GitHub repository in format "owner/repo"
   */
  githubRepository: string;

  /**
   * Branch names that are allowed to publish
   * @default ['main']
   */
  allowedBranches?: string[];

  /**
   * Domain name for CodeArtifact
   * @default 'bjornmelin-platform'
   */
  domainName?: string;

  /**
   * Repository name for CodeArtifact
   * @default 'platform-releases'
   */
  repositoryName?: string;
}

export class CodeArtifactStack extends cdk.Stack {
  public readonly domain: codeartifact.CfnDomain;
  public readonly repository: codeartifact.CfnRepository;
  public readonly githubRole: iam.Role;

  constructor(scope: Construct, id: string, props: CodeArtifactStackProps) {
    super(scope, id, props);

    const domainName = props.domainName ?? "bjornmelin-platform";
    const repositoryName = props.repositoryName ?? "platform-releases";
    const allowedBranches = props.allowedBranches ?? ["main"];

    // Create CodeArtifact domain
    this.domain = new codeartifact.CfnDomain(this, "CodeArtifactDomain", {
      domainName: domainName,
      permissionsPolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DomainPolicy",
            Effect: "Allow",
            Principal: {
              AWS: this.account,
            },
            Action: [
              "codeartifact:CreateRepository",
              "codeartifact:DescribeDomain",
              "codeartifact:GetAuthorizationToken",
              "codeartifact:GetDomainPermissionsPolicy",
              "codeartifact:ListRepositoriesInDomain",
            ],
            Resource: "*",
          },
        ],
      },
    });

    // Create CodeArtifact repository
    this.repository = new codeartifact.CfnRepository(this, "CodeArtifactRepository", {
      domainName: this.domain.domainName,
      repositoryName: repositoryName,
      description:
        "Repository for platform npm releases with automatic backups from GitHub Actions",
      externalConnections: ["public:npmjs"],
      permissionsPolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "RepositoryPolicy",
            Effect: "Allow",
            Principal: {
              AWS: this.account,
            },
            Action: [
              "codeartifact:DescribePackageVersion",
              "codeartifact:DescribeRepository",
              "codeartifact:GetPackageVersionReadme",
              "codeartifact:GetRepositoryEndpoint",
              "codeartifact:ListPackageVersionAssets",
              "codeartifact:ListPackageVersionDependencies",
              "codeartifact:ListPackageVersions",
              "codeartifact:ListPackages",
              "codeartifact:PublishPackageVersion",
              "codeartifact:PutPackageMetadata",
              "codeartifact:ReadFromRepository",
            ],
            Resource: "*",
          },
        ],
      },
    });

    this.repository.addDependency(this.domain);

    // Create OIDC provider for GitHub Actions
    const githubProvider = new iam.OpenIdConnectProvider(this, "GitHubOIDCProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: [
        "6938fd4d98bab03faadb97b34396831e3780aea1",
        "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
      ],
    });

    // Create condition for multiple branches
    const subConditions: { [key: string]: string | string[] } = {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    };

    if (allowedBranches.length === 1) {
      subConditions["token.actions.githubusercontent.com:sub"] =
        `repo:${props.githubRepository}:ref:refs/heads/${allowedBranches[0]}`;
    } else {
      subConditions["token.actions.githubusercontent.com:sub"] = allowedBranches.map(
        (branch) => `repo:${props.githubRepository}:ref:refs/heads/${branch}`,
      );
    }

    // Create IAM role for GitHub Actions
    this.githubRole = new iam.Role(this, "GitHubActionsCodeArtifactRole", {
      roleName: "GitHubActionsCodeArtifact",
      assumedBy: new iam.WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, {
        StringEquals: allowedBranches.length === 1 ? subConditions : undefined,
        StringLike: allowedBranches.length > 1 ? subConditions : undefined,
      }),
      description: "Role for GitHub Actions to publish npm packages to CodeArtifact",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add CodeArtifact permissions
    this.githubRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CodeArtifactTokenPermissions",
        effect: iam.Effect.ALLOW,
        actions: ["codeartifact:GetAuthorizationToken", "codeartifact:GetRepositoryEndpoint"],
        resources: [
          this.domain.attrArn,
          `arn:aws:codeartifact:${this.region}:${this.account}:repository/${domainName}/${repositoryName}`,
        ],
      }),
    );

    this.githubRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CodeArtifactPublishPermissions",
        effect: iam.Effect.ALLOW,
        actions: [
          "codeartifact:PublishPackageVersion",
          "codeartifact:PutPackageMetadata",
          "codeartifact:DescribePackageVersion",
          "codeartifact:ListPackageVersions",
          "codeartifact:ReadFromRepository",
        ],
        resources: [
          `arn:aws:codeartifact:${this.region}:${this.account}:package/${domainName}/${repositoryName}/*/*/*`,
          `arn:aws:codeartifact:${this.region}:${this.account}:repository/${domainName}/${repositoryName}`,
        ],
      }),
    );

    // Add STS bearer token permission
    this.githubRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "STSBearerTokenPermission",
        effect: iam.Effect.ALLOW,
        actions: ["sts:GetServiceBearerToken"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "sts:AWSServiceName": "codeartifact.amazonaws.com",
          },
        },
      }),
    );

    // CDK Nag suppressions
    NagSuppressions.addResourceSuppressions(
      this.githubRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "GetServiceBearerToken requires wildcard resource, and package resources use wildcards for flexibility",
          appliesTo: [
            "Resource::*",
            `Resource::arn:aws:codeartifact:${this.region}:${this.account}:package/${domainName}/${repositoryName}/*/*/*`,
          ],
        },
      ],
      true,
    );

    // Output values
    new cdk.CfnOutput(this, "CodeArtifactDomainName", {
      value: this.domain.domainName,
      description: "CodeArtifact domain name",
      exportName: `${this.stackName}-DomainName`,
    });

    new cdk.CfnOutput(this, "CodeArtifactRepositoryName", {
      value: this.repository.repositoryName,
      description: "CodeArtifact repository name",
      exportName: `${this.stackName}-RepositoryName`,
    });

    new cdk.CfnOutput(this, "CodeArtifactRepositoryArn", {
      value: `arn:aws:codeartifact:${this.region}:${this.account}:repository/${domainName}/${repositoryName}`,
      description: "CodeArtifact repository ARN",
      exportName: `${this.stackName}-RepositoryArn`,
    });

    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: this.githubRole.roleArn,
      description: "ARN of the IAM role for GitHub Actions",
      exportName: `${this.stackName}-GitHubRoleArn`,
    });

    new cdk.CfnOutput(this, "CodeArtifactRepositoryEndpoint", {
      value: `https://${domainName}-${this.account}.d.codeartifact.${this.region}.amazonaws.com/npm/${repositoryName}/`,
      description: "CodeArtifact npm repository endpoint",
      exportName: `${this.stackName}-RepositoryEndpoint`,
    });

    // Tag all resources
    cdk.Tags.of(this).add("Project", "bjornmelin-platform");
    cdk.Tags.of(this).add("ManagedBy", "CDK");
    cdk.Tags.of(this).add("Purpose", "ArtifactBackup");
  }
}
