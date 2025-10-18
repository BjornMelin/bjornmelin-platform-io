import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import { describe, it, vi } from "vitest";
import { DnsStack } from "../lib/stacks/dns-stack";

describe("DnsStack", () => {
  it("creates certificate validated via hosted zone and outputs", () => {
    const app = new cdk.App();

    // Mock fromLookup to avoid context provider calls
    const spy = vi
      .spyOn(route53.HostedZone, "fromLookup")
      .mockImplementation((scope, id: string, opts: { domainName: string }) => {
        return route53.HostedZone.fromHostedZoneAttributes(scope as cdk.Stack, id, {
          hostedZoneId: "ZMOCK",
          zoneName: opts.domainName,
        });
      });

    const stack = new DnsStack(app, "Dns", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "example.com",
      environment: "prod",
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(stack);

    // Certificate exists with SANs for www and api
    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      DomainName: "example.com",
      SubjectAlternativeNames: Match.arrayWith(["www.example.com", "api.example.com"]),
      DomainValidationOptions: Match.anyValue(),
    });

    // Outputs are present
    template.hasOutput("CertificateArn", Match.anyValue());
    template.hasOutput("HostedZoneId", Match.anyValue());
    template.hasOutput("HostedZoneName", Match.anyValue());

    spy.mockRestore();
  });
});
