/**
 * In-Memory Feature Flag Store
 *
 * Simple storage implementation for development and testing.
 * Not recommended for production use without persistence.
 */

import type { FeatureFlag, FeatureFlagStore } from "../types";

export class MemoryFeatureFlagStore implements FeatureFlagStore {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor(initialFlags?: FeatureFlag[]) {
    if (initialFlags) {
      initialFlags.forEach((flag) => this.flags.set(flag.key, flag));
    }
  }

  async get(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) || null;
  }

  async getAll(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  async set(flag: FeatureFlag): Promise<void> {
    this.flags.set(flag.key, {
      ...flag,
      updatedAt: new Date(),
    });
  }

  async delete(key: string): Promise<void> {
    this.flags.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.flags.has(key);
  }

  // Additional utility methods
  clear(): void {
    this.flags.clear();
  }

  size(): number {
    return this.flags.size;
  }
}
