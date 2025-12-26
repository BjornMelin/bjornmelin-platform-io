import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambdaCore from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";
import { CACHE_DURATIONS } from "../constants/durations";
import type { EmailStackProps } from "../types/stack-props";
import { applyStandardTags } from "../utils/tagging";

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

    // Dead Letter Queue for failed Lambda invocations
    const dlq = new sqs.Queue(this, "ContactFormDLQ", {
      queueName: `${props.environment}-contact-form-dlq`,
      retentionPeriod: CACHE_DURATIONS.SQS_DLQ_RETENTION, // 14 days (SQS max)
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    new cloudwatch.Alarm(this, "ContactFormDlqAlarm", {
      alarmDescription: "Contact form DLQ has messages pending (failed deliveries)",
      metric: dlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

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
      deadLetterQueue: dlq,
      retryAttempts: 2,
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
    const apiLogGroup = new logs.LogGroup(this, "ApiGatewayLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
    });

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
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        // Never log request/response bodies (PII) in API Gateway execution logs.
        // Keep traces + access logs enabled for observability.
        dataTraceEnabled: false,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
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

    // Email DNS records for Resend bounce handling
    // The send subdomain is used by Resend for SPF alignment and bounce processing
    const sendSubdomain = `send.${domain}`;

    // MX record for send subdomain - bounce/complaint handling for sending
    // Per Resend docs: https://resend.com/docs/knowledge-base/route53
    // Note: Only required if "Receiving" is enabled in Resend dashboard
    new route53.MxRecord(this, "SendSubdomainMxRecord", {
      zone: hostedZone,
      recordName: sendSubdomain,
      values: [
        {
          priority: 10,
          hostName: "feedback-smtp.us-east-1.amazonses.com",
        },
      ],
      ttl: cdk.Duration.hours(1),
      comment: "Resend bounce handling MX record",
    });

    // SPF record for send subdomain - authorizes Amazon SES to send on behalf of this subdomain
    new route53.TxtRecord(this, "SendSubdomainSpfRecord", {
      zone: hostedZone,
      recordName: sendSubdomain,
      values: ["v=spf1 include:amazonses.com ~all"],
      ttl: cdk.Duration.hours(1),
      comment: "SPF for Resend send subdomain",
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

    if (props.environment === "prod") {
      // SecureString parameters encrypted with a customer-managed KMS key require explicit decrypt permission.
      // The production account uses `alias/portfolio-email-service` for these parameters.
      kms.Alias.fromAliasName(
        this,
        "PortfolioEmailServiceParameterKey",
        "alias/portfolio-email-service",
      ).grantDecrypt(this.emailFunction);
    }

    // Add tags
    applyStandardTags(this, {
      environment: props.environment,
      stackName: "Email",
      additionalTags: props.tags,
    });

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
