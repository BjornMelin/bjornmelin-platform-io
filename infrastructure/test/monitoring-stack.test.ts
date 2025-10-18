import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import { describe, expect, it } from "vitest";
import { MonitoringStack } from "../lib/stacks/monitoring-stack";

const createMonitoringProps = (scope: cdk.App) => {
  const contextStack = new cdk.Stack(scope, "MonitoringContext");
  const bucket = s3.Bucket.fromBucketName(contextStack, "Bucket", "example-bucket");
  const distribution = cloudfront.Distribution.fromDistributionAttributes(
    contextStack,
    "Distribution",
    {
      distributionId: "D987654321",
      domainName: "dabcdef123456.cloudfront.net",
    },
  );

  return {
    env: { account: "123456789012", region: "us-east-1" },
    domainName: "example.com",
    environment: "prod" as const,
    bucket,
    distribution,
    tags: { Project: "Test" },
    alertEmailAddresses: ["alerts@example.com", "secondary@example.com"],
  };
};

describe("MonitoringStack", () => {
  it("creates an SNS subscription per alert email", () => {
    const app = new cdk.App();
    const props = createMonitoringProps(app);
    const stack = new MonitoringStack(app, "MonitoringStackUnderTest", props);
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Subscription", props.alertEmailAddresses.length);
  });

  it("throws when no alert emails are provided", () => {
    const app = new cdk.App();
    const props = createMonitoringProps(app);
    expect(
      () =>
        new MonitoringStack(app, "MonitoringStackInvalid", {
          ...props,
          alertEmailAddresses: [],
        }),
    ).toThrow(/requires at least one alert email/i);
  });
});
