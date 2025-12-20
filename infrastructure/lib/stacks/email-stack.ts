import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaCore from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import type { Construct } from "constructs";
import type { EmailStackProps } from "../types/stack-props";

/**
 * EmailStack provisions the contact form delivery pipeline using Resend, API Gateway, and Lambda.
 * The stack keeps sensitive data (API keys, recipient emails) out of the synthesized template
 * by resolving them from SSM at runtime.
 */
export class EmailStack extends cdk.Stack {
  public readonly emailFunction: lambda.NodejsFunction;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    const { hostedZone, allowedOrigins = [] } = props;

    const domain = props.domainName;
    const subdomain = `api.${domain}`;
    const apiEndpoint = `https://${subdomain}`;
    const normalizedAllowedOrigins = Array.from(
      new Set([...allowedOrigins, `https://${domain}`, `https://www.${domain}`, apiEndpoint]),
    );

    // SSM parameter paths
    const recipientEmailParam =
      props.ssmRecipientEmailParam ?? `/portfolio/${props.environment}/CONTACT_EMAIL`;
    const resendApiKeyParam =
      props.ssmResendApiKeyParam ?? `/portfolio/${props.environment}/resend/api-key`;

    // Create Lambda function for contact form
    this.emailFunction = new lambda.NodejsFunction(this, "ContactFormFunction", {
      runtime: lambdaCore.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: path.join(__dirname, "../functions/contact-form/index.ts"),
      environment: {
        DOMAIN_NAME: domain,
        ALLOWED_ORIGIN: normalizedAllowedOrigins[0] ?? apiEndpoint,
        ALLOWED_ORIGINS: normalizedAllowedOrigins.join(","),
        SSM_RECIPIENT_EMAIL_PARAM: recipientEmailParam,
        SSM_RESEND_API_KEY_PARAM: resendApiKeyParam,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      architecture: lambdaCore.Architecture.ARM_64,
      tracing: lambdaCore.Tracing.ACTIVE,
    });

    // Create API Gateway Logging Role
    const apiGatewayLoggingRole = new iam.Role(this, "ApiGatewayLoggingRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs",
        ),
      ],
    });

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, "ApiGatewayLogs");

    // Set up API Gateway Account settings
    new apigateway.CfnAccount(this, "ApiGatewayAccount", {
      cloudWatchRoleArn: apiGatewayLoggingRole.roleArn,
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, "ContactApi", {
      restApiName: "Contact Form API",
      description: "API for contact form submissions",
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: "prod",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
      },
    });

    // Create a certificate for the custom domain
    const certificate = new acm.Certificate(this, "ApiCertificate", {
      domainName: subdomain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create a custom domain name for the API
    const customDomain = new apigateway.DomainName(this, "ApiCustomDomain", {
      domainName: subdomain,
      certificate: certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });

    // Create a base path mapping for the API
    new apigateway.BasePathMapping(this, "ApiBasePathMapping", {
      domainName: customDomain,
      restApi: this.api,
      stage: this.api.deploymentStage,
    });

    // Create a subdomain DNS record for the API Gateway
    new route53.ARecord(this, "ApiGatewayDnsRecord", {
      zone: hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(customDomain)),
    });

    // Add API Gateway resource and method
    const contact = this.api.root.addResource("contact");
    contact.addMethod("POST", new apigateway.LambdaIntegration(this.emailFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: false,
    });

    // Add CORS options to the API
    const corsOptions: apigateway.CorsOptions = {
      allowOrigins: normalizedAllowedOrigins,
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    };
    contact.addCorsPreflight(corsOptions);

    // Grant SSM read permission for recipient email and Resend API key parameters
    const normalizedRecipientParam = recipientEmailParam.startsWith("/")
      ? recipientEmailParam
      : `/${recipientEmailParam}`;
    const normalizedResendParam = resendApiKeyParam.startsWith("/")
      ? resendApiKeyParam
      : `/${resendApiKeyParam}`;

    this.emailFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${normalizedRecipientParam}`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter${normalizedResendParam}`,
        ],
      }),
    );

    // Add tags
    cdk.Tags.of(this).add("Stack", "Email");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "EmailFunctionArn", {
      value: this.emailFunction.functionArn,
      description: "Contact Form Lambda Function ARN",
      exportName: `${props.environment}-email-function-arn`,
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: this.api.url,
      description: "API Gateway Endpoint",
      exportName: `${props.environment}-api-endpoint`,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: apiEndpoint,
      description: "API Gateway URL",
      exportName: `${props.environment}-api-gateway-url`,
    });
  }
}
