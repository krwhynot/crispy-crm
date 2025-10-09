import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom", "./src/tests/setup.ts"],
    timeout: 10000,
    env: {
      // Test environment variables
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      OPPORTUNITY_DEFAULT_STAGE: "new_lead",
      OPPORTUNITY_PIPELINE_STAGES:
        "new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        ".docs/",
        "src/setupTests.js",
        "src/main.tsx",
        "**/*.config.ts",
        "**/*.test.{ts,tsx}",
        "**/__tests__/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.spec.{ts,tsx}"],
    exclude: ["node_modules/", "dist/", ".docs/"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
