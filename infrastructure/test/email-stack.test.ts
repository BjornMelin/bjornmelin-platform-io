import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { describe, it, vi } from "vitest";
import { EmailStack } from "../lib/stacks/email-stack";

// Avoid esbuild bundling during assertions by replacing NodejsFunction with a plain Lambda Function.
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

/**
 * Synthesizes the email stack for assertions using a shared configuration.
 *
 * @returns CloudFormation template for the Email stack fixture.
 */
const buildEmailStackTemplate = (): Template => {
  const app = new cdk.App();
  const dummy = new cdk.Stack(app, "Dummy", {
    env: { account: "111111111111", region: "us-east-1" },
  });
  const importedZone = route53.HostedZone.fromHostedZoneAttributes(dummy, "HostedZone", {
    hostedZoneId: "Z123456EXAMPLE",
    zoneName: "example.com",
  });
  const stack = new EmailStack(app, "Email", {
    env: { account: "111111111111", region: "us-east-1" },
    domainName: "example.com",
    environment: "prod",
    hostedZone: importedZone,
    senderEmail: "no-reply@example.com",
    allowedOrigins: ["https://example.com"],
    ssmRecipientEmailParam: "/portfolio/prod/CONTACT_EMAIL",
    tags: { Project: "Test" },
  });

  return Template.fromStack(stack);
};

describe("EmailStack", () => {
  it("sets SSM param env and grants ssm:GetParameter", () => {
    const template = buildEmailStackTemplate();

    // Lambda env contains SSM_RECIPIENT_EMAIL_PARAM and does NOT contain RECIPIENT_EMAIL
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.objectLike({
          SSM_RECIPIENT_EMAIL_PARAM: "/portfolio/prod/CONTACT_EMAIL",
        }),
      },
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.not(Match.objectLike({ RECIPIENT_EMAIL: Match.anyValue() })),
      },
    });

    // IAM permission for ssm:GetParameter on the exact parameter ARN
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.anyValue(),
            Effect: "Allow",
            Resource: Match.stringLikeRegexp(
              "arn:aws:ssm:us-east-1:111111111111:parameter/portfolio/prod/CONTACT_EMAIL",
            ),
          }),
        ]),
      },
    });
  });

  it("creates SES DNS records without duplicate domain suffixes", () => {
    const template = buildEmailStackTemplate();
    const recordSets = template.findResources("AWS::Route53::RecordSet");
    const serialized = JSON.stringify(recordSets);
    expect(serialized).not.toContain("._domainkey.example.com._domainkey");
    expect(serialized).not.toContain("_amazonses.example.com._amazonses");
  });
});
