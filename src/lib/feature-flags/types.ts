/**
 * Feature Flags Type Definitions
 *
 * A lightweight, type-safe feature flag system for Next.js applications.
 * Designed for minimal dependencies and maximum flexibility.
 */

import { z } from "zod";

/**
 * Feature flag value types
 */
export type FeatureFlagValue = boolean | string | number | Record<string, unknown>;

/**
 * Feature flag evaluation context
 */
export const FeatureFlagContextSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userRole: z.string().optional(),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  percentageRollout: z.number().min(0).max(100).optional(),
  customAttributes: z.record(z.unknown()).optional(),
});

export type FeatureFlagContext = z.infer<typeof FeatureFlagContextSchema>;

/**
 * Feature flag definition
 */
export const FeatureFlagSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  defaultValue: z.union([z.boolean(), z.string(), z.number(), z.record(z.unknown())]),
  enabled: z.boolean().default(true),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  targetingRules: z
    .array(
      z.object({
        condition: z.object({
          attribute: z.string(),
          operator: z.enum([
            "equals",
            "notEquals",
            "contains",
            "notContains",
            "in",
            "notIn",
            "greaterThan",
            "lessThan",
          ]),
          value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
        }),
        value: z.union([z.boolean(), z.string(), z.number(), z.record(z.unknown())]),
      }),
    )
    .optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

/**
 * Feature flag storage interface
 */
export interface FeatureFlagStore {
  get(key: string): Promise<FeatureFlag | null>;
  getAll(): Promise<FeatureFlag[]>;
  set(flag: FeatureFlag): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Feature flag evaluation result
 */
export interface FeatureFlagEvaluation {
  key: string;
  value: FeatureFlagValue;
  enabled: boolean;
  reason: "default" | "disabled" | "rollout" | "targeting" | "error";
  metadata?: Record<string, unknown>;
}

/**
 * Feature flag provider configuration
 */
export interface FeatureFlagConfig {
  store?: FeatureFlagStore;
  defaultContext?: Partial<FeatureFlagContext>;
  refreshInterval?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
  onError?: (error: Error) => void;
}

/**
 * Feature flag client interface
 */
export interface FeatureFlagClient {
  evaluate(key: string, context?: Partial<FeatureFlagContext>): Promise<FeatureFlagEvaluation>;
  evaluateAll(context?: Partial<FeatureFlagContext>): Promise<FeatureFlagEvaluation[]>;
  refresh(): Promise<void>;
}

/**
 * React hook return type
 */
export interface UseFeatureFlagReturn {
  value: FeatureFlagValue;
  enabled: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Feature flag event types for monitoring
 */
export type FeatureFlagEvent =
  | { type: "evaluation"; key: string; value: FeatureFlagValue; context: FeatureFlagContext }
  | { type: "error"; key: string; error: Error }
  | { type: "refresh"; keys: string[] }
  | { type: "update"; key: string; oldValue: FeatureFlagValue; newValue: FeatureFlagValue };

/**
 * Feature flag event listener
 */
export type FeatureFlagEventListener = (event: FeatureFlagEvent) => void;
