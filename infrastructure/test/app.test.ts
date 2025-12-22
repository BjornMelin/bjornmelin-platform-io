import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import { describe, expect, it, vi } from "vitest";
import { CONFIG, getStackName } from "../lib/constants";
import { DeploymentStack } from "../lib/stacks/deployment-stack";
import { DnsStack } from "../lib/stacks/dns-stack";
import { EmailStack } from "../lib/stacks/email-stack";
import { MonitoringStack } from "../lib/stacks/monitoring-stack";
import { StorageStack } from "../lib/stacks/storage-stack";

describe("CDK App Stack Orchestration", () => {
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

  it("synthesizes all stacks without errors", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };

    // Create all stacks
    const dnsStack = new DnsStack(app, "TestDns", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const storageStack = new StorageStack(app, "TestStorage", {
      env,
      domainName: "test.example.com",
      environment: "test",
      certificate: dnsStack.certificate,
      hostedZone: dnsStack.hostedZone,
      tags: { Project: "Test" },
    });

    const deploymentStack = new DeploymentStack(app, "TestDeployment", {
      env,
      domainName: "test.example.com",
      environment: "test",
      bucket: storageStack.bucket,
      distribution: storageStack.distribution,
      tags: { Project: "Test" },
    });

    const monitoringStack = new MonitoringStack(app, "TestMonitoring", {
      env,
      domainName: "test.example.com",
      environment: "test",
      bucket: storageStack.bucket,
      distribution: storageStack.distribution,
      alertEmailAddresses: ["test@example.com"],
      tags: { Project: "Test" },
    });

    const emailStack = new EmailStack(app, "TestEmail", {
      env,
      domainName: "test.example.com",
      environment: "test",
      hostedZone: dnsStack.hostedZone,
      allowedOrigins: ["https://test.example.com"],
      tags: { Project: "Test" },
    });

    // Verify all stacks can be synthesized
    expect(() => Template.fromStack(dnsStack)).not.toThrow();
    expect(() => Template.fromStack(storageStack)).not.toThrow();
    expect(() => Template.fromStack(deploymentStack)).not.toThrow();
    expect(() => Template.fromStack(monitoringStack)).not.toThrow();
    expect(() => Template.fromStack(emailStack)).not.toThrow();

    spy.mockRestore();
  });

  it("validates stack dependency chain", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };

    const dnsStack = new DnsStack(app, "DepDns", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: { Project: "Test" },
    });

    const storageStack = new StorageStack(app, "DepStorage", {
      env,
      domainName: "test.example.com",
      environment: "test",
      certificate: dnsStack.certificate,
      hostedZone: dnsStack.hostedZone,
      tags: { Project: "Test" },
    });
    storageStack.addDependency(dnsStack);

    const deploymentStack = new DeploymentStack(app, "DepDeployment", {
      env,
      domainName: "test.example.com",
      environment: "test",
      bucket: storageStack.bucket,
      distribution: storageStack.distribution,
      tags: { Project: "Test" },
    });
    deploymentStack.addDependency(storageStack);

    // Verify dependencies are set correctly
    expect(storageStack.dependencies).toContain(dnsStack);
    expect(deploymentStack.dependencies).toContain(storageStack);

    spy.mockRestore();
  });

  it("applies standard tags to all resources", () => {
    const app = new cdk.App();
    const spy = mockHostedZoneLookup();

    const env = { account: "111111111111", region: "us-east-1" };
    const testTags = { Project: "TestProject" };

    const dnsStack = new DnsStack(app, "TagsDns", {
      env,
      domainName: "test.example.com",
      environment: "test",
      tags: testTags,
    });

    const template = Template.fromStack(dnsStack);

    // Verify tags are applied to resources (Certificate in this case)
    // Stack adds its own tags (Stack) plus passed-in Project tag
    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: "Project", Value: "TestProject" }),
        Match.objectLike({ Key: "Stack", Value: "DNS" }),
      ]),
    });

    spy.mockRestore();
  });
});

describe("getStackName", () => {
  it("generates correct stack name for prod environment", () => {
    const result = getStackName("dns", "prod");
    // Format: ${env}-portfolio-${stackType}
    expect(result).toBe("prod-portfolio-dns");
  });

  it("generates correct stack name for staging environment", () => {
    const result = getStackName("storage", "staging");
    expect(result).toBe("staging-portfolio-storage");
  });
});

describe("CONFIG", () => {
  it("has prod configuration with correct domain", () => {
    expect(CONFIG.prod.domainName).toBe("bjornmelin.io");
    expect(CONFIG.prod.environment).toBe("prod");
  });

  it("has standard tags defined", () => {
    expect(CONFIG.tags).toHaveProperty("Project");
    expect(CONFIG.tags).toHaveProperty("Owner");
  });

  it("has alert email addresses configured", () => {
    expect(CONFIG.prod.alerts.emails).toBeInstanceOf(Array);
    expect(CONFIG.prod.alerts.emails.length).toBeGreaterThan(0);
  });
});
