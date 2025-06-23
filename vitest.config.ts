import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig(() => {
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      env: {
        // Explicitly set test environment variables
        NODE_ENV: "test" as const,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        RESEND_API_KEY: "test-api-key",
        RESEND_FROM_EMAIL: "test@example.com",
        CONTACT_EMAIL: "test-contact@example.com",
        AWS_REGION: "us-east-1",
        CSRF_SECRET: "test-csrf-secret-for-testing-only-must-be-32-chars",
        SKIP_ENV_VALIDATION: "true",
      },
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/e2e/**",
        "**/.{idea,git,cache,output,temp}/**",
      ],
      coverage: {
        provider: "v8" as const,
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
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
