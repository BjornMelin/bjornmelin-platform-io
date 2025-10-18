import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Intentionally no thresholds for infra unit tests; we assert key resources via CDK assertions.
      exclude: ["bin/**", "cdk.out/**", "dist/**", "**/*.d.ts"],
    },
  },
});
