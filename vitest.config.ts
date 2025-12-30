import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom", "./src/tests/setup.ts"],
    timeout: 10000,
    env: {
      // Test environment variables (for unit tests only)
      // Integration tests in tests/integration/ use .env.test instead
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      OPPORTUNITY_DEFAULT_STAGE: "new_lead",
      OPPORTUNITY_PIPELINE_STAGES:
        "new_lead,initial_outreach,sample_visit_offered,feedback_logged,demo_scheduled,closed_won,closed_lost",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"], // Explicit include pattern
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/tests/**",
        "src/**/__tests__/**",
        "src/**/*.d.ts",
        "src/vite-env.d.ts",
      ],
      all: true, // Include all files, even untested ones
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules/",
      "dist/",
      ".docs/",
      "tests/**/*.spec.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}", // Integration tests run separately
    ],
    // Force Vitest to transform React Admin packages (needed for ESM compatibility)
    server: {
      deps: {
        inline: ["react-admin", "ra-core"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
