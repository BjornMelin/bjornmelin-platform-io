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
    architecture?: lambdaCore.Architecture;
  };
  class NodejsFunction extends lambdaCore.Function {
    constructor(scope: Construct, id: string, props: MinimalProps) {
      super(scope, id, {
        runtime: props.runtime,
        handler: props.handler ?? "handler",
        code: lambdaCore.Code.fromInline("exports.handler = async () => {}"),
        environment: props.environment,
        architecture: props.architecture ?? lambdaCore.Architecture.ARM_64,
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
  const app = new cdk.App({
    context: {
      "@aws-cdk/aws-kms:applyImportedAliasPermissionsToPrincipal": true,
    },
  });
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
    allowedOrigins: ["https://example.com"],
    ssmRecipientEmailParam: "/portfolio/prod/CONTACT_EMAIL",
    ssmResendApiKeyParam: "/portfolio/prod/resend/api-key",
    tags: { Project: "Test" },
  });

  return Template.fromStack(stack);
};

describe("EmailStack", () => {
  it("sets SSM param env vars for recipient email and Resend API key", () => {
    const template = buildEmailStackTemplate();

    // Lambda env contains SSM parameter paths
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.objectLike({
          SSM_RECIPIENT_EMAIL_PARAM: "/portfolio/prod/CONTACT_EMAIL",
          SSM_RESEND_API_KEY_PARAM: "/portfolio/prod/resend/api-key",
          DOMAIN_NAME: "example.com",
        }),
      },
    });
  });

  it("grants ssm:GetParameter for both SSM parameters", () => {
    const template = buildEmailStackTemplate();

    // IAM permission for ssm:GetParameter on both parameter ARNs
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "ssm:GetParameter",
            Effect: "Allow",
            Resource: Match.arrayWith([
              Match.stringLikeRegexp(
                "arn:aws:ssm:us-east-1:111111111111:parameter/portfolio/prod/CONTACT_EMAIL",
              ),
              Match.stringLikeRegexp(
                "arn:aws:ssm:us-east-1:111111111111:parameter/portfolio/prod/resend/api-key",
              ),
            ]),
          }),
        ]),
      },
    });
  });

  it("grants kms:Decrypt for the production email service key", () => {
    const template = buildEmailStackTemplate();

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "kms:Decrypt",
            Effect: "Allow",
            Condition: Match.objectLike({
              "ForAnyValue:StringEquals": {
                "kms:ResourceAliases": "alias/portfolio-email-service",
              },
            }),
            Resource: Match.anyValue(),
          }),
        ]),
      },
    });
  });

  it("creates API Gateway with custom domain and base path mapping", () => {
    const template = buildEmailStackTemplate();

    // One DomainName and BasePathMapping for API custom domain
    template.resourceCountIs("AWS::ApiGateway::DomainName", 1);
    template.resourceCountIs("AWS::ApiGateway::BasePathMapping", 1);

    // Stage has tracing enabled
    template.hasResourceProperties("AWS::ApiGateway::Stage", {
      TracingEnabled: true,
    });
  });

  it("creates Lambda function with ARM64 architecture", () => {
    const template = buildEmailStackTemplate();

    template.hasResourceProperties("AWS::Lambda::Function", {
      Architectures: ["arm64"],
      Runtime: "nodejs20.x",
    });
  });

  it("creates MX record for send subdomain (Resend bounce handling)", () => {
    const template = buildEmailStackTemplate();

    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Type: "MX",
      Name: "send.example.com.",
      ResourceRecords: ["10 feedback-smtp.us-east-1.amazonses.com"],
      TTL: "3600",
    });
  });

  it("creates SPF TXT record for send subdomain", () => {
    const template = buildEmailStackTemplate();

    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Type: "TXT",
      Name: "send.example.com.",
      ResourceRecords: ['"v=spf1 include:amazonses.com ~all"'],
      TTL: "3600",
    });
  });
});
