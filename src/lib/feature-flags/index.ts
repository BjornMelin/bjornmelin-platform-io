/**
 * Feature Flags Module
 *
 * A lightweight, type-safe feature flag system for Next.js applications.
 *
 * @example
 * // Client-side usage
 * import { useFeatureFlag } from '@/lib/feature-flags';
 *
 * function MyComponent() {
 *   const { enabled } = useFeatureFlag('new-feature');
 *   return enabled ? <NewFeature /> : <OldFeature />;
 * }
 *
 * @example
 * // Server-side usage
 * import { isServerFeatureEnabled } from '@/lib/feature-flags';
 *
 * export default async function Page() {
 *   const showNewUI = await isServerFeatureEnabled('new-ui');
 *   return showNewUI ? <NewUI /> : <OldUI />;
 * }
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
// Server exports
export {
  deleteServerFlag,
  evaluateServerFlag,
  evaluateServerFlags,
  featureFlagHeaders,
  getServerContext,
  getServerFeatureValue,
  getServerFlags,
  initializeServerFlags,
  isServerFeatureEnabled,
  updateServerFlag,
} from "./server";
export { LocalStorageFeatureFlagStore } from "./stores/local-storage-store";
// Store exports
export { MemoryFeatureFlagStore } from "./stores/memory-store";
// Core exports
export * from "./types";

// Default client instance
import { DefaultFeatureFlagClient } from "./client";
import { DEFAULT_FLAGS } from "./flags";
import { MemoryFeatureFlagStore } from "./stores/memory-store";

export const defaultClient = new DefaultFeatureFlagClient({
  store: new MemoryFeatureFlagStore(DEFAULT_FLAGS),
});
