import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { DeploymentStackProps } from "../types/stack-props";

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // Add tags
    cdk.Tags.of(this).add("Stack", "Deployment");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    if (props.legacyIamUser?.enabled) {
      const deploymentUser = new iam.User(this, "GithubActionsDeployment", {
        userName: `${props.environment}-portfolio-deployment-user`,
      });

      const s3DeploymentPolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
        resources: [props.bucket.bucketArn, `${props.bucket.bucketArn}/*`],
      });

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

      deploymentUser.addToPrincipalPolicy(s3DeploymentPolicy);
      deploymentUser.addToPrincipalPolicy(cloudFrontDeploymentPolicy);
      deploymentUser.addToPrincipalPolicy(cloudFormationPolicy);

      const accessKey = new iam.CfnAccessKey(this, "DeploymentUserAccessKey", {
        userName: deploymentUser.userName,
      });

      const secretName =
        props.legacyIamUser.secretName ?? `${props.environment}/deployment/legacy-user`;

      const legacyCredentials = new secretsmanager.Secret(this, "LegacyDeploymentCredentials", {
        secretName,
        description:
          "Legacy IAM user credentials for GitHub Actions. Remove after migrating to OIDC.",
        secretObjectValue: {
          accessKeyId: cdk.SecretValue.unsafePlainText(accessKey.ref),
          secretAccessKey: cdk.SecretValue.unsafePlainText(accessKey.attrSecretAccessKey),
          userArn: cdk.SecretValue.unsafePlainText(deploymentUser.userArn),
        },
      });

      legacyCredentials.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

      new cdk.CfnOutput(this, "LegacyDeploymentUserArn", {
        value: deploymentUser.userArn,
        description: "ARN of the legacy deployment IAM user (to be retired).",
        exportName: `${props.environment}-legacy-deployment-user-arn`,
      });

      new cdk.CfnOutput(this, "LegacyDeploymentCredentialsSecretArn", {
        value: legacyCredentials.secretArn,
        description: "Secrets Manager ARN storing the legacy deployment credentials.",
        exportName: `${props.environment}-legacy-deployment-credentials-secret-arn`,
      });
    }
  }
}
