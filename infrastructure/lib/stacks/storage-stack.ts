import * as fs from "node:fs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaCore from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as customResources from "aws-cdk-lib/custom-resources";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import { CACHE_DURATIONS } from "../constants/durations";
import type { StorageStackProps } from "../types/stack-props";
import { applyStandardTags } from "../utils/tagging";

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

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
          noncurrentVersionExpiration: CACHE_DURATIONS.S3_VERSION_EXPIRATION,
          abortIncompleteMultipartUploadAfter: CACHE_DURATIONS.MULTIPART_UPLOAD_ABORT,
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
          expiration: CACHE_DURATIONS.LOG_RETENTION,
        },
      ],
    });

    // Grant CloudFront access to the log bucket
    logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("logging.s3.amazonaws.com")],
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

    // Preserve the original logical ID so existing stacks don't try to replace
    // the OAC (CloudFront requires OriginAccessControl names to be unique).
    const oacChild = oac.node.defaultChild;
    if (oacChild instanceof cloudfront.CfnOriginAccessControl) {
      oacChild.overrideLogicalId("WebsiteOAC");
    }

    const kvsName = `${props.environment}-portfolio-csp-hashes`;
    const kvsProviderFn = new lambda.NodejsFunction(this, "CspHashesKvsProviderFunction", {
      runtime: lambdaCore.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../functions/custom-resources/cloudfront-kvs/index.ts"),
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    kvsProviderFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudfront:CreateKeyValueStore", "cloudfront:DescribeKeyValueStore", "cloudfront:DeleteKeyValueStore"],
        resources: ["*"],
      }),
    );

    const kvsProvider = new customResources.Provider(this, "CspHashesKvsProvider", {
      onEventHandler: kvsProviderFn,
    });

    const kvsResource = new cdk.CustomResource(this, "CspHashesKeyValueStore", {
      serviceToken: kvsProvider.serviceToken,
      properties: {
        Name: kvsName,
        Comment: "Per-path CSP hash indices for the Next.js static export (generated at build time).",
        RetainOnDelete: true,
      },
    });

    const cspHashesKvsArn = kvsResource.getAttString("KeyValueStoreArn");
    const cspHashesKeyValueStore = cloudfront.KeyValueStore.fromKeyValueStoreArn(
      this,
      "CspHashesKeyValueStoreRef",
      cspHashesKvsArn,
    );

    const staticSiteRewriteFunction = this.createStaticSiteRewriteFunction();
    const cspResponseFunction = this.createCspResponseFunction(cspHashesKeyValueStore);

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
        functionAssociations: [
          {
            function: staticSiteRewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
          {
            function: cspResponseFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
          },
        ],
      },
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate: props.certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: CACHE_DURATIONS.ERROR_RESPONSE_TTL,
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: CACHE_DURATIONS.ERROR_RESPONSE_TTL,
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
    applyStandardTags(this, {
      environment: props.environment,
      stackName: "Storage",
      additionalTags: props.tags,
    });

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

    new cdk.CfnOutput(this, "CspHashesKeyValueStoreArn", {
      value: cspHashesKeyValueStore.keyValueStoreArn,
      description: "CloudFront KeyValueStore ARN for CSP hashes",
      exportName: `${props.environment}-csp-hashes-kvs-arn`,
    });
  }

  private createStaticSiteRewriteFunction(): cloudfront.Function {
    const functionFileCandidates = [
      // When running CDK from source (ts-node): infrastructure/lib/stacks -> ../functions
      path.join(__dirname, "../functions/cloudfront/next-static-export-rewrite.js"),
      // When running CDK from compiled JS: infrastructure/dist/lib/stacks -> ../../../lib/functions
      path.join(__dirname, "../../../lib/functions/cloudfront/next-static-export-rewrite.js"),
    ];

    const functionFilePath = functionFileCandidates.find((candidate) => fs.existsSync(candidate));
    if (!functionFilePath) {
      throw new Error(
        `CloudFront Function code not found. Looked for: ${functionFileCandidates.join(", ")}`,
      );
    }

    return new cloudfront.Function(this, "StaticSiteRewriteFunction", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: [
        "Rewrite extensionless paths to /index.html for static export.",
        "Rewrite RSC (Flight) requests to /index.txt for App Router client navigations.",
      ].join(" "),
      code: cloudfront.FunctionCode.fromFile({
        filePath: functionFilePath,
      }),
    });
  }

  private createCspResponseFunction(
    keyValueStore: cloudfront.IKeyValueStore,
  ): cloudfront.Function {
    const functionFileCandidates = [
      // When running CDK from source (ts-node): infrastructure/lib/stacks -> ../functions
      path.join(__dirname, "../functions/cloudfront/next-csp-response.js"),
      // When running CDK from compiled JS: infrastructure/dist/lib/stacks -> ../../../lib/functions
      path.join(__dirname, "../../../lib/functions/cloudfront/next-csp-response.js"),
    ];

    const functionFilePath = functionFileCandidates.find((candidate) => fs.existsSync(candidate));
    if (!functionFilePath) {
      throw new Error(
        `CloudFront Function code not found. Looked for: ${functionFileCandidates.join(", ")}`,
      );
    }

    return new cloudfront.Function(this, "CspResponseFunction", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: "Apply per-path CSP for static export without header length limits.",
      keyValueStore,
      code: cloudfront.FunctionCode.fromFile({
        filePath: functionFilePath,
      }),
    });
  }

  private createCachePolicy(): cloudfront.CachePolicy {
    return new cloudfront.CachePolicy(this, "CachePolicy", {
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList("rsc", "accept"),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      defaultTtl: CACHE_DURATIONS.CLOUDFRONT_DEFAULT_TTL,
      maxTtl: CACHE_DURATIONS.CLOUDFRONT_MAX_TTL,
      minTtl: CACHE_DURATIONS.CLOUDFRONT_MIN_TTL,
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });
  }

  private createSecurityHeadersPolicy(): cloudfront.ResponseHeadersPolicy {
    return new cloudfront.ResponseHeadersPolicy(this, "SecurityHeaders", {
      responseHeadersPolicyName: `${this.stackName}-security-headers`,
      securityHeadersBehavior: {
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: CACHE_DURATIONS.HSTS_MAX_AGE,
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
