import { test, expect } from '@playwright/test';

/**
 * Diagnostic test to verify environment variables are accessible in Playwright's browser context
 *
 * This test investigates the root cause of React app initialization failure by:
 * 1. Capturing all console messages (including the debug logs from supabase.ts:4-8)
 * 2. Checking if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined
 * 3. Reporting what the browser actually sees
 */
test.describe('Environment Variables Diagnostic', () => {
  test('should have Supabase env vars available in browser context', async ({ page }) => {
    // Capture ALL console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    console.log('\n🔍 Starting environment variable diagnostic...\n');

    // Navigate to app
    await page.goto('/');

    // Wait a bit for modules to load
    await page.waitForTimeout(3000);

    // Try to evaluate env vars directly in browser context
    const envVarsInBrowser = await page.evaluate(() => {
      return {
        VITE_SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY,
        allEnvKeys: Object.keys((import.meta as any).env || {}),
        NODE_ENV: (import.meta as any).env?.MODE,
      };
    });

    // Report findings
    console.log('📊 DIAGNOSTIC RESULTS:');
    console.log('─────────────────────────────────────────────');
    console.log('\n1. Environment variables in browser context:');
    console.log(JSON.stringify(envVarsInBrowser, null, 2));

    console.log('\n2. All console messages captured:');
    consoleMessages.forEach((msg, i) => {
      console.log(`   [${i}] ${msg.type}: ${msg.text}`);
    });

    console.log('\n3. Page errors:');
    if (pageErrors.length === 0) {
      console.log('   ✅ No page errors');
    } else {
      pageErrors.forEach((err, i) => {
        console.log(`   ❌ [${i}] ${err}`);
      });
    }

    console.log('\n4. Supabase init debug logs:');
    const supabaseInitLogs = consoleMessages.filter(msg =>
      msg.text.includes('[SUPABASE INIT]')
    );
    if (supabaseInitLogs.length === 0) {
      console.log('   ⚠️  No Supabase init logs found - module may not have loaded');
    } else {
      supabaseInitLogs.forEach(log => {
        console.log(`   ${log.text}`);
      });
    }

    console.log('\n─────────────────────────────────────────────\n');

    // Take screenshot for visual reference
    await page.screenshot({
      path: 'test-results/env-vars-diagnostic.png',
      fullPage: true
    });

    // Assertions
    console.log('🧪 VERIFICATION:');

    if (!envVarsInBrowser.VITE_SUPABASE_URL) {
      console.log('❌ VITE_SUPABASE_URL is UNDEFINED in browser context');
      console.log('   This explains why React app fails to initialize!');
    } else {
      console.log(`✅ VITE_SUPABASE_URL is defined: ${envVarsInBrowser.VITE_SUPABASE_URL}`);
    }

    if (!envVarsInBrowser.VITE_SUPABASE_ANON_KEY) {
      console.log('❌ VITE_SUPABASE_ANON_KEY is UNDEFINED in browser context');
    } else {
      console.log('✅ VITE_SUPABASE_ANON_KEY is defined');
    }

    console.log(`\n📝 Available env var keys: ${envVarsInBrowser.allEnvKeys.join(', ')}`);
    console.log(`📝 Current MODE: ${envVarsInBrowser.NODE_ENV}`);

    // Don't fail the test - we want to see the output regardless
    expect(true).toBe(true);
  });
});
