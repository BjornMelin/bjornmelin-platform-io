import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { describe, it } from "vitest";
import { StorageStack } from "../lib/stacks/storage-stack";

describe("StorageStack", () => {
  it("creates bucket, distribution with OAC, logs bucket, and DNS records", () => {
    const app = new cdk.App();
    const parent = new cdk.Stack(app, "Parent", {
      env: { account: "111111111111", region: "us-east-1" },
    });
    const cert = acm.Certificate.fromCertificateArn(
      parent,
      "Cert",
      "arn:aws:acm:us-east-1:111111111111:certificate/mock",
    );
    const hz = route53.HostedZone.fromHostedZoneAttributes(parent, "HZ", {
      hostedZoneId: "ZMOCK",
      zoneName: "example.com",
    });
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
        Rules: Match.arrayWith([Match.objectLike({ ObjectOwnership: "BucketOwnerPreferred" })]),
      },
    });

    // CloudFront distribution uses our cert and sets domain names
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Aliases: Match.arrayWith(["example.com", "www.example.com"]),
        ViewerCertificate: Match.anyValue(),
      }),
    });

    // Static export routing: rewrite viewer requests to index.html/index.txt and return real 404s.
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({
          FunctionAssociations: Match.arrayWith([
            Match.objectLike({ EventType: "viewer-request", FunctionARN: Match.anyValue() }),
          ]),
        }),
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 404,
            ResponsePagePath: "/404.html",
          }),
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 404,
            ResponsePagePath: "/404.html",
          }),
        ]),
      }),
    });
    template.resourceCountIs("AWS::CloudFront::Function", 1);

    // OAC reference wired to origin
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Origins: Match.arrayWith([Match.objectLike({ OriginAccessControlId: Match.anyValue() })]),
      }),
    });

    // Route53 A/AAAA records for root and www
    template.resourceCountIs("AWS::Route53::RecordSet", 4);
    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Name: Match.stringLikeRegexp('^example.com\\."?'),
      Type: Match.anyValue(),
    });
  });

  it("configures cache and security headers policies with expected values", () => {
    const app = new cdk.App();
    const parent = new cdk.Stack(app, "Parent", {
      env: { account: "111111111111", region: "us-east-1" },
    });
    const cert = acm.Certificate.fromCertificateArn(
      parent,
      "Cert",
      "arn:aws:acm:us-east-1:111111111111:certificate/mock",
    );
    const hz = route53.HostedZone.fromHostedZoneAttributes(parent, "HZ", {
      hostedZoneId: "ZMOCK",
      zoneName: "example.com",
    });
    const stack = new StorageStack(app, "StoragePolicies", {
      env: { account: "111111111111", region: "us-east-1" },
      domainName: "example.com",
      environment: "prod",
      certificate: cert,
      hostedZone: hz,
      tags: { Project: "Test" },
    });

    const template = Template.fromStack(stack);

    // CachePolicy TTLs and encodings
    template.hasResourceProperties("AWS::CloudFront::CachePolicy", {
      CachePolicyConfig: {
        DefaultTTL: 86400, // 1 day
        MaxTTL: 31536000, // 365 days
        MinTTL: 3600, // 1 hour
        ParametersInCacheKeyAndForwardedToOrigin: {
          EnableAcceptEncodingBrotli: true,
          EnableAcceptEncodingGzip: true,
        },
      },
    });

    // Security headers policy with name set
    template.hasResourceProperties("AWS::CloudFront::ResponseHeadersPolicy", {
      ResponseHeadersPolicyConfig: {
        Name: Match.stringLikeRegexp("security-headers"),
        SecurityHeadersConfig: Match.anyValue(),
      },
    });
  });
});
