/**
 * Client-only exports for feature flags
 * Use this file when importing in client components
 */

export * from "./client";
export * from "./evaluator";
export * from "./flags";
// React exports (client-only)
export {
  FeatureFlag,
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlagContext,
  useFeatureFlagEnabled,
  useFeatureFlags,
  useFeatureFlagUserContext,
  withFeatureFlag,
} from "./hooks";
// Store exports
export { LocalStorageFeatureFlagStore } from "./stores/local-storage-store";
export { MemoryFeatureFlagStore } from "./stores/memory-store";
export * from "./types";

// Default client instance
import { DefaultFeatureFlagClient } from "./client";
import { DEFAULT_FLAGS } from "./flags";
import { MemoryFeatureFlagStore } from "./stores/memory-store";

export const defaultClient = new DefaultFeatureFlagClient({
  store: new MemoryFeatureFlagStore(DEFAULT_FLAGS),
});
