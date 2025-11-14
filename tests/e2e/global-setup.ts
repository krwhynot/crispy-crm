import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup to clear Supabase schema cache before test runs
 * This ensures tests always see the latest database schema including new views
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://127.0.0.1:5173';

  console.log('Global Setup: Clearing Supabase schema cache...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });

    // Clear all schema cache keys from localStorage
    await page.evaluate(() => {
      const keysToRemove: string[] = [];

      // Find all keys related to schema caching
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('ra-data-postgrest-schema') ||
          key.includes('ra.supabase.schema') ||
          key.includes('schemaCache') ||
          key.includes('schema-version')
        )) {
          keysToRemove.push(key);
        }
      }

      // Remove schema cache keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed schema cache key: ${key}`);
      });

      console.log(`Cleared ${keysToRemove.length} schema cache keys`);
    });

    console.log('Global Setup: Schema cache cleared successfully');
  } catch (error) {
    console.error('Global Setup: Error clearing schema cache:', error);
    // Don't fail the entire test run if cache clear fails
  } finally {
    await browser.close();
  }
}
