/**
 * Feature Flag Client
 *
 * Main client for interacting with feature flags.
 * Handles evaluation, caching, and event management.
 */

import { evaluateFeatureFlag, evaluateFeatureFlags } from "./evaluator";
import { MemoryFeatureFlagStore } from "./stores/memory-store";
import type {
  FeatureFlag,
  FeatureFlagClient,
  FeatureFlagConfig,
  FeatureFlagContext,
  FeatureFlagEvaluation,
  FeatureFlagEvent,
  FeatureFlagEventListener,
  FeatureFlagStore,
} from "./types";
import { FeatureFlagContextSchema } from "./types";

interface CacheEntry {
  evaluation: FeatureFlagEvaluation;
  timestamp: number;
  context: FeatureFlagContext;
}

export class DefaultFeatureFlagClient implements FeatureFlagClient {
  private store: FeatureFlagStore;
  private config: Required<FeatureFlagConfig>;
  private cache: Map<string, CacheEntry> = new Map();
  private eventListeners: Set<FeatureFlagEventListener> = new Set();
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: FeatureFlagConfig = {}) {
    this.store = config.store || new MemoryFeatureFlagStore();
    this.config = {
      store: this.store,
      defaultContext: config.defaultContext || {},
      refreshInterval: config.refreshInterval || 0,
      enableCache: config.enableCache ?? true,
      cacheTimeout: config.cacheTimeout || 60000, // 1 minute
      onError: config.onError || ((error) => console.error("Feature flag error:", error)),
    };

    if (this.config.refreshInterval > 0) {
      this.startAutoRefresh();
    }
  }

  private mergeContext(context?: Partial<FeatureFlagContext>): FeatureFlagContext {
    const merged = {
      ...this.config.defaultContext,
      ...context,
      environment: context?.environment || this.config.defaultContext.environment || "production",
    };

    return FeatureFlagContextSchema.parse(merged);
  }

  private getCacheKey(flagKey: string, context: FeatureFlagContext): string {
    return `${flagKey}:${JSON.stringify(context)}`;
  }

  private getCachedEvaluation(
    flagKey: string,
    context: FeatureFlagContext,
  ): FeatureFlagEvaluation | null {
    if (!this.config.enableCache) {
      return null;
    }

    const cacheKey = this.getCacheKey(flagKey, context);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.config.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.evaluation;
  }

  private setCachedEvaluation(
    flagKey: string,
    context: FeatureFlagContext,
    evaluation: FeatureFlagEvaluation,
  ): void {
    if (!this.config.enableCache) {
      return;
    }

    const cacheKey = this.getCacheKey(flagKey, context);
    this.cache.set(cacheKey, {
      evaluation,
      timestamp: Date.now(),
      context,
    });
  }

  private emitEvent(event: FeatureFlagEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in feature flag event listener:", error);
      }
    });
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.refresh().catch((error) => {
        this.config.onError(error);
      });
    }, this.config.refreshInterval);
  }

  async evaluate(
    key: string,
    context?: Partial<FeatureFlagContext>,
  ): Promise<FeatureFlagEvaluation> {
    const fullContext = this.mergeContext(context);

    // Check cache first
    const cached = this.getCachedEvaluation(key, fullContext);
    if (cached) {
      return cached;
    }

    try {
      // Get flag from store
      const flag = await this.store.get(key);

      if (!flag) {
        const evaluation: FeatureFlagEvaluation = {
          key,
          value: false,
          enabled: false,
          reason: "error",
          metadata: { error: "Flag not found" },
        };

        this.emitEvent({
          type: "error",
          key,
          error: new Error(`Feature flag ${key} not found`),
        });

        return evaluation;
      }

      // Evaluate flag
      const evaluation = evaluateFeatureFlag(flag, fullContext);

      // Cache result
      this.setCachedEvaluation(key, fullContext, evaluation);

      // Emit evaluation event
      this.emitEvent({
        type: "evaluation",
        key,
        value: evaluation.value,
        context: fullContext,
      });

      return evaluation;
    } catch (error) {
      this.config.onError(error as Error);

      const evaluation: FeatureFlagEvaluation = {
        key,
        value: false,
        enabled: false,
        reason: "error",
        metadata: { error: (error as Error).message },
      };

      this.emitEvent({
        type: "error",
        key,
        error: error as Error,
      });

      return evaluation;
    }
  }

  async evaluateAll(context?: Partial<FeatureFlagContext>): Promise<FeatureFlagEvaluation[]> {
    const fullContext = this.mergeContext(context);

    try {
      const flags = await this.store.getAll();
      const evaluations = evaluateFeatureFlags(flags, fullContext);

      // Cache all results
      evaluations.forEach((evaluation) => {
        this.setCachedEvaluation(evaluation.key, fullContext, evaluation);
      });

      return evaluations;
    } catch (error) {
      this.config.onError(error as Error);
      return [];
    }
  }

  async refresh(): Promise<void> {
    try {
      // Clear cache
      this.cache.clear();

      // Get all flags to trigger refresh
      const flags = await this.store.getAll();

      this.emitEvent({
        type: "refresh",
        keys: flags.map((f) => f.key),
      });
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  // Event management
  addEventListener(listener: FeatureFlagEventListener): () => void {
    this.eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  removeEventListener(listener: FeatureFlagEventListener): void {
    this.eventListeners.delete(listener);
  }

  // Cleanup
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.cache.clear();
    this.eventListeners.clear();
  }

  // Utility methods
  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.store.get(key);
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return this.store.getAll();
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    const oldFlag = await this.store.get(flag.key);
    await this.store.set(flag);

    if (oldFlag) {
      this.emitEvent({
        type: "update",
        key: flag.key,
        oldValue: oldFlag.defaultValue,
        newValue: flag.defaultValue,
      });
    }

    // Clear cache for this flag
    const cacheKeysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(`${flag.key}:`),
    );
    cacheKeysToDelete.forEach((key) => this.cache.delete(key));
  }

  async deleteFlag(key: string): Promise<void> {
    await this.store.delete(key);

    // Clear cache for this flag
    const cacheKeysToDelete = Array.from(this.cache.keys()).filter((cacheKey) =>
      cacheKey.startsWith(`${key}:`),
    );
    cacheKeysToDelete.forEach((cacheKey) => this.cache.delete(cacheKey));
  }
}
