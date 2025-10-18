import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

let ssmClient: SSMClient | null = null;
const cache = new Map<string, string>();

export async function getParameter(name: string, withDecryption = false): Promise<string> {
  if (cache.has(name)) return cache.get(name)!;
  if (!ssmClient) ssmClient = new SSMClient({});
  const out = await ssmClient.send(new GetParameterCommand({ Name: name, WithDecryption: withDecryption }));
  const value = out.Parameter?.Value ?? "";
  cache.set(name, value);
  return value;
}

