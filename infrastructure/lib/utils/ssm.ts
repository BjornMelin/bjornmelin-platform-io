import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

let ssmClient: SSMClient | null = null;
const cache = new Map<string, string>();

export async function getParameter(name: string, withDecryption = false): Promise<string> {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  if (!ssmClient) ssmClient = new SSMClient({});
  const out = await ssmClient.send(
    new GetParameterCommand({ Name: name, WithDecryption: withDecryption }),
  );
  const value = out.Parameter?.Value ?? "";
  cache.set(name, value);
  return value;
}
