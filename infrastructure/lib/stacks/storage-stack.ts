import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import type { StorageStackProps } from "../types/stack-props";

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;
  private readonly props: StorageStackProps;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);
    this.props = props;

    // Website bucket
    this.bucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `${props.domainName}-${props.environment}-website`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Create the CloudFront logs bucket with Object Ownership set to BucketOwnerPreferred
    const logsBucket = new s3.Bucket(this, "LogsBucket", {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Enable object ownership
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // Grant CloudFront access to the log bucket
    logsBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal("logging.s3.amazonaws.com")],
        actions: ["s3:PutObject"],
        resources: [`${logsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
        },
      }),
    );

    // Origin Access Control for CloudFront
    const oac = new cloudfront.S3OriginAccessControl(this, "WebsiteOAC", {
      originAccessControlName: `${props.domainName}-website-oac`,
      description: "Origin Access Control for Website Bucket",
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: this.createCachePolicy(),
        responseHeadersPolicy: this.createSecurityHeadersPolicy(),
      },
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate: props.certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: logsBucket,
      logFilePrefix: "cdn-logs/",
    });

    // DNS records
    new route53.ARecord(this, "AliasRecord", {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      zone: props.hostedZone,
    });

    new route53.AaaaRecord(this, "AliasRecordIPv6", {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      zone: props.hostedZone,
    });

    // www subdomain
    new route53.ARecord(this, "WwwAliasRecord", {
      recordName: `www.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      zone: props.hostedZone,
    });

    new route53.AaaaRecord(this, "WwwAliasRecordIPv6", {
      recordName: `www.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      zone: props.hostedZone,
    });

    // Tags
    cdk.Tags.of(this).add("Stack", "Storage");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "WebsiteBucketName", {
      value: this.bucket.bucketName,
      description: "Website bucket name",
      exportName: `${props.environment}-website-bucket-name`,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      description: "CloudFront distribution ID",
      exportName: `${props.environment}-distribution-id`,
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront domain name",
      exportName: `${props.environment}-distribution-domain`,
    });
  }

  private createCachePolicy(): cloudfront.CachePolicy {
    return new cloudfront.CachePolicy(this, "CachePolicy", {
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      defaultTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.hours(1),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });
  }

  private createSecurityHeadersPolicy(): cloudfront.ResponseHeadersPolicy {
    return new cloudfront.ResponseHeadersPolicy(this, "SecurityHeaders", {
      responseHeadersPolicyName: `${this.stackName}-security-headers`,
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: [
            "default-src 'self'",
            "img-src 'self' data: https:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self' data:",
            `connect-src 'self' https://api.${this.props.domainName}`,
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: cdk.Duration.days(730),
          includeSubdomains: true,
          preload: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        xssProtection: {
          override: true,
          protection: true,
          modeBlock: true,
        },
      },
    });
  }
}
