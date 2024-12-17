import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

interface ApiConstructProps {
  lambdaCode: lambda.Code;
  databaseUrl: string;
  s3BucketName: string;
  cloudfrontUrl: string;
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
      timeout: cdk.Duration.seconds(30), // Increased timeout
      environment: {
        DATABASE_URL: props.databaseUrl,
        S3_BUCKET: props.s3BucketName,
        CLOUDFRONT_URL: props.cloudfrontUrl,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "", // Retrieve from env
        EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || "",
        EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "",
        EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || "",
        EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || "",
        EMAIL_FROM: process.env.EMAIL_FROM || "",
      },
    });

    this.api = new apigateway.RestApi(this, "BlogApi", {
      deployOptions: {
        cachingEnabled: true,
        cacheTtl: cdk.Duration.minutes(5),
        cacheSize: 0.5,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    const posts = this.api.root.addResource("trpc");
    posts.addProxy({
      anyMethod: true,
      defaultIntegration: new apigateway.LambdaIntegration(blogHandler, {
        requestParameters: {
          "method.request.path.proxy": true,
        },
        proxy: true,
      }),
    });
  }
}
