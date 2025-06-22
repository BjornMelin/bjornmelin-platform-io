/**
 * Server-side Feature Flag Utilities
 *
 * Utilities for evaluating feature flags in Next.js server components
 * and API routes.
 */

import { cookies, headers } from "next/headers";
import { evaluateFeatureFlag } from "./evaluator";
import { MemoryFeatureFlagStore } from "./stores/memory-store";
import type { FeatureFlag, FeatureFlagContext, FeatureFlagEvaluation } from "./types";

// Server-side store (in production, this would be backed by a database or external service)
const serverStore = new MemoryFeatureFlagStore();

/**
 * Extract context from server request
 */
export async function getServerContext(): Promise<Partial<FeatureFlagContext>> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Extract user information from cookies or headers
  const userId = cookieStore.get("userId")?.value;
  const userEmail = cookieStore.get("userEmail")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  // Determine environment
  const environment =
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "staging"
        : "development";

  // Extract custom attributes from headers or cookies
  const customAttributes: Record<string, unknown> = {};

  // Example: Extract A/B test group from header
  const abTestGroup = headersList.get("x-ab-test-group");
  if (abTestGroup) {
    customAttributes.abTestGroup = abTestGroup;
  }

  // Example: Extract geolocation from header
  const country = headersList.get("x-vercel-ip-country");
  if (country) {
    customAttributes.country = country;
  }

  return {
    userId,
    userEmail,
    userRole,
    environment: environment as "development" | "staging" | "production",
    customAttributes,
  };
}

/**
 * Evaluate a feature flag on the server
 */
export async function evaluateServerFlag(
  key: string,
  context?: Partial<FeatureFlagContext>,
): Promise<FeatureFlagEvaluation> {
  const serverContext = await getServerContext();
  const fullContext: FeatureFlagContext = {
    ...serverContext,
    ...context,
    environment: context?.environment || serverContext.environment || "production",
  };

  const flag = await serverStore.get(key);

  if (!flag) {
    return {
      key,
      value: false,
      enabled: false,
      reason: "error",
      metadata: { error: "Flag not found" },
    };
  }

  return evaluateFeatureFlag(flag, fullContext);
}

/**
 * Check if a feature is enabled on the server
 */
export async function isServerFeatureEnabled(
  key: string,
  context?: Partial<FeatureFlagContext>,
): Promise<boolean> {
  const evaluation = await evaluateServerFlag(key, context);
  return evaluation.enabled && evaluation.value === true;
}

/**
 * Get feature value on the server
 */
export async function getServerFeatureValue<T = unknown>(
  key: string,
  defaultValue: T,
  context?: Partial<FeatureFlagContext>,
): Promise<T> {
  const evaluation = await evaluateServerFlag(key, context);
  return evaluation.enabled ? (evaluation.value as T) : defaultValue;
}

/**
 * Batch evaluate multiple flags on the server
 */
export async function evaluateServerFlags(
  keys: string[],
  context?: Partial<FeatureFlagContext>,
): Promise<Record<string, FeatureFlagEvaluation>> {
  const results: Record<string, FeatureFlagEvaluation> = {};

  for (const key of keys) {
    results[key] = await evaluateServerFlag(key, context);
  }

  return results;
}

/**
 * Initialize server-side feature flags
 * This would typically load flags from a database or external service
 */
export async function initializeServerFlags(flags: FeatureFlag[]): Promise<void> {
  for (const flag of flags) {
    await serverStore.set(flag);
  }
}

/**
 * Get all server-side feature flags
 */
export async function getServerFlags(): Promise<FeatureFlag[]> {
  return serverStore.getAll();
}

/**
 * Update a server-side feature flag
 */
export async function updateServerFlag(flag: FeatureFlag): Promise<void> {
  await serverStore.set(flag);
}

/**
 * Delete a server-side feature flag
 */
export async function deleteServerFlag(key: string): Promise<void> {
  await serverStore.delete(key);
}

/**
 * Middleware helper to add feature flag context to response headers
 */
export function featureFlagHeaders(evaluations: FeatureFlagEvaluation[]): HeadersInit {
  const headers: HeadersInit = {};

  // Add feature flag values as headers for client-side hydration
  evaluations.forEach((evaluation) => {
    headers[`x-feature-${evaluation.key}`] = String(evaluation.value);
  });

  return headers;
}
