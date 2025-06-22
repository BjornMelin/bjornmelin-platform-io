import { describe, expect, it } from "vitest";
import { evaluateFeatureFlag } from "../evaluator";
import type { FeatureFlag, FeatureFlagContext } from "../types";

describe("Feature Flag Evaluator", () => {
  const defaultContext: FeatureFlagContext = {
    environment: "development",
  };

  it("should evaluate a simple boolean flag", () => {
    const flag: FeatureFlag = {
      key: "test-flag",
      name: "Test Flag",
      defaultValue: true,
      enabled: true,
      rolloutPercentage: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = evaluateFeatureFlag(flag, defaultContext);
    expect(result.enabled).toBe(true);
    expect(result.value).toBe(true);
  });

  it("should respect percentage rollout", () => {
    const flag: FeatureFlag = {
      key: "percentage-flag",
      name: "Percentage Flag",
      defaultValue: false,
      enabled: true,
      rolloutPercentage: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Test with different user IDs to get different hash results
    const results = [];
    for (let i = 0; i < 100; i++) {
      const result = evaluateFeatureFlag(flag, {
        ...defaultContext,
        userId: `user-${i}`,
      });
      results.push(result.enabled);
    }

    // Should have some true and some false
    const enabledCount = results.filter((r) => r).length;
    expect(enabledCount).toBeGreaterThan(20);
    expect(enabledCount).toBeLessThan(80);
  });

  it("should evaluate targeting rules", () => {
    const flag: FeatureFlag = {
      key: "targeted-flag",
      name: "Targeted Flag",
      defaultValue: false,
      enabled: true,
      rolloutPercentage: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      targetingRules: [
        {
          condition: {
            attribute: "userRole",
            operator: "equals",
            value: "admin",
          },
          value: true,
        },
      ],
    };

    const adminResult = evaluateFeatureFlag(flag, {
      ...defaultContext,
      userRole: "admin",
    });
    expect(adminResult.enabled).toBe(true);

    const userResult = evaluateFeatureFlag(flag, {
      ...defaultContext,
      userRole: "user",
    });
    expect(userResult.enabled).toBe(false);
  });
});
