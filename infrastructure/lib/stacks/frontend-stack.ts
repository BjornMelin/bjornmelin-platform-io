import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

interface FrontendStackProps extends cdk.StackProps {
  domainName: string;
  environment: "dev" | "prod";
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props); // Create S3 bucket for website hosting

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `${props.domainName}-${props.environment}-website`,
      removalPolicy:
        props.environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== "prod",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    }); // Get hosted zone for bjornmelin.io

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: "bjornmelin.io",
    }); // Create certificate in us-east-1 (required for CloudFront)

    const certificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: props.domainName,
        hostedZone,
        region: "us-east-1", // CloudFront requires certificates in us-east-1
        validation: acm.CertificateValidation.fromDns(hostedZone),
      }
    ); // Create CloudFront distribution

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
          this,
          "SecurityHeadersPolicy",
          {
            securityHeadersBehavior: {
              contentSecurityPolicy: {
                contentSecurityPolicy:
                  "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
                override: true,
              },
              strictTransportSecurity: {
                accessControlMaxAge: cdk.Duration.days(2 * 365),
                includeSubdomains: true,
                preload: true,
                override: true,
              },
              contentTypeOptions: { override: true },
              frameOptions: {
                frameOption: cloudfront.HeadersFrameOption.DENY,
                override: true,
              },
              xssProtection: {
                protection: true,
                modeBlock: true,
                override: true,
              },
              referrerPolicy: {
                referrerPolicy:
                  cloudfront.HeadersReferrerPolicy
                    .STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                override: true,
              },
            },
          }
        ),
      },
      domainNames: [props.domainName],
      certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      enableLogging: true,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    }); // Create Route53 alias record

    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone: hostedZone,
    }); // Create AAAA record for IPv6

    new route53.AaaaRecord(this, "SiteAAAARecord", {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone: hostedZone,
    }); // Deploy the Next.js static assets to S3

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.join(__dirname, "../../../out"))],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    }); // Output the CloudFront URL and domain

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution URL",
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${props.domainName}`,
      description: "Website URL",
    });

    new cdk.CfnOutput(this, "WebsiteBucketName", {
      value: websiteBucket.bucketName,
      description: "Website S3 Bucket Name",
    });
  }
}
