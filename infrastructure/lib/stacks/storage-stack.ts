import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly mediaUser: iam.User;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    this.bucket = new s3.Bucket(this, "MediaBucket", {
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [
            "http://localhost:3000",
            process.env.NEXT_PUBLIC_APP_URL || "*",
          ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          // Clean up incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "MediaDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      enableLogging: true,
      logFilePrefix: "media-cdn-logs/",
    });

    // Create IAM user for application
    this.mediaUser = new iam.User(this, "MediaUser");

    // Grant permissions
    this.bucket.grantRead(this.mediaUser);
    this.bucket.grantPut(this.mediaUser);
    this.bucket.grantDelete(this.mediaUser);

    // Create access key for the media user
    const accessKey = new iam.CfnAccessKey(this, "MediaUserAccessKey", {
      userName: this.mediaUser.userName,
    });

    // Output values
    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      description: "Media bucket name",
      exportName: "MediaBucketName",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront domain name",
      exportName: "MediaCdnDomain",
    });

    new cdk.CfnOutput(this, "MediaUserAccessKeyId", {
      value: accessKey.ref,
      description: "Media user access key ID",
      exportName: "MediaUserAccessKeyId",
    });

    new cdk.CfnOutput(this, "MediaUserSecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
      description: "Media user secret access key",
      exportName: "MediaUserSecretAccessKey",
    });
  }
}
