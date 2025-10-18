import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { StorageStack } from "../lib/stacks/storage-stack";

describe("StorageStack", () => {
  it("creates bucket, distribution with OAC, logs bucket, and DNS records", () => {
    const app = new cdk.App();
    const parent = new cdk.Stack(app, "Parent", { env: { account: "111111111111", region: "us-east-1" } });
    const cert = acm.Certificate.fromCertificateArn(parent, "Cert", "arn:aws:acm:us-east-1:111111111111:certificate/mock");
    const hz = route53.HostedZone.fromHostedZoneAttributes(parent, "HZ", { hostedZoneId: "ZMOCK", zoneName: "example.com" });
    const stack = new StorageStack(app, "Storage", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "example.com",
      environment: "prod",
      certificate: cert,
      hostedZone: hz,
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(stack);

    // Website bucket with security settings
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketEncryption: Match.anyValue(),
      PublicAccessBlockConfiguration: Match.anyValue(),
      VersioningConfiguration: { Status: "Enabled" },
    });

    // Logs bucket with ownership preference
    template.hasResourceProperties("AWS::S3::Bucket", {
      OwnershipControls: {
        Rules: Match.arrayWith([
          Match.objectLike({ ObjectOwnership: "BucketOwnerPreferred" }),
        ]),
      },
    });

    // CloudFront distribution uses our cert and sets domain names
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Aliases: Match.arrayWith(["example.com", "www.example.com"]),
        ViewerCertificate: Match.anyValue(),
      }),
    });

    // OAC reference wired to origin
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Origins: Match.arrayWith([
          Match.objectLike({ OriginAccessControlId: Match.anyValue() }),
        ]),
      }),
    });

    // Route53 A/AAAA records for root and www
    template.resourceCountIs("AWS::Route53::RecordSet", 4);
    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Name: Match.stringLikeRegexp("^example.com\\.\"?"),
      Type: Match.anyValue(),
    });
  });
});
