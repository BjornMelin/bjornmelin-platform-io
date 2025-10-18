import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import { describe, it } from "vitest";
import { DeploymentStack } from "../lib/stacks/deployment-stack";

const createTestProps = (scope: cdk.App) => {
  const contextStack = new cdk.Stack(scope, "ContextStack");
  const bucket = s3.Bucket.fromBucketName(contextStack, "Bucket", "example-bucket");
  const distribution = cloudfront.Distribution.fromDistributionAttributes(
    contextStack,
    "Distribution",
    {
      distributionId: "D123456789",
      domainName: "d111111abcdef8.cloudfront.net",
    },
  );

  return {
    env: { account: "123456789012", region: "us-east-1" },
    domainName: "example.com",
    environment: "prod" as const,
    bucket,
    distribution,
    tags: { Project: "Test" },
  };
};

describe("DeploymentStack", () => {
  it("omits legacy IAM user resources when disabled", () => {
    const app = new cdk.App();
    const props = createTestProps(app);
    const stack = new DeploymentStack(app, "DeploymentWithoutLegacyUser", {
      ...props,
      legacyIamUser: { enabled: false },
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::IAM::User", 0);
    template.resourceCountIs("AWS::SecretsManager::Secret", 0);
  });

  it("creates legacy IAM user credentials when enabled", () => {
    const app = new cdk.App();
    const props = createTestProps(app);
    const stack = new DeploymentStack(app, "DeploymentWithLegacyUser", {
      ...props,
      legacyIamUser: {
        enabled: true,
        secretName: "/prod/example/legacy-user",
      },
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::IAM::User", 1);
    template.hasResourceProperties("AWS::SecretsManager::Secret", {
      Name: "/prod/example/legacy-user",
    });
    template.hasOutput("LegacyDeploymentUserArn", {});
    template.hasOutput("LegacyDeploymentCredentialsSecretArn", {});
  });
});
