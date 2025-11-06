import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5176',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use headed mode in local development, headless in CI
    headless: !!process.env.CI,
  },

  projects: [
    // Setup project
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPad Portrait',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'iPad Landscape',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5176',
    reuseExistingServer: !process.env.CI,
  },
});
