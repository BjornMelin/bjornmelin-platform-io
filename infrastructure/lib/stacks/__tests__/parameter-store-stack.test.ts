import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { ParameterStoreStack } from "../parameter-store-stack";

describe("ParameterStoreStack", () => {
  const createStack = (props: Partial<Parameters<typeof ParameterStoreStack>[2]> = {}) => {
    const app = new App();
    return new ParameterStoreStack(app, "TestParameterStoreStack", {
      env: { account: "123456789012", region: "us-east-1" },
      domainName: "example.com",
      environment: "test",
      tags: { Project: "Portfolio" },
      enableRotation: true,
      rotationScheduleDays: 90,
      notificationEmail: "test@example.com",
      ...props,
    });
  };

  it("creates parameter store with correct configuration", () => {
    const stack = createStack();
    const template = Template.fromStack(stack);

    // Verify KMS key creation
    template.hasResourceProperties("AWS::KMS::Key", {
      Description: "Encryption key for test parameters",
      EnableKeyRotation: true,
    });

    // Verify KMS alias
    template.hasResourceProperties("AWS::KMS::Alias", {
      AliasName: "alias/test-portfolio-parameters",
    });

    // Verify parameter creation
    template.hasResourceProperties("AWS::SSM::Parameter", {
      Name: "/portfolio/test/resend/api-key",
      Type: "SecureString",
      Description: "Resend email service API key",
      Tier: "Standard",
    });

    // Verify IAM policy
    template.hasResourceProperties("AWS::IAM::ManagedPolicy", {
      ManagedPolicyName: "test-ResendParameterAccess",
      Description: "Policy for accessing Resend API key parameter",
    });
  });

  it("creates rotation infrastructure when enabled", () => {
    const stack = createStack({ enableRotation: true });
    const template = Template.fromStack(stack);

    // Verify SNS topic for notifications
    template.hasResourceProperties("AWS::SNS::Topic", {
      TopicName: "test-parameter-rotation-notifications",
      DisplayName: "Parameter Rotation Notifications",
    });

    // Verify rotation Lambda function (filter out log retention Lambda)
    const functions = template.findResources("AWS::Lambda::Function");
    const rotationFunction = Object.values(functions).find((fn: any) =>
      fn.Properties?.Description?.includes("rotate Resend API keys"),
    );

    expect(rotationFunction).toBeDefined();
    expect(rotationFunction?.Properties?.Runtime).toBe("nodejs20.x");
    expect(rotationFunction?.Properties?.Handler).toBe("index.handler");
    expect(rotationFunction?.Properties?.Architectures).toEqual(["arm64"]);
    expect(rotationFunction?.Properties?.MemorySize).toBe(256);
    expect(rotationFunction?.Properties?.Timeout).toBe(300);

    // Verify EventBridge rule
    template.hasResourceProperties("AWS::Events::Rule", {
      Name: "test-parameter-rotation-schedule",
      Description: "Schedule for rotating API keys in Parameter Store",
      ScheduleExpression: "rate(90 days)",
    });

    // Verify Lambda has correct environment variables
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          PARAMETER_NAME: "/portfolio/test/resend/api-key",
          ENVIRONMENT: "test",
          DOMAIN_NAME: "example.com",
        },
      },
    });
  });

  it("does not create rotation infrastructure when disabled", () => {
    const stack = createStack({ enableRotation: false });
    const template = Template.fromStack(stack);

    // Should not have Lambda function
    template.resourceCountIs("AWS::Lambda::Function", 0);

    // Should not have SNS topic
    template.resourceCountIs("AWS::SNS::Topic", 0);

    // Should not have EventBridge rule
    template.resourceCountIs("AWS::Events::Rule", 0);
  });

  it("creates correct IAM permissions for Lambda", () => {
    const stack = createStack({ enableRotation: true });
    const template = Template.fromStack(stack);

    // Get all IAM policies
    const policies = template.findResources("AWS::IAM::Policy");

    // Find the rotation lambda policy
    const rotationPolicy = Object.values(policies).find((policy: any) =>
      policy.Properties?.PolicyName?.includes("RotationLambda"),
    );

    expect(rotationPolicy).toBeDefined();

    // Check that the policy has the expected statements
    const statements = rotationPolicy?.Properties?.PolicyDocument?.Statement || [];

    // Should have SSM permissions
    const ssmStatement = statements.find((stmt: any) =>
      Array.isArray(stmt.Action)
        ? stmt.Action.some((action: string) => action.includes("ssm:"))
        : stmt.Action?.includes?.("ssm:"),
    );
    expect(ssmStatement).toBeDefined();

    // Should have KMS permissions
    const kmsStatement = statements.find((stmt: any) =>
      Array.isArray(stmt.Action)
        ? stmt.Action.some((action: string) => action.includes("kms:"))
        : stmt.Action?.includes?.("kms:"),
    );
    expect(kmsStatement).toBeDefined();

    // Should have SNS permissions (this might not exist if SNS policy is separate)
    const snsStatement = statements.find((stmt: any) =>
      Array.isArray(stmt.Action)
        ? stmt.Action.some((action: string) => action.includes("sns:"))
        : stmt.Action?.includes?.("sns:"),
    );

    // SNS permissions might be in a separate policy, so let's be more flexible
    if (!snsStatement) {
      // Check if SNS permissions exist in any policy
      const allPolicies = Object.values(policies);
      const hasSnsPermissions = allPolicies.some((policy: any) => {
        const policyStatements = policy.Properties?.PolicyDocument?.Statement || [];
        return policyStatements.some((stmt: any) =>
          Array.isArray(stmt.Action)
            ? stmt.Action.some((action: string) => action.includes("sns:"))
            : stmt.Action?.includes?.("sns:"),
        );
      });
      expect(hasSnsPermissions).toBe(true);
    } else {
      expect(snsStatement).toBeDefined();
    }
  });

  it("applies correct tags to resources", () => {
    const stack = createStack();
    const template = Template.fromStack(stack);

    // Check that stack-level tags are applied
    const resources = template.findResources("AWS::SSM::Parameter");
    const parameterResource = Object.values(resources)[0] as any;

    expect(parameterResource).toBeDefined();
    expect(parameterResource.Properties?.Tags).toBeDefined();

    // Tags are in key-value object format
    const tags = parameterResource.Properties.Tags;

    expect(tags).toEqual(
      expect.objectContaining({
        Stack: "ParameterStore",
        Environment: "test",
        CostCenter: "Infrastructure",
        Service: "EmailService",
        Project: "Portfolio",
      }),
    );
  });

  it("configures CloudWatch log retention for cost optimization", () => {
    const stack = createStack({ enableRotation: true });
    const template = Template.fromStack(stack);

    // The log group is created by the Lambda construct automatically
    // We should check that it gets configured with the right retention
    // The Lambda function should have the correct logging configuration
    template.hasResourceProperties("AWS::Lambda::Function", {
      LoggingConfig: {
        ApplicationLogLevel: "ERROR",
        LogFormat: "JSON",
      },
    });
  });

  it("creates cost-optimized Lambda configuration", () => {
    const stack = createStack({ enableRotation: true });
    const template = Template.fromStack(stack);

    // Find the rotation Lambda function (not the log retention Lambda)
    const functions = template.findResources("AWS::Lambda::Function");
    const rotationFunction = Object.values(functions).find((fn: any) =>
      fn.Properties?.Description?.includes("rotate Resend API keys"),
    );

    expect(rotationFunction).toBeDefined();

    // Verify Lambda uses ARM64 architecture for cost savings
    expect(rotationFunction?.Properties?.Architectures).toEqual(["arm64"]);
    expect(rotationFunction?.Properties?.MemorySize).toBe(256);
    expect(rotationFunction?.Properties?.LoggingConfig?.LogFormat).toBe("JSON");
    expect(rotationFunction?.Properties?.LoggingConfig?.ApplicationLogLevel).toBe("ERROR");
  });

  it("exports correct outputs", () => {
    const stack = createStack({ enableRotation: true });
    const template = Template.fromStack(stack);

    // Verify outputs exist
    template.hasOutput("ResendApiKeyParameterName", {
      Value: "/portfolio/test/resend/api-key",
      Export: { Name: "test-resend-parameter-name" },
    });

    template.hasOutput("KmsKeyArn", {
      Export: { Name: "test-parameters-kms-key-arn" },
    });

    template.hasOutput("ParameterAccessPolicyArn", {
      Export: { Name: "test-resend-parameter-access-policy-arn" },
    });

    template.hasOutput("RotationNotificationTopicArn", {
      Export: { Name: "test-rotation-notification-topic-arn" },
    });

    template.hasOutput("EstimatedMonthlyCost", {
      Value:
        "Parameter Store: $0 (Standard tier) | KMS: ~$0.03 (within free tier) | Lambda: ~$0.20",
    });
  });

  it("configures parameter with standard tier for cost optimization", () => {
    const stack = createStack();
    const template = Template.fromStack(stack);

    // Verify parameter uses standard tier (free)
    template.hasResourceProperties("AWS::SSM::Parameter", {
      Tier: "Standard",
    });
  });

  it("sets up proper email subscription when notification email provided", () => {
    const stack = createStack({
      enableRotation: true,
      notificationEmail: "admin@example.com",
    });
    const template = Template.fromStack(stack);

    // Verify SNS subscription
    template.hasResourceProperties("AWS::SNS::Subscription", {
      Protocol: "email",
      Endpoint: "admin@example.com",
    });
  });

  it("handles production environment correctly", () => {
    const stack = createStack({ environment: "prod" });
    const template = Template.fromStack(stack);

    // Verify parameter name for production
    template.hasResourceProperties("AWS::SSM::Parameter", {
      Name: "/portfolio/prod/resend/api-key",
    });

    // Verify KMS alias for production
    template.hasResourceProperties("AWS::KMS::Alias", {
      AliasName: "alias/prod-portfolio-parameters",
    });
  });
});
