/**
 * React Hooks for Feature Flags
 *
 * Provides React integration for the feature flag system.
 */

"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DefaultFeatureFlagClient } from "./client";
import type {
  FeatureFlagClient,
  FeatureFlagConfig,
  FeatureFlagEvaluation,
  FeatureFlagValue,
  FeatureFlagContext as FFContext,
  UseFeatureFlagReturn,
} from "./types";

// React Context
interface FeatureFlagProviderContextValue {
  client: FeatureFlagClient;
  context: Partial<FFContext>;
  setContext: React.Dispatch<React.SetStateAction<Partial<FFContext>>>;
}

const FeatureFlagContext = createContext<FeatureFlagProviderContextValue | null>(null);

// Provider Component
interface FeatureFlagProviderProps {
  children: React.ReactNode;
  config?: FeatureFlagConfig;
  context?: Partial<FFContext>;
}

export function FeatureFlagProvider({
  children,
  config,
  context: initialContext = {},
}: FeatureFlagProviderProps) {
  const [context, setContext] = useState<Partial<FFContext>>(initialContext);

  const client = useMemo(() => {
    return new DefaultFeatureFlagClient(config);
  }, [config]);

  useEffect(() => {
    return () => {
      if ("destroy" in client && typeof client.destroy === "function") {
        client.destroy();
      }
    };
  }, [client]);

  const value = useMemo(
    () => ({
      client,
      context,
      setContext,
    }),
    [client, context],
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

// Hook to access the feature flag context
export function useFeatureFlagContext() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error("useFeatureFlagContext must be used within a FeatureFlagProvider");
  }
  return context;
}

// Main feature flag hook
export function useFeatureFlag(
  key: string,
  defaultValue: FeatureFlagValue = false,
): UseFeatureFlagReturn {
  const { client, context } = useFeatureFlagContext();
  const [evaluation, setEvaluation] = useState<FeatureFlagEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const evaluate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.evaluate(key, context);
      setEvaluation(result);
    } catch (err) {
      setError(err as Error);
      setEvaluation({
        key,
        value: defaultValue,
        enabled: false,
        reason: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [client, key, context, defaultValue]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // Subscribe to updates
  useEffect(() => {
    if ("addEventListener" in client && typeof client.addEventListener === "function") {
      const unsubscribe = client.addEventListener((event: any) => {
        if (
          (event.type === "update" && event.key === key) ||
          (event.type === "refresh" && event.keys.includes(key))
        ) {
          evaluate();
        }
      });

      return unsubscribe;
    }
  }, [client, key, evaluate]);

  const refresh = useCallback(async () => {
    await evaluate();
  }, [evaluate]);

  return {
    value: evaluation?.value ?? defaultValue,
    enabled: evaluation?.enabled ?? false,
    loading,
    error,
    refresh,
  };
}

// Simplified boolean hook
export function useFeatureFlagEnabled(key: string): boolean {
  const { value, enabled } = useFeatureFlag(key, false);
  return enabled && value === true;
}

// Hook for multiple flags
export function useFeatureFlags(keys: string[]): Record<string, UseFeatureFlagReturn> {
  // This is a placeholder implementation that doesn't violate hooks rules
  // In a real implementation, you would need to use a different approach
  // such as creating a custom hook that internally manages multiple evaluations
  const { client, context } = useFeatureFlagContext();
  const [results, setResults] = useState<Record<string, UseFeatureFlagReturn>>({});

  useEffect(() => {
    const evaluateAll = async () => {
      const newResults: Record<string, UseFeatureFlagReturn> = {};

      for (const key of keys) {
        try {
          const evaluation = await client.evaluate(key, context);
          newResults[key] = {
            value: evaluation.value,
            enabled: evaluation.enabled,
            loading: false,
            error: null,
            refresh: async () => {
              await client.refresh();
            },
          };
        } catch (error) {
          newResults[key] = {
            value: false,
            enabled: false,
            loading: false,
            error: error as Error,
            refresh: async () => {
              await client.refresh();
            },
          };
        }
      }

      setResults(newResults);
    };

    evaluateAll();
  }, [client, context, keys]); // Updated dependency

  return results;
}

// Component for conditional rendering
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function FeatureFlag({
  flag,
  children,
  fallback = null,
  loading: loadingComponent = null,
}: FeatureFlagProps) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  return <>{enabled ? children : fallback}</>;
}

// HOC for feature flag gating
export function withFeatureFlag<P extends object>(
  flag: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function WrappedComponent(props: P) {
    const { enabled, loading } = useFeatureFlag(flag);

    if (loading) {
      return null;
    }

    if (enabled) {
      return <Component {...props} />;
    }

    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  };
}

// Hook for updating user context
export function useFeatureFlagUserContext() {
  const { setContext } = useFeatureFlagContext();

  const updateUser = useCallback(
    (
      userId?: string,
      userEmail?: string,
      userRole?: string,
      customAttributes?: Record<string, unknown>,
    ) => {
      setContext((prev) => ({
        ...prev,
        userId,
        userEmail,
        userRole,
        customAttributes: {
          ...prev.customAttributes,
          ...customAttributes,
        },
      }));
    },
    [setContext],
  );

  const clearUser = useCallback(() => {
    setContext((prev) => ({
      ...prev,
      userId: undefined,
      userEmail: undefined,
      userRole: undefined,
      customAttributes: undefined,
    }));
  }, [setContext]);

  return { updateUser, clearUser };
}
