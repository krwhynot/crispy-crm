import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

/**
 * Wait for a server to be available by polling
 */
async function waitForServer(url: string, maxAttempts = 30, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok || response.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

/**
 * Global setup to clear Supabase schema cache before test runs
 * This ensures tests always see the latest database schema including new views
 *
 * Note: This runs BEFORE webServer starts, so we need to wait for the server
 * or gracefully skip if it's not available yet (the auth setup will also clear caches)
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || "http://127.0.0.1:5173";

  console.log("Global Setup: Waiting for dev server to be ready...");

  // Wait for the server to be available (webServer might start it in parallel)
  const serverReady = await waitForServer(baseURL, 60, 1000); // Wait up to 60 seconds

  if (!serverReady) {
    console.log("Global Setup: Server not ready, skipping schema cache clear");
    console.log("Global Setup: The webServer config will start the dev server for tests");
    return;
  }

  console.log("Global Setup: Server ready, clearing Supabase schema cache...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });

    // Clear all schema cache keys from localStorage
    await page.evaluate(() => {
      const keysToRemove: string[] = [];

      // Find all keys related to schema caching
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("ra-data-postgrest-schema") ||
            key.includes("ra.supabase.schema") ||
            key.includes("schemaCache") ||
            key.includes("schema-version"))
        ) {
          keysToRemove.push(key);
        }
      }

      // Remove schema cache keys
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.log(`Removed schema cache key: ${key}`);
      });

      console.log(`Cleared ${keysToRemove.length} schema cache keys`);
    });

    console.log("Global Setup: Schema cache cleared successfully");
  } catch (error) {
    console.error("Global Setup: Error clearing schema cache:", error);
    // Don't fail the entire test run if cache clear fails
  } finally {
    await browser.close();
  }
}
