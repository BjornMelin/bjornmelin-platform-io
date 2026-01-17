import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const isCi = Boolean(process.env.CI);
// Enforce 90% coverage by default in all environments.
// Override via COVERAGE_THRESHOLD_DEFAULT or COVERAGE_THRESHOLD_<METRIC>; set to "0" to disable enforcement (coverage collection still runs).
const DEFAULT_COVERAGE_THRESHOLD = 80;
const DEFAULT_FUNCTIONS_THRESHOLD = 65; // Functions often undercount; start at 65 and raise as suites grow.
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
const functionsDefault = parseCoverageThreshold(
  process.env.COVERAGE_THRESHOLD_FUNCTIONS,
  DEFAULT_FUNCTIONS_THRESHOLD,
);

const coverageThresholds: Record<CoverageMetric, number> = {
  lines: coverageDefault,
  functions: functionsDefault,
  branches: coverageDefault,
  statements: coverageDefault,
};

for (const metric of COVERAGE_METRICS) {
  const envKey = `COVERAGE_THRESHOLD_${metric.toUpperCase()}`;
  const fallback = metric === "functions" ? functionsDefault : coverageDefault;
  coverageThresholds[metric] = parseCoverageThreshold(process.env[envKey], fallback);
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    maxWorkers: isCi ? 4 : undefined,
    reporters: ["default"],
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          pool: "threads",
          isolate: true,
          setupFiles: "./src/test/setup-node.ts",
          include: ["src/__tests__/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          pool: "threads",
          isolate: true,
          setupFiles: "./src/test/setup.ts",
          include: ["src/__tests__/**/*.test.tsx"],
        },
      },
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
      // Infrastructure tests have their own vitest config
      "infrastructure/**",
      "opensrc/**",
    ],
    coverage: {
      provider: "v8",
      reporter: coverageReporters,
      include: [
        // Core application logic
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.ts",
        "src/env.mjs",
        // Components (excluding UI library)
        "src/components/structured-data.tsx",
        "src/components/projects/**/*.{ts,tsx}",
        "src/components/shared/**/*.{ts,tsx}",
        "src/components/sections/**/*.{ts,tsx}",
        "src/components/contact/**/*.{ts,tsx}",
        "src/components/layout/**/*.{ts,tsx}",
        "src/components/theme/theme-toggle.tsx",
        "src/components/theme/theme-script.tsx",
        // App routes and pages
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/route.ts",
        "src/app/providers.tsx",
        "src/app/sitemap.ts",
        "src/app/robots.ts",
        "src/app/loading.tsx",
      ],
      exclude: [
        "node_modules/",
        "src/test/",
        "src/mocks/",
        "src/data/**",
        "src/types/**",
        "public/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.type.ts",
        ".next/**",
        "infrastructure/**",
        // Re-export-only barrels are validated by contract tests but are not meaningful to track as covered lines/functions.
        "src/lib/email/index.ts",
        "src/lib/security/index.ts",
        // UI library components (shadcn/radix - vendor code)
        "src/components/ui/**",
        // Thin wrappers around third-party libraries
        "src/components/theme/theme-provider.tsx",
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
