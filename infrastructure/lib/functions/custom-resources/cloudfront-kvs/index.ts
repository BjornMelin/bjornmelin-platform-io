import {
  CloudFrontClient,
  CreateKeyValueStoreCommand,
  DeleteKeyValueStoreCommand,
  DescribeKeyValueStoreCommand,
} from "@aws-sdk/client-cloudfront";
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceHandler } from "aws-lambda";

type ResourceProps = {
  Name?: string;
  Comment?: string;
  RetainOnDelete?: boolean;
};

const CLOUDFRONT_API_REGION = "us-east-1";

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required property: ${name}`);
  }
  return value;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ("name" in error || "Code" in error) &&
    // AWS SDK v3 service exceptions set `name` (and sometimes `Code`).
    (String((error as { name?: unknown }).name ?? "").includes("EntityNotFound") ||
      String((error as { Code?: unknown }).Code ?? "").includes("EntityNotFound") ||
      String((error as { name?: unknown }).name ?? "").includes("NoSuchResource") ||
      String((error as { Code?: unknown }).Code ?? "").includes("NoSuchResource"))
  );
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ("name" in error || "Code" in error) &&
    (String((error as { name?: unknown }).name ?? "").includes("EntityAlreadyExists") ||
      String((error as { Code?: unknown }).Code ?? "").includes("EntityAlreadyExists"))
  );
}

async function ensureKeyValueStore(client: CloudFrontClient, name: string, comment?: string) {
  try {
    const existing = await client.send(new DescribeKeyValueStoreCommand({ Name: name }));
    const arn = existing?.KeyValueStore?.ARN;
    if (!arn) throw new Error(`DescribeKeyValueStore returned no ARN for ${name}`);
    return { arn, etag: existing.ETag ?? "" };
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  try {
    const created = await client.send(
      new CreateKeyValueStoreCommand({
        Name: name,
        Comment: comment ?? "",
      }),
    );

    const arn = created?.KeyValueStore?.ARN;
    if (!arn) throw new Error(`CreateKeyValueStore returned no ARN for ${name}`);
    return { arn, etag: created.ETag ?? "" };
  } catch (error) {
    if (!isAlreadyExistsError(error)) throw error;
  }

  const existing = await client.send(new DescribeKeyValueStoreCommand({ Name: name }));
  const arn = existing?.KeyValueStore?.ARN;
  if (!arn) throw new Error(`DescribeKeyValueStore returned no ARN for ${name}`);
  return { arn, etag: existing.ETag ?? "" };
}

async function deleteKeyValueStore(client: CloudFrontClient, name: string) {
  try {
    const described = await client.send(new DescribeKeyValueStoreCommand({ Name: name }));
    const etag = described.ETag;
    if (!etag) throw new Error(`DescribeKeyValueStore returned no ETag for ${name}`);
    await client.send(new DeleteKeyValueStoreCommand({ Name: name, IfMatch: etag }));
  } catch (error) {
    if (isNotFoundError(error)) return;
    throw error;
  }
}

export const handler: CloudFormationCustomResourceHandler = async (
  event: CloudFormationCustomResourceEvent,
) => {
  const props = (event.ResourceProperties ?? {}) as ResourceProps;
  const name = requireString(props.Name, "Name");
  const comment = typeof props.Comment === "string" ? props.Comment : "";
  const retainOnDelete = props.RetainOnDelete !== false;

  if (event.RequestType === "Update") {
    const oldName = (event.OldResourceProperties as ResourceProps | undefined)?.Name;
    if (typeof oldName === "string" && oldName !== name) {
      throw new Error(`KeyValueStore name is immutable (old=${oldName}, new=${name})`);
    }
  }

  // CloudFront APIs (including KeyValueStore APIs) are served from us-east-1.
  // Using a different signing region can yield UnsupportedOperation failures.
  const client = new CloudFrontClient({ region: CLOUDFRONT_API_REGION });

  if (event.RequestType === "Delete") {
    if (!retainOnDelete) {
      await deleteKeyValueStore(client, name);
    }
    return {
      PhysicalResourceId: name,
      Data: {
        KeyValueStoreArn: "",
      },
    };
  }

  const { arn } = await ensureKeyValueStore(client, name, comment);
  return {
    PhysicalResourceId: name,
    Data: {
      KeyValueStoreArn: arn,
    },
  };
};
