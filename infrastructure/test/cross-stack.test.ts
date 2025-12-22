import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import { describe, expect, it, vi } from "vitest";
import { DnsStack } from "../lib/stacks/dns-stack";
import { EmailStack } from "../lib/stacks/email-stack";
import { StorageStack } from "../lib/stacks/storage-stack";

describe("Cross-stack references", () => {
  // Mock HostedZone.fromLookup to avoid context provider calls
  function mockHostedZoneLookup() {
    return vi
      .spyOn(route53.HostedZone, "fromLookup")
      .mockImplementation((scope, id: string, opts: { domainName: string }) => {
        return route53.HostedZone.fromHostedZoneAttributes(scope as cdk.Stack, id, {
          hostedZoneId: "ZMOCK",
          zoneName: opts.domainName,
        });
      });
  }

  it("exports certificate ARN from DnsStack", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const dnsStack = new DnsStack(app, "DnsExport", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(dnsStack);

    // Verify CertificateArn output exists
    template.hasOutput("CertificateArn", Match.anyValue());

    // Verify the certificate property is exposed
    expect(dnsStack.certificate).toBeDefined();

    spy.mockRestore();
  });

  it("exports hosted zone ID from DnsStack", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const dnsStack = new DnsStack(app, "DnsZoneExport", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(dnsStack);

    // Verify HostedZoneId output exists
    template.hasOutput("HostedZoneId", Match.anyValue());
    template.hasOutput("HostedZoneName", Match.anyValue());

    // Verify the hostedZone property is exposed
    expect(dnsStack.hostedZone).toBeDefined();

    spy.mockRestore();
  });

  it("imports certificate in StorageStack", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };

    const dnsStack = new DnsStack(app, "DnsForStorage", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const storageStack = new StorageStack(app, "StorageWithCert", {
      env,
      domainName: "test.example.com",
      environment: "test",
      certificate: dnsStack.certificate,
      hostedZone: dnsStack.hostedZone,
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(storageStack);

    // Verify CloudFront distribution uses the certificate
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        ViewerCertificate: Match.objectLike({
          AcmCertificateArn: Match.anyValue(),
          SslSupportMethod: "sni-only",
        }),
      }),
    });

    spy.mockRestore();
  });

  it("imports hosted zone in EmailStack", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };

    const dnsStack = new DnsStack(app, "DnsForEmail", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const emailStack = new EmailStack(app, "EmailWithZone", {
      env,
      domainName: "test.example.com",
      environment: "test",
      hostedZone: dnsStack.hostedZone,
      allowedOrigins: ["https://test.example.com"],
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(emailStack);

    // Verify Lambda function is created for contact form
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs20.x",
    });

    // Verify API Gateway is created
    template.hasResourceProperties("AWS::ApiGateway::RestApi", Match.anyValue());

    spy.mockRestore();
  });

  it("StorageStack exposes bucket and distribution for downstream stacks", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };

    const dnsStack = new DnsStack(app, "DnsForStorageExports", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const storageStack = new StorageStack(app, "StorageExports", {
      env,
      domainName: "test.example.com",
      environment: "test",
      certificate: dnsStack.certificate,
      hostedZone: dnsStack.hostedZone,
      tags: { Project: "Test" },
    });

    // Verify bucket and distribution are exposed for other stacks
    expect(storageStack.bucket).toBeDefined();
    expect(storageStack.distribution).toBeDefined();

    const template = Template.fromStack(storageStack);

    // Verify outputs exist for cross-stack references
    template.hasOutput("WebsiteBucketName", Match.anyValue());
    template.hasOutput("DistributionId", Match.anyValue());

    spy.mockRestore();
  });

  it("validates cross-region certificate requirement", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    // DnsStack should be in us-east-1 for CloudFront certificate
    const dnsStack = new DnsStack(app, "DnsUsEast1", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    expect(dnsStack.region).toBe("us-east-1");

    spy.mockRestore();
  });
});
