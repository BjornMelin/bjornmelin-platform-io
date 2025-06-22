import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";

export interface SecretsStackProps extends BaseStackProps {
  enableRotation?: boolean;
  rotationScheduleDays?: number;
}

export class SecretsStack extends cdk.Stack {
  public readonly resendApiKeySecret: secretsmanager.ISecret;
  public readonly encryptionKey: kms.IKey;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    // Create customer-managed KMS key for secrets encryption
    this.encryptionKey = new kms.Key(this, "SecretsEncryptionKey", {
      description: `Encryption key for ${props.environment} secrets`,
      enableKeyRotation: true,
      alias: `alias/${props.environment}-portfolio-secrets`,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
      pendingWindow: cdk.Duration.days(30),
    });

    // Grant CloudTrail access to use the key for logging
    this.encryptionKey.grantEncryptDecrypt(new iam.ServicePrincipal("cloudtrail.amazonaws.com"));

    // Create the Resend API key secret with JSON structure
    this.resendApiKeySecret = new secretsmanager.Secret(this, "ResendApiKey", {
      secretName: `${props.environment}/portfolio/resend-api-key`,
      description: "Resend email service API key and configuration",
      encryptionKey: this.encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: "PLACEHOLDER_WILL_BE_UPDATED_MANUALLY",
          domain: props.domainName,
          fromEmail: `noreply@${props.domainName}`,
        }),
        generateStringKey: "apiKey",
        excludeCharacters: " %+~`#$&*()|[]{}:;<>?!'/@\"\\",
      },
    });

    // Create rotation Lambda function if enabled
    if (props.enableRotation) {
      const rotationLambda = new nodejs.NodejsFunction(this, "RotationLambda", {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(__dirname, "../functions/rotate-resend-key/index.ts"),
        environment: {
          SECRET_ARN: this.resendApiKeySecret.secretArn,
          ENVIRONMENT: props.environment,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        logRetention: logs.RetentionDays.ONE_MONTH,
        description: "Lambda function to rotate Resend API keys",
      });

      // Grant permissions to the rotation Lambda
      this.resendApiKeySecret.grantRead(rotationLambda);
      this.resendApiKeySecret.grantWrite(rotationLambda);
      this.encryptionKey.grantEncryptDecrypt(rotationLambda);

      // Add rotation schedule
      this.resendApiKeySecret.addRotationSchedule("RotationSchedule", {
        rotationLambda: rotationLambda,
        automaticallyAfter: cdk.Duration.days(props.rotationScheduleDays || 90),
      });

      // Add permissions for the rotation function to call Resend API
      rotationLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["secretsmanager:GetSecretValue", "secretsmanager:UpdateSecret"],
          resources: [this.resendApiKeySecret.secretArn],
        }),
      );
    }

    // Create an IAM policy for accessing the secret
    const secretAccessPolicy = new iam.ManagedPolicy(this, "ResendSecretAccessPolicy", {
      managedPolicyName: `${props.environment}-ResendSecretAccess`,
      description: "Policy for accessing Resend API key secret",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
          resources: [this.resendApiKeySecret.secretArn],
          conditions: {
            StringEquals: {
              "secretsmanager:VersionStage": "AWSCURRENT",
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["kms:Decrypt"],
          resources: [this.encryptionKey.keyArn],
          conditions: {
            StringEquals: {
              "kms:ViaService": `secretsmanager.${props.env?.region}.amazonaws.com`,
            },
          },
        }),
      ],
    });

    // Tag all resources
    cdk.Tags.of(this).add("Stack", "Secrets");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "ResendApiKeySecretArn", {
      value: this.resendApiKeySecret.secretArn,
      description: "ARN of the Resend API key secret",
      exportName: `${props.environment}-resend-secret-arn`,
    });

    new cdk.CfnOutput(this, "KmsKeyArn", {
      value: this.encryptionKey.keyArn,
      description: "ARN of the KMS encryption key",
      exportName: `${props.environment}-secrets-kms-key-arn`,
    });

    new cdk.CfnOutput(this, "SecretAccessPolicyArn", {
      value: secretAccessPolicy.managedPolicyArn,
      description: "ARN of the managed policy for secret access",
      exportName: `${props.environment}-resend-secret-access-policy-arn`,
    });
  }
}
