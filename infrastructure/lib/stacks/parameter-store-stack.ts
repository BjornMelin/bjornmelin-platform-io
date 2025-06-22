import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";

export interface ParameterStoreStackProps extends BaseStackProps {
  enableRotation?: boolean;
  rotationScheduleDays?: number;
  notificationEmail?: string;
}

export class ParameterStoreStack extends cdk.Stack {
  public readonly resendApiKeyParameter: ssm.IParameter;
  public readonly encryptionKey: kms.IKey;
  public readonly rotationTopic?: sns.ITopic;

  constructor(scope: Construct, id: string, props: ParameterStoreStackProps) {
    super(scope, id, props);

    // Create customer-managed KMS key for parameter encryption
    this.encryptionKey = new kms.Key(this, "ParameterEncryptionKey", {
      description: `Encryption key for ${props.environment} parameters`,
      enableKeyRotation: true,
      alias: `alias/${props.environment}-portfolio-parameters`,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
      pendingWindow: cdk.Duration.days(30),
    });

    // Grant CloudTrail access to use the key for logging
    this.encryptionKey.grantEncryptDecrypt(new iam.ServicePrincipal("cloudtrail.amazonaws.com"));

    // Create the Resend API key parameter
    const parameterPath = `/portfolio/${props.environment}/resend/api-key`;
    this.resendApiKeyParameter = new ssm.StringParameter(this, "ResendApiKeyParameter", {
      parameterName: parameterPath,
      description: "Resend email service API key",
      type: ssm.ParameterType.SECURE_STRING,
      stringValue: "PLACEHOLDER_WILL_BE_UPDATED_MANUALLY", // Will be updated with actual key
      tier: ssm.ParameterTier.STANDARD, // Free tier
    });

    // Create rotation Lambda function if enabled
    if (props.enableRotation) {
      // Create SNS topic for rotation notifications
      this.rotationTopic = new sns.Topic(this, "RotationNotificationTopic", {
        topicName: `${props.environment}-parameter-rotation-notifications`,
        displayName: "Parameter Rotation Notifications",
      });

      if (props.notificationEmail) {
        this.rotationTopic.addSubscription(
          new subscriptions.EmailSubscription(props.notificationEmail),
        );
      }

      // Create rotation Lambda function with optimized settings
      const rotationLambda = new nodejs.NodejsFunction(this, "RotationLambda", {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(__dirname, "../functions/rotate-parameter/index.ts"),
        environment: {
          PARAMETER_NAME: parameterPath,
          ENVIRONMENT: props.environment,
          KMS_KEY_ID: this.encryptionKey.keyId,
          NOTIFICATION_TOPIC_ARN: this.rotationTopic.topicArn,
          DOMAIN_NAME: props.domainName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        logRetention: logs.RetentionDays.ONE_WEEK, // Optimized for cost
        logRetentionRetryOptions: {
          base: cdk.Duration.millis(200),
          maxRetries: 7,
        },
        description: "Lambda function to rotate Resend API keys stored in Parameter Store",
        architecture: lambda.Architecture.ARM_64, // Cost-optimized
        // Only log errors to reduce CloudWatch costs
        logFormat: lambda.LogFormat.JSON,
        systemLogLevel: lambda.SystemLogLevel.ERROR,
        applicationLogLevel: lambda.ApplicationLogLevel.ERROR,
      });

      // Grant permissions to the rotation Lambda
      this.resendApiKeyParameter.grantRead(rotationLambda);
      this.resendApiKeyParameter.grantWrite(rotationLambda);
      this.encryptionKey.grantEncryptDecrypt(rotationLambda);
      this.rotationTopic.grantPublish(rotationLambda);

      // Add permissions for the rotation function to manage parameter versions
      rotationLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "ssm:PutParameter",
            "ssm:GetParameter",
            "ssm:GetParameterHistory",
            "ssm:AddTagsToResource",
            "ssm:ListTagsForResource",
            "ssm:LabelParameterVersion",
          ],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter${parameterPath}`,
            `arn:aws:ssm:${this.region}:${this.account}:parameter${parameterPath}:*`,
          ],
        }),
      );

      // Create EventBridge rule for rotation schedule
      const rotationRule = new events.Rule(this, "RotationScheduleRule", {
        ruleName: `${props.environment}-parameter-rotation-schedule`,
        description: "Schedule for rotating API keys in Parameter Store",
        schedule: events.Schedule.rate(cdk.Duration.days(props.rotationScheduleDays || 90)),
      });

      // Add Lambda as target for the rotation rule
      rotationRule.addTarget(new targets.LambdaFunction(rotationLambda));
    }

    // Create an IAM policy for accessing the parameter
    const parameterAccessPolicy = new iam.ManagedPolicy(this, "ResendParameterAccessPolicy", {
      managedPolicyName: `${props.environment}-ResendParameterAccess`,
      description: "Policy for accessing Resend API key parameter",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["ssm:GetParameter", "ssm:GetParameterHistory"],
          resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${parameterPath}`],
          conditions: {
            StringEquals: {
              "ssm:version": "$LATEST",
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["kms:Decrypt"],
          resources: [this.encryptionKey.keyArn],
          conditions: {
            StringEquals: {
              "kms:ViaService": `ssm.${this.region}.amazonaws.com`,
            },
          },
        }),
      ],
    });

    // Tag all resources for cost allocation
    cdk.Tags.of(this).add("Stack", "ParameterStore");
    cdk.Tags.of(this).add("Environment", props.environment);
    cdk.Tags.of(this).add("CostCenter", "Infrastructure");
    cdk.Tags.of(this).add("Service", "EmailService");
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "ResendApiKeyParameterName", {
      value: parameterPath,
      description: "Name of the Resend API key parameter",
      exportName: `${props.environment}-resend-parameter-name`,
    });

    new cdk.CfnOutput(this, "KmsKeyArn", {
      value: this.encryptionKey.keyArn,
      description: "ARN of the KMS encryption key",
      exportName: `${props.environment}-parameters-kms-key-arn`,
    });

    new cdk.CfnOutput(this, "ParameterAccessPolicyArn", {
      value: parameterAccessPolicy.managedPolicyArn,
      description: "ARN of the managed policy for parameter access",
      exportName: `${props.environment}-resend-parameter-access-policy-arn`,
    });

    if (this.rotationTopic) {
      new cdk.CfnOutput(this, "RotationNotificationTopicArn", {
        value: this.rotationTopic.topicArn,
        description: "ARN of the rotation notification topic",
        exportName: `${props.environment}-rotation-notification-topic-arn`,
      });
    }

    // Cost optimization output
    new cdk.CfnOutput(this, "EstimatedMonthlyCost", {
      value:
        "Parameter Store: $0 (Standard tier) | KMS: ~$0.03 (within free tier) | Lambda: ~$0.20",
      description: "Estimated monthly cost for this stack",
    });
  }
}
