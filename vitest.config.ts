import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const isCi = Boolean(process.env.CI);

const parseCoverageThreshold = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const coverageDefault = parseCoverageThreshold(
  process.env.COVERAGE_THRESHOLD_DEFAULT,
  isCi ? 0 : 90,
);

const coverageThresholds = {
  lines: parseCoverageThreshold(process.env.COVERAGE_THRESHOLD_LINES, coverageDefault),
  functions: parseCoverageThreshold(process.env.COVERAGE_THRESHOLD_FUNCTIONS, coverageDefault),
  branches: parseCoverageThreshold(process.env.COVERAGE_THRESHOLD_BRANCHES, coverageDefault),
  statements: parseCoverageThreshold(process.env.COVERAGE_THRESHOLD_STATEMENTS, coverageDefault),
};

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.type.ts",
        ".next/**",
        "infrastructure/**",
      ],
      thresholds: coverageThresholds,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
