import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

interface ApiConstructProps {
  lambdaCode: lambda.Code;
  databaseUrl: string;
  s3BucketName: string;
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const blogHandler = new lambda.Function(this, "BlogHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "index.handler",
      code: props.lambdaCode,
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK, // Retain logs for one week
      timeout: cdk.Duration.seconds(30), // Increased timeout
      environment: {
        DATABASE_URL: props.databaseUrl,
        S3_BUCKET: props.s3BucketName,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "", // Retrieve from env
        GITHUB_ID: process.env.GITHUB_ID || "",
        GITHUB_SECRET: process.env.GITHUB_SECRET || "",
      },
    }); // Grant the Lambda function read access to the S3 bucket

    const mediaBucket = cdk.aws_s3.Bucket.fromBucketName(
      this,
      "ImportedMediaBucket",
      props.s3BucketName
    );
    mediaBucket.grantRead(blogHandler);

    this.api = new apigateway.RestApi(this, "BlogApi", {
      deployOptions: {
        cachingEnabled: true,
        cacheTtl: cdk.Duration.minutes(5),
        cacheSize: "0.5",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    const trpc = this.api.root.addResource("trpc");
    const trpcHandler = trpc.addProxy({
      anyMethod: true,
      defaultIntegration: new apigateway.LambdaIntegration(blogHandler, {
        proxy: true,
      }),
    });
  }
}
