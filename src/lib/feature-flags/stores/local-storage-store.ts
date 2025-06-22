/**
 * Local Storage Feature Flag Store
 *
 * Browser-based storage for feature flags.
 * Useful for client-side persistence and offline support.
 */

import type { FeatureFlag, FeatureFlagStore } from "../types";
import { FeatureFlagSchema } from "../types";

export class LocalStorageFeatureFlagStore implements FeatureFlagStore {
  private readonly storageKey = "feature-flags";
  private readonly prefix = "ff_";

  private isAvailable(): boolean {
    try {
      const testKey = "__ff_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<FeatureFlag | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);
      // Convert date strings back to Date objects
      if (parsed.createdAt) {
        parsed.createdAt = new Date(parsed.createdAt);
      }
      if (parsed.updatedAt) {
        parsed.updatedAt = new Date(parsed.updatedAt);
      }

      return FeatureFlagSchema.parse(parsed);
    } catch (error) {
      console.error(`Failed to get feature flag ${key}:`, error);
      return null;
    }
  }

  async getAll(): Promise<FeatureFlag[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const flags: FeatureFlag[] = [];
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));

    for (const key of keys) {
      const flagKey = key.substring(this.prefix.length);
      const flag = await this.get(flagKey);
      if (flag) {
        flags.push(flag);
      }
    }

    return flags;
  }

  async set(flag: FeatureFlag): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("LocalStorage is not available");
    }

    try {
      const updated = {
        ...flag,
        updatedAt: new Date(),
      };
      localStorage.setItem(this.getStorageKey(flag.key), JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to set feature flag ${flag.key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    localStorage.removeItem(this.getStorageKey(key));
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return localStorage.getItem(this.getStorageKey(key)) !== null;
  }

  // Clear all feature flags
  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
    keys.forEach((key) => localStorage.removeItem(key));
  }

  // Export all flags as JSON
  async export(): Promise<string> {
    const flags = await this.getAll();
    return JSON.stringify(flags, null, 2);
  }

  // Import flags from JSON
  async import(json: string): Promise<void> {
    try {
      const flags = JSON.parse(json) as FeatureFlag[];
      for (const flag of flags) {
        await this.set(flag);
      }
    } catch (error) {
      console.error("Failed to import feature flags:", error);
      throw error;
    }
  }
}
