import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from playwright/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright E2E Testing Configuration
 *
 * Following Engineering Constitution:
 * - NO OVER-ENGINEERING: Minimal setup, critical paths only
 * - SINGLE SOURCE OF TRUTH: Tests use real Supabase (no mocks)
 * - FAIL FAST: Quick feedback on failures
 */
export default defineConfig({
  testDir: './tests',

  // Run tests in parallel for speed
  fullyParallel: true,

  // Fail fast - stop on first failure in CI
  maxFailures: process.env.CI ? 1 : undefined,

  // Forbid test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry once on CI, never locally
  retries: process.env.CI ? 1 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.VITE_APP_URL || 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Increased timeouts for React Admin async operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Projects (browsers to test)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // HEADLESS ONLY - no headed mode allowed
        headless: true,
      },
    },
  ],

  // Web server configuration (start dev server for tests)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Output directory for test artifacts (screenshots, videos, traces)
  outputDir: 'test-results/artifacts/',
});