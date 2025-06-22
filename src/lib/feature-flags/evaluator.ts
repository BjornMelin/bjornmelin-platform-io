/**
 * Feature Flag Evaluation Engine
 *
 * Core logic for evaluating feature flags based on context and rules.
 */

import type {
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagEvaluation,
  FeatureFlagValue,
} from "./types";

/**
 * Hash function for consistent percentage rollouts
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate rollout percentage for a given key and identifier
 */
function calculateRolloutPercentage(flagKey: string, identifier: string): number {
  const combinedKey = `${flagKey}:${identifier}`;
  const hash = hashString(combinedKey);
  return (hash % 100) + 1; // Returns 1-100
}

/**
 * Evaluate a condition against context
 */
function evaluateCondition(
  condition: NonNullable<FeatureFlag["targetingRules"]>[number]["condition"],
  context: FeatureFlagContext,
): boolean {
  const { attribute, operator, value } = condition;
  const contextValue = attribute.split(".").reduce(
    (obj: any, key: string) => {
      return obj?.[key];
    },
    context as Record<string, any>,
  );

  if (contextValue === undefined) {
    return false;
  }

  switch (operator) {
    case "equals":
      return contextValue === value;

    case "notEquals":
      return contextValue !== value;

    case "contains":
      return String(contextValue).includes(String(value));

    case "notContains":
      return !String(contextValue).includes(String(value));

    case "in":
      return Array.isArray(value) && value.includes(contextValue);

    case "notIn":
      return Array.isArray(value) && !value.includes(contextValue);

    case "greaterThan":
      return Number(contextValue) > Number(value);

    case "lessThan":
      return Number(contextValue) < Number(value);

    default:
      return false;
  }
}

/**
 * Main evaluation function
 */
export function evaluateFeatureFlag(
  flag: FeatureFlag,
  context: FeatureFlagContext,
): FeatureFlagEvaluation {
  // Check if flag is disabled
  if (!flag.enabled) {
    return {
      key: flag.key,
      value: flag.defaultValue,
      enabled: false,
      reason: "disabled",
    };
  }

  // Check targeting rules first (they take precedence)
  if (flag.targetingRules && flag.targetingRules.length > 0) {
    for (const rule of flag.targetingRules) {
      if (evaluateCondition(rule.condition, context)) {
        return {
          key: flag.key,
          value: rule.value,
          enabled: true,
          reason: "targeting",
          metadata: { matchedRule: rule.condition },
        };
      }
    }
  }

  // Check percentage rollout
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    // Use userId if available, otherwise use a combination of available identifiers
    const identifier = context.userId || context.userEmail || context.environment || "anonymous";
    const userPercentage = calculateRolloutPercentage(flag.key, identifier);

    if (userPercentage <= flag.rolloutPercentage) {
      return {
        key: flag.key,
        value: true,
        enabled: true,
        reason: "rollout",
        metadata: {
          rolloutPercentage: flag.rolloutPercentage,
          userPercentage,
        },
      };
    }
  }

  // Return default value
  return {
    key: flag.key,
    value: flag.defaultValue,
    enabled: flag.defaultValue === true,
    reason: "default",
  };
}

/**
 * Batch evaluate multiple feature flags
 */
export function evaluateFeatureFlags(
  flags: FeatureFlag[],
  context: FeatureFlagContext,
): FeatureFlagEvaluation[] {
  return flags.map((flag) => evaluateFeatureFlag(flag, context));
}

/**
 * Helper to check if a feature is enabled (boolean flags only)
 */
export function isFeatureEnabled(flag: FeatureFlag, context: FeatureFlagContext): boolean {
  const evaluation = evaluateFeatureFlag(flag, context);
  return evaluation.enabled && evaluation.value === true;
}

/**
 * Get feature value with type safety
 */
export function getFeatureValue<T extends FeatureFlagValue>(
  flag: FeatureFlag,
  context: FeatureFlagContext,
  defaultValue: T,
): T {
  const evaluation = evaluateFeatureFlag(flag, context);
  return evaluation.enabled ? (evaluation.value as T) : defaultValue;
}
