import * as fs from "node:fs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
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

    const staticSiteRewriteFunction = this.createStaticSiteRewriteFunction();

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
    // Next.js static export (App Router) requires several inline bootstrap scripts (e.g. __next_f.push)
    // to hydrate client interactivity. Rather than enabling `unsafe-inline` globally, we allow-list
    // the exact inline scripts generated in `out/` using SHA-256 hashes.
    //
    // Regenerate after any change that affects the built HTML:
    //   node - <<'NODE'
    //   import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
    //   const root = path.resolve('out'); const re=/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi;
    //   function* walk(d){for (const e of fs.readdirSync(d,{withFileTypes:true})) {const p=path.join(d,e.name);
    //     if(e.isDirectory()) yield* walk(p); else if(e.isFile()&&p.endsWith('.html')) yield p;}}
    //   const hashes=new Set();
    //   for (const f of walk(root)){const html=fs.readFileSync(f,'utf8'); let m;
    //     while((m=re.exec(html))){const attrs=m[1]??''; const body=m[2]??'';
    //       if(/\\bsrc\\s*=\\s*/i.test(attrs)) continue;
    //       const t=(attrs.match(/\\btype\\s*=\\s*\"([^\"]+)\"/i)?.[1]??'').toLowerCase();
    //       if(t==='application/ld+json') continue; if(!body.trim()) continue;
    //       hashes.add('sha256-'+crypto.createHash('sha256').update(body,'utf8').digest('base64'));}}
    //   console.log([...hashes].sort().map(h=>`'${h}'`).join(' '));
    //   NODE
    const nextInlineScriptHashes = [
      "sha256-3ImqI3VVxpejkp+w4z0xSRqyzB1mzPC7x17gstPAFFw=",
      "sha256-8+ORVGKIhxSsCcXMPH6m6ZauS2G+PjvzHq/k8l/aDfo=",
      "sha256-8sIjzR4jDGp+BgawWmO2QA6RQQIAaIITsGU6/M1Mkz8=",
      "sha256-IrBH7Na8js8lZ55FlAIHcwUD314aQgql5Fynin3BsXk=",
      "sha256-Jiy7eQRTCU3cbV3olL90NXRCtMZdZC/jfgFS7FZm3Rk=",
      "sha256-LpXeOPGsEuyCFTZEPI1Dk06baKg5bVDwkVqAw9o3XdE=",
      "sha256-PeW9/KkKGyu9NvjclVx2NgXYAUl+clqLmMyOkufYXgU=",
      "sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=",
      "sha256-TS/4ALFytyXVXDLzmNsDSBw+52h6ug/m0DB5yRm6L0w=",
      "sha256-ULsMmATZEqBPF6TdP2Av0kcvTdjLweuhxra83DH7BW0=",
      "sha256-Uet7ry/q/wyo9nkyGkPOCPPPRyKNSOTugHJdVDQ6IQc=",
      "sha256-ZWOa9gLRHivQrxaQgcw7Df15eOHL0D3sq34iLg5BgN8=",
      "sha256-avWJJh0vsF/9AyJUowP37DrEMH2R/02pU1NZ3mMNv1s=",
      "sha256-d9akdohehnjVS0mDLWY8WCFH/yFkS24Efi15u/tiy4A=",
      "sha256-gWZpWlUCDMpb1pTmomhIKnku9U5ykY/UE/aPtfjvqzA=",
      "sha256-gg/PLL2uCsS9zLSvJi6vp/wl6w44SPlfqzsLTtZRA5M=",
      "sha256-hy8c5kI8B/oEXW35RJMj7gktq1b7wsBWqDzsjJ8spN8=",
      "sha256-jAlyk9ojrTjaL1O2p0H85B1XfH90c7MmzD4BXmceUFY=",
      "sha256-sW6xADz8ux70vSUlj71UpFrgVpZYDP10pHGLBzNOD5s=",
      "sha256-t3TT6gm3zSW8ds8hD7rW6yDvueQtZuegGV7g5d8eiKE=",
      "sha256-uwXlb9ZURYUjN1EcKsHfW7ZmXf9o6B1JcqL3GH+2PBQ=",
      "sha256-woL62XMCkIPOP5ORjsgOAbYdU+GxM+Hgy9OPO5OpXi8=",
      "sha256-ya/LbtR4B3Cb5yr2eYi24EYAqCIod/O7rDB/+weZwIA=",
      "sha256-yzIThK79ynIiiPEBhYgq7E4Og0m5AaRFLow4NoCpCm4=",
      "sha256-zcpoyJb+F3rq6Mw2WhA10mgdwFaWJLGUom7z8/GjFMc=",
    ] as const;

    return new cloudfront.ResponseHeadersPolicy(this, "SecurityHeaders", {
      responseHeadersPolicyName: `${this.stackName}-security-headers`,
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: [
            "default-src 'self'",
            "img-src 'self' data: blob:",
            `script-src 'self' ${nextInlineScriptHashes.map((hash) => `'${hash}'`).join(" ")}`,
            "style-src 'self' 'unsafe-inline'", // Keep for CSS-in-JS (lower risk than script)
            "font-src 'self' data:",
            `connect-src 'self' https://api.${this.props.domainName}`,
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
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
