import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { describe, it, vi } from "vitest";
import { EmailStack } from "../lib/stacks/email-stack";

// Avoid bundling during test by stubbing NodejsFunction
vi.mock("aws-cdk-lib/aws-lambda-nodejs", async () => {
  const lambdaCore = await import("aws-cdk-lib/aws-lambda");
  type MinimalProps = {
    runtime: lambdaCore.Runtime;
    handler?: string;
    environment?: Record<string, string>;
  };
  class NodejsFunction extends lambdaCore.Function {
    constructor(scope: Construct, id: string, props: MinimalProps) {
      super(scope, id, {
        runtime: props.runtime,
        handler: props.handler ?? "handler",
        code: lambdaCore.Code.fromInline("exports.handler = async () => {}"),
        environment: props.environment,
      });
    }
  }
  return { NodejsFunction };
});

describe("EmailStack extras", () => {
  it("creates API Gateway domain + base path mapping and enables stage tracing", () => {
    const app = new cdk.App();
    const parent = new cdk.Stack(app, "Parent", {
      env: { account: "111111111111", region: "us-east-1" },
    });
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(parent, "HZ", {
      hostedZoneId: "ZMOCK",
      zoneName: "example.com",
    });

    const stack = new EmailStack(app, "EmailExtra", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "example.com",
      environment: "prod",
      hostedZone,
      senderEmail: "no-reply@example.com",
      allowedOrigins: ["https://example.com"],
      ssmRecipientEmailParam: "/portfolio/prod/CONTACT_EMAIL",
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(stack);

    // One DomainName and BasePathMapping for API custom domain
    template.resourceCountIs("AWS::ApiGateway::DomainName", 1);
    template.resourceCountIs("AWS::ApiGateway::BasePathMapping", 1);

    // Stage has tracing enabled
    template.hasResourceProperties("AWS::ApiGateway::Stage", {
      TracingEnabled: true,
    });
  });
});
