import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { afterEach, describe, expect, it } from "vitest";
import { DnsStack } from "../lib/stacks/dns-stack";
import { createBaseProps, mockHostedZoneLookup } from "./helpers";

describe("DnsStack", () => {
  let spy: ReturnType<typeof mockHostedZoneLookup>;

  afterEach(() => {
    spy?.mockRestore();
  });

  it("creates certificate with correct SANs", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(app, "Dns", createBaseProps({ domainName: "example.com" }));
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      DomainName: "example.com",
      SubjectAlternativeNames: Match.arrayWith(["www.example.com", "api.example.com"]),
    });
  });

  it("uses DNS validation for certificate", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(app, "Dns", createBaseProps({ domainName: "example.com" }));
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      ValidationMethod: "DNS",
    });
  });

  it("exports certificate ARN", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(app, "Dns", createBaseProps({ environment: "prod" }));
    const template = Template.fromStack(stack);

    template.hasOutput("CertificateArn", {
      Description: "SSL Certificate ARN",
      Export: { Name: "prod-certificate-arn" },
    });
  });

  it("exports hosted zone ID and name", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(app, "Dns", createBaseProps({ environment: "prod" }));
    const template = Template.fromStack(stack);

    template.hasOutput("HostedZoneId", {
      Description: "Hosted Zone ID",
      Export: { Name: "prod-hosted-zone-id" },
    });

    template.hasOutput("HostedZoneName", {
      Description: "Hosted Zone Name",
      Export: { Name: "prod-hosted-zone-name" },
    });
  });

  it("applies standard tags", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(
      app,
      "Dns",
      createBaseProps({ environment: "prod", tags: { Project: "Portfolio", Owner: "Test" } }),
    );
    const template = Template.fromStack(stack);
    const tags = template.findResources("AWS::CertificateManager::Certificate");
    const certLogicalId = Object.keys(tags)[0];

    expect(tags[certLogicalId].Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: "Stack", Value: "DNS" }),
        expect.objectContaining({ Key: "Environment", Value: "prod" }),
        expect.objectContaining({ Key: "Project", Value: "Portfolio" }),
        expect.objectContaining({ Key: "Owner", Value: "Test" }),
      ]),
    );
  });

  it("exposes hostedZone and certificate properties", () => {
    const app = new cdk.App();
    spy = mockHostedZoneLookup();

    const stack = new DnsStack(app, "Dns", createBaseProps({ domainName: "example.com" }));

    expect(stack.hostedZone).toBeDefined();
    expect(stack.certificate).toBeDefined();
    expect(stack.hostedZone.zoneName).toBe("example.com");
  });
});
