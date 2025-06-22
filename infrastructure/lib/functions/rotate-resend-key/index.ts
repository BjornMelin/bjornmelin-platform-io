import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import type { SecretsManagerRotationEvent, SecretsManagerRotationHandler } from "aws-lambda";

const secretsClient = new SecretsManagerClient({});

interface ResendSecretPayload {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

interface ResendApiResponse {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Lambda function to handle automatic rotation of Resend API keys
 * This implements the rotation steps: createSecret, setSecret, testSecret, finishSecret
 */
export const handler: SecretsManagerRotationHandler = async (
  event: SecretsManagerRotationEvent,
) => {
  const { SecretId: secretArn, Token: token, Step: step } = event;

  console.log(`Rotation step: ${step} for secret: ${secretArn}`);

  try {
    switch (step) {
      case "createSecret":
        await createSecret(secretArn, token);
        break;
      case "setSecret":
        await setSecret(secretArn, token);
        break;
      case "testSecret":
        await testSecret(secretArn, token);
        break;
      case "finishSecret":
        await finishSecret(secretArn, token);
        break;
      default:
        throw new Error(`Invalid step: ${step}`);
    }
  } catch (error) {
    console.error(`Error during rotation step ${step}:`, error);
    throw error;
  }
};

async function createSecret(secretArn: string, token: string): Promise<void> {
  console.log("Creating new secret version");

  // Get current secret
  const currentSecret = await getSecretValue(secretArn, "AWSCURRENT");
  const secretData: ResendSecretPayload = JSON.parse(currentSecret);

  // Generate new API key from Resend
  const newApiKey = await createNewResendApiKey(secretData.apiKey, secretData.domain);

  // Create new secret version with the new API key
  const newSecretData: ResendSecretPayload = {
    ...secretData,
    apiKey: newApiKey,
  };

  // Store the new secret version
  await secretsClient.send(
    new UpdateSecretCommand({
      SecretId: secretArn,
      SecretString: JSON.stringify(newSecretData),
      VersionStages: ["AWSPENDING"],
      ClientRequestToken: token,
    }),
  );

  console.log("New secret version created");
}

async function setSecret(_secretArn: string, _token: string): Promise<void> {
  console.log("Setting secret - No external system to update");
  // Resend API keys don't require updating external systems
  // The new key is already active once created
}

async function testSecret(secretArn: string, token: string): Promise<void> {
  console.log("Testing new secret");

  // Get the pending secret
  const pendingSecret = await getSecretValue(secretArn, "AWSPENDING", token);
  const secretData: ResendSecretPayload = JSON.parse(pendingSecret);

  // Test the new API key by making a simple API call to Resend
  await testResendApiKey(secretData.apiKey);

  console.log("New secret tested successfully");
}

async function finishSecret(secretArn: string, token: string): Promise<void> {
  console.log("Finishing secret rotation");

  // Get metadata about the secret
  const metadata = await secretsClient.send(
    new DescribeSecretCommand({
      SecretId: secretArn,
    }),
  );

  // Get current version
  const currentVersion = Object.keys(metadata.VersionIdsToStages || {}).find((v) =>
    metadata.VersionIdsToStages?.[v]?.includes("AWSCURRENT"),
  );

  // Move staging labels
  await secretsClient.send(
    new UpdateSecretCommand({
      SecretId: secretArn,
      VersionStage: "AWSCURRENT",
      MoveToVersionId: token,
      RemoveFromVersionId: currentVersion,
    }),
  );

  // Get the old API key to revoke it
  if (currentVersion) {
    try {
      const oldSecret = await getSecretValue(secretArn, "AWSPREVIOUS", currentVersion);
      const oldSecretData: ResendSecretPayload = JSON.parse(oldSecret);
      await revokeResendApiKey(oldSecretData.apiKey);
    } catch (error) {
      console.warn("Failed to revoke old API key:", error);
      // Don't fail rotation if revocation fails
    }
  }

  console.log("Secret rotation completed successfully");
}

async function getSecretValue(
  secretArn: string,
  stage: string,
  versionId?: string,
): Promise<string> {
  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
      VersionStage: stage,
      VersionId: versionId,
    }),
  );

  if (!response.SecretString) {
    throw new Error("Secret value is empty");
  }

  return response.SecretString;
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
    throw new Error(`Failed to create new API key: ${response.statusText}`);
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
    throw new Error(`API key test failed: ${response.statusText}`);
  }
}

async function revokeResendApiKey(apiKey: string): Promise<void> {
  // Note: Resend API doesn't have a direct revoke endpoint
  // In production, you might need to contact Resend support or
  // implement a webhook to handle this
  console.log("API key revocation requested for key ending in:", apiKey.slice(-4));
  // For now, we'll just log this action
}
