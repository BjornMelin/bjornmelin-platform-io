import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

let ssmClient: SSMClient | null = null;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  value: string;
  expiresAtMs: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * Retrieves an SSM parameter value with optional decryption and memoization.
 *
 * @param name Fully qualified parameter path.
 * @param withDecryption When true, decrypts SecureString parameters before returning.
 * @param options Optional cache controls.
 * @returns Parameter value as a string (empty string when missing).
 */
export async function getParameter(
  name: string,
  withDecryption = false,
  options: { cacheTtlMs?: number } = {},
): Promise<string> {
  const cacheKey = `${withDecryption ? "dec" : "raw"}:${name}`;
  const now = Date.now();
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAtMs > now) return cached.value;

  if (!ssmClient) ssmClient = new SSMClient({});
  const out = await ssmClient.send(
    new GetParameterCommand({ Name: name, WithDecryption: withDecryption }),
  );
  const value = out.Parameter?.Value ?? "";
  cache.set(cacheKey, { value, expiresAtMs: now + cacheTtlMs });
  return value;
}
