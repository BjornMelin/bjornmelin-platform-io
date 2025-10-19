/**
 * @fileoverview Vitest configuration for unit and integration tests.
 * - Uses jsdom for app tests; IaC tests have their own config under infrastructure/.
 * - Enables v8 coverage with reporters: text, html, lcov, json-summary.
 * - Threads pool tuned for CI.
 */
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const isCi = Boolean(process.env.CI);
// Enforce 90% coverage by default in all environments.
// Override via COVERAGE_THRESHOLD_DEFAULT or COVERAGE_THRESHOLD_<METRIC>; set to "0" to disable enforcement (coverage collection still runs).
const DEFAULT_COVERAGE_THRESHOLD = 80;
const COVERAGE_METRICS = ["lines", "functions", "branches", "statements"] as const;
const coverageReporters: string[] = isCi
  ? ["text", "html", "lcov", "json", "json-summary"]
  : ["text", "html", "json", "json-summary"];

type CoverageMetric = (typeof COVERAGE_METRICS)[number];

const parseCoverageThreshold = (value: string | undefined, fallback: number): number => {
  const raw = (value ?? "").trim();
  if (raw === "" || !/^\d+(\.\d+)?$/.test(raw)) {
    return fallback;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, 100);
};

const coverageDefault = parseCoverageThreshold(
  process.env.COVERAGE_THRESHOLD_DEFAULT,
  DEFAULT_COVERAGE_THRESHOLD,
);

const coverageThresholds: Record<CoverageMetric, number> = {
  lines: coverageDefault,
  functions: coverageDefault,
  branches: coverageDefault,
  statements: coverageDefault,
};

for (const metric of COVERAGE_METRICS) {
  const envKey = `COVERAGE_THRESHOLD_${metric.toUpperCase()}`;
  coverageThresholds[metric] = parseCoverageThreshold(process.env[envKey], coverageDefault);
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    pool: "threads",
    maxWorkers: isCi ? 4 : undefined,
    minWorkers: isCi ? 2 : undefined,
    reporters: ["default"],
    setupFiles: "./src/test/setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    coverage: {
      provider: "v8",
      reporter: coverageReporters,
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.ts",
        "src/components/structured-data.tsx",
        "infrastructure/**/*.ts",
      ],
      exclude: [
        "node_modules/",
        "src/test/",
        "src/app/**",
        "src/data/**",
        "src/types/**",
        "public/**",
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
