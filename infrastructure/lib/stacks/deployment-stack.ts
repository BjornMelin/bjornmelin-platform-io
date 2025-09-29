import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import type { DeploymentStackProps } from "../types/stack-props";

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // GitHub Actions deployment user
    const deploymentUser = new iam.User(this, "GithubActionsDeployment", {
      userName: `${props.environment}-portfolio-deployment-user`,
    });

    // Deployment policy for S3 access
    const s3DeploymentPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
      resources: [props.bucket.bucketArn, `${props.bucket.bucketArn}/*`],
    });

    // Deployment policy for CloudFront invalidation
    const cloudFrontDeploymentPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations",
      ],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${props.distribution.distributionId}`,
      ],
    });

    // Deployment policy for CloudFormation outputs
    const cloudFormationPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["cloudformation:DescribeStacks"],
      resources: [
        `arn:aws:cloudformation:${this.region}:${this.account}:stack/${this.stackName}/*`,
        `arn:aws:cloudformation:${this.region}:${this.account}:stack/prod-portfolio-storage/*`,
        `arn:aws:cloudformation:${this.region}:${this.account}:stack/prod-portfolio-dns/*`,
        `arn:aws:cloudformation:${this.region}:${this.account}:stack/prod-portfolio-monitoring/*`,
      ],
    });

    // Attach policies to user
    deploymentUser.addToPrincipalPolicy(s3DeploymentPolicy);
    deploymentUser.addToPrincipalPolicy(cloudFrontDeploymentPolicy);
    deploymentUser.addToPrincipalPolicy(cloudFormationPolicy);

    // Create access key for GitHub Actions
    const accessKey = new iam.CfnAccessKey(this, "DeploymentUserAccessKey", {
      userName: deploymentUser.userName,
    });

    // Add tags
    cdk.Tags.of(this).add("Stack", "Deployment");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "DeploymentUserArn", {
      value: deploymentUser.userArn,
      description: "ARN of the deployment IAM user",
      exportName: `${props.environment}-deployment-user-arn`,
    });

    new cdk.CfnOutput(this, "DeploymentUserAccessKeyId", {
      value: accessKey.ref,
      description: "AWS access key ID for GitHub Actions",
      exportName: `${props.environment}-deployment-access-key-id`,
    });

    new cdk.CfnOutput(this, "DeploymentUserSecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
      description: "AWS secret access key for GitHub Actions",
      exportName: `${props.environment}-deployment-secret-access-key`,
    });
  }
}
