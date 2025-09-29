import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaCore from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets"; // Correct import for targets
import * as ses from "aws-cdk-lib/aws-ses";
import type { Construct } from "constructs";
import type { EmailStackProps } from "../types/stack-props";

export class EmailStack extends cdk.Stack {
  public readonly emailFunction: lambda.NodejsFunction;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    const domain = props.domainName;
    const subdomain = `api.${domain}`;
    const apiEndpoint = `https://${subdomain}`;

    // Create SES Domain Identity
    const domainIdentity = new ses.EmailIdentity(this, "DomainIdentity", {
      identity: ses.Identity.domain(domain),
    });

    // Get verification record attributes
    const verificationRecord = {
      recordName: `_amazonses.${domain}`,
      recordValue: domainIdentity.emailIdentityArn,
    };

    // Create DNS TXT record for domain verification
    new route53.TxtRecord(this, "SESVerificationRecord", {
      zone: props.hostedZone,
      recordName: verificationRecord.recordName,
      values: [verificationRecord.recordValue],
      ttl: cdk.Duration.minutes(60),
    });

    // Create DKIM CNAME records
    const dkimTokens = [
      domainIdentity.dkimDnsTokenName1,
      domainIdentity.dkimDnsTokenName2,
      domainIdentity.dkimDnsTokenName3,
    ];

    dkimTokens.forEach((dkimToken, index) => {
      new route53.CnameRecord(this, `DKIMCNAMERecord${index}`, {
        zone: props.hostedZone,
        recordName: `${dkimToken}._domainkey.${domain}`,
        domainName: `${dkimToken}.dkim.amazonses.com`,
      });
    });

    // Create MX record for receiving email
    new route53.MxRecord(this, "SESMxRecord", {
      zone: props.hostedZone,
      recordName: domain,
      values: [
        {
          hostName: `inbound-smtp.${this.region}.amazonaws.com`,
          priority: 10,
        },
      ],
      ttl: cdk.Duration.minutes(60),
    });

    // Create Lambda function for contact form
    this.emailFunction = new lambda.NodejsFunction(this, "ContactFormFunction", {
      runtime: lambdaCore.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: path.join(__dirname, "../functions/contact-form/index.ts"),
      environment: {
        SENDER_EMAIL: `no-reply@${domain}`,
        RECIPIENT_EMAIL: "bjornmelin16@gmail.com",
        REGION: this.region,
        ALLOWED_ORIGIN: apiEndpoint, // Use the secure API endpoint
        DOMAIN_NAME: domain,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ["@aws-sdk/client-ses"],
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
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
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
      zone: props.hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(customDomain)),
    });

    // Add API Gateway resource and method
    const contact = this.api.root.addResource("contact");
    contact.addMethod("POST", new apigateway.LambdaIntegration(this.emailFunction), {
      authorizationType: apigateway.AuthorizationType.NONE, // Allow unauthenticated access
      apiKeyRequired: false,
    });

    // Add CORS options to the API
    const corsOptions: apigateway.CorsOptions = {
      allowOrigins: [`https://${props.domainName}`, `https://www.${props.domainName}`, apiEndpoint],
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    };

    // Apply CORS to the contact resource
    contact.addCorsPreflight(corsOptions);

    // Create custom policy for SES permissions
    const sesPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: [`arn:aws:ses:${this.region}:${this.account}:identity/${domain}`],
    });

    // Attach SES policy to Lambda function
    this.emailFunction.addToRolePolicy(sesPolicy);

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

    new cdk.CfnOutput(this, "SenderEmailAddress", {
      value: `no-reply@${domain}`,
      description: "Sender Email Address",
      exportName: `${props.environment}-sender-email`,
    });
  }
}
