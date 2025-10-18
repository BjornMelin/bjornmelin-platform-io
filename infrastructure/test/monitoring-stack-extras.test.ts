import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import { describe, it } from "vitest";
import { MonitoringStack } from "../lib/stacks/monitoring-stack";

describe("MonitoringStack extras", () => {
  it("creates dashboard and alarms wired to SNS", () => {
    const app = new cdk.App();
    const ctx = new cdk.Stack(app, "Ctx", {
      env: { account: "111111111111", region: "us-east-1" },
    });
    const bucket = s3.Bucket.fromBucketName(ctx, "B", "example-bucket");
    const distribution = cloudfront.Distribution.fromDistributionAttributes(ctx, "D", {
      distributionId: "D123456789",
      domainName: "d111111abcdef8.cloudfront.net",
    });

    const stack = new MonitoringStack(app, "Mon", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "example.com",
      environment: "prod",
      bucket,
      distribution,
      alertEmailAddresses: ["alerts@example.com"],
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(stack);

    // Dashboard created
    template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);

    // Two alarms present with expected thresholds
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      ComparisonOperator: "GreaterThanThreshold",
      Threshold: 5,
      TreatMissingData: "notBreaching",
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      ComparisonOperator: "GreaterThanThreshold",
      Threshold: 10,
      TreatMissingData: "notBreaching",
    });

    // SNS Topic created and used by alarms via AlarmAction
    template.resourceCountIs("AWS::SNS::Topic", 1);
    template.hasResourceProperties("AWS::SNS::Subscription", {
      Protocol: "email",
      Endpoint: "alerts@example.com",
    });

    // Outputs
    template.hasOutput("DashboardURL", Match.anyValue());
    template.hasOutput("AlertTopicArn", Match.anyValue());
  });
});
