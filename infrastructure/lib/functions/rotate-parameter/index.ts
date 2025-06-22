import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { GetParameterCommand, PutParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type { Context, EventBridgeEvent } from "aws-lambda";

const ssmClient = new SSMClient({});
const snsClient = new SNSClient({});

interface ParameterRotationEvent {
  source: string;
  "detail-type": string;
  detail: Record<string, unknown>;
}

interface ResendSecretPayload {
  apiKey: string;
  domain: string;
  fromEmail: string;
  version: number;
  rotatedAt: string;
}

interface ResendApiResponse {
  id: string;
  name: string;
  created_at: string;
}

interface RotationResult {
  success: boolean;
  oldVersion?: number;
  newVersion?: number;
  error?: string;
}

/**
 * Lambda function to handle automatic rotation of Resend API keys in Parameter Store
 * This implements a simplified rotation process without the complex state management of Secrets Manager
 */
export const handler = async (
  _event: EventBridgeEvent<string, ParameterRotationEvent>,
  context: Context,
): Promise<RotationResult> => {
  const parameterName = process.env.PARAMETER_NAME || "";
  const environment = process.env.ENVIRONMENT || "dev";
  const domainName = process.env.DOMAIN_NAME || "";
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN || "";

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "INFO",
      requestId: context.awsRequestId,
      message: "Starting parameter rotation",
      parameterName,
      environment,
    }),
  );

  try {
    // Step 1: Get current parameter value
    const currentParameter = await getCurrentParameter(parameterName);
    const currentData: ResendSecretPayload = JSON.parse(currentParameter.value);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        requestId: context.awsRequestId,
        message: "Retrieved current parameter",
        currentVersion: currentData.version || 1,
      }),
    );

    // Step 2: Generate new API key from Resend
    const newApiKey = await createNewResendApiKey(currentData.apiKey, domainName);

    // Step 3: Test the new API key
    await testResendApiKey(newApiKey);

    // Step 4: Create new parameter version
    const newVersion = (currentData.version || 1) + 1;
    const newData: ResendSecretPayload = {
      apiKey: newApiKey,
      domain: domainName,
      fromEmail: `noreply@${domainName}`,
      version: newVersion,
      rotatedAt: new Date().toISOString(),
    };

    await putNewParameterVersion(parameterName, JSON.stringify(newData));

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        requestId: context.awsRequestId,
        message: "Parameter rotation completed successfully",
        oldVersion: currentData.version || 1,
        newVersion,
      }),
    );

    // Step 5: Send success notification
    await sendNotification(
      notificationTopicArn,
      "Parameter Rotation Success",
      `Parameter ${parameterName} rotated successfully from version ${currentData.version || 1} to ${newVersion}`,
      "SUCCESS",
      environment,
    );

    // Step 6: Revoke old API key (best effort)
    try {
      await revokeResendApiKey(currentData.apiKey);
    } catch (error) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "WARN",
          requestId: context.awsRequestId,
          message: "Failed to revoke old API key",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    return {
      success: true,
      oldVersion: currentData.version || 1,
      newVersion,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        requestId: context.awsRequestId,
        message: "Parameter rotation failed",
        error: errorMessage,
      }),
    );

    // Send failure notification
    await sendNotification(
      notificationTopicArn,
      "Parameter Rotation Failed",
      `Parameter ${parameterName} rotation failed: ${errorMessage}`,
      "FAILURE",
      environment,
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
};

async function getCurrentParameter(
  parameterName: string,
): Promise<{ value: string; version: number }> {
  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    }),
  );

  if (!response.Parameter?.Value) {
    throw new Error("Parameter value is empty");
  }

  return {
    value: response.Parameter.Value,
    version: response.Parameter.Version || 1,
  };
}

async function putNewParameterVersion(parameterName: string, value: string): Promise<void> {
  await ssmClient.send(
    new PutParameterCommand({
      Name: parameterName,
      Value: value,
      Type: "SecureString",
      Overwrite: true,
      Tags: [
        {
          Key: "RotatedAt",
          Value: new Date().toISOString(),
        },
        {
          Key: "Service",
          Value: "ResendEmailService",
        },
        {
          Key: "Environment",
          Value: environment,
        },
      ],
    }),
  );
}

async function createNewResendApiKey(currentApiKey: string, domain: string): Promise<string> {
  // Call Resend API to create a new API key
  const response = await fetch("https://api.resend.com/api-keys", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `bjornmelin-io-${Date.now()}`,
      permission: "sending",
      domain_id: domain, // This would need to be the actual domain ID from Resend
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create new API key: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data: ResendApiResponse = await response.json();
  return data.id; // The new API key
}

async function testResendApiKey(apiKey: string): Promise<void> {
  // Test the API key by fetching domains
  const response = await fetch("https://api.resend.com/domains", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API key test failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
}

async function revokeResendApiKey(apiKey: string): Promise<void> {
  // Note: Resend API doesn't have a direct revoke endpoint
  // This is a placeholder for future implementation
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "API key revocation requested",
      keyHint: apiKey.slice(-4),
    }),
  );
}

async function sendNotification(
  topicArn: string,
  subject: string,
  message: string,
  status: "SUCCESS" | "FAILURE",
  environment: string,
): Promise<void> {
  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: `[${environment.toUpperCase()}] ${subject}`,
        Message: JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            environment,
            status,
            message,
            service: "ParameterRotation",
          },
          null,
          2,
        ),
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message: "Failed to send notification",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
