import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node", // Integration tests use node environment (not jsdom)
    setupFiles: ["./tests/integration/setup.ts"],
    timeout: 10000,
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/", "dist/"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
