import { SESClient } from "@aws-sdk/client-ses";
import { env } from "@/env.mjs";

let sesClient: SESClient | null = null;

const AWS_ENV_KEYS = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const;

type AwsEnvKey = (typeof AWS_ENV_KEYS)[number];

const envResolvers: Record<AwsEnvKey, () => string | undefined> = {
  AWS_REGION: () => env.AWS_REGION,
  AWS_ACCESS_KEY_ID: () => env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: () => env.AWS_SECRET_ACCESS_KEY,
};

const readOptionalAwsEnv = (key: AwsEnvKey): string | undefined => {
  const value = envResolvers[key]();
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const readRequiredAwsEnv = (key: AwsEnvKey): string => {
  const value = readOptionalAwsEnv(key);
  if (!value) {
    throw new Error(`Missing required AWS configuration for ${key}.`);
  }

  return value;
};

export function createSESClient(): SESClient {
  if (!sesClient) {
    const region = readRequiredAwsEnv("AWS_REGION");
    const accessKeyId = readOptionalAwsEnv("AWS_ACCESS_KEY_ID");
    const secretAccessKey = readOptionalAwsEnv("AWS_SECRET_ACCESS_KEY");

    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new Error(
        "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must both be provided or both be omitted.",
      );
    }

    const credentials =
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

    sesClient = new SESClient({
      region,
      ...(credentials ? { credentials } : {}),
    });
  }
  return sesClient;
}
