import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

let ssmClient: SSMClient | null = null;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  value: string;
  expiresAtMs: number;
};

// This module-level cache is a singleton shared across all Lambda invocations
// within the same container. It assumes single-threaded execution per container,
// as is the case for Node.js on AWS Lambda today. If the Lambda execution model
// changes to allow concurrent invocations in the same process, this cache may
// need to be revisited for thread-safety.
const cache = new Map<string, CacheEntry>();

/** Removes expired entries from the cache to prevent unbounded growth. */
function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAtMs <= now) {
      cache.delete(key);
    }
  }
}

/**
 * Retrieves an SSM parameter value with optional decryption and memoization.
 *
 * Cache keys include the `withDecryption` flag, so requesting the same parameter
 * with different decryption settings produces separate cache entries.
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
  // Prune expired entries periodically to prevent unbounded memory growth
  pruneExpiredEntries();

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

/** Clears the parameter cache and resets the SSM client (for testing). */
export function _resetForTesting(): void {
  cache.clear();
  ssmClient = null;
}
