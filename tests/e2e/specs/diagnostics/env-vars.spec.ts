import { test, expect } from "@playwright/test";

/**
 * Diagnostic test to verify environment variables are accessible in Playwright's browser context
 *
 * This test investigates the root cause of React app initialization failure by:
 * 1. Capturing all console messages (including the debug logs from supabase.ts:4-8)
 * 2. Checking if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined
 * 3. Reporting what the browser actually sees
 */
test.describe("Environment Variables Diagnostic", () => {
  test("should have Supabase env vars available in browser context", async ({ page }) => {
    // Capture ALL console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    console.log("\n🔍 Starting environment variable diagnostic...\n");

    // Navigate to app
    await page.goto("/");

    // Wait a bit for modules to load
    await page.waitForTimeout(3000);

    // Try to check if global config is available
    const globalConfig = await page.evaluate(() => {
      // Check window object for any exposed config
      return {
        hasSupabaseClient: typeof (window as any).supabase !== "undefined",
        windowKeys: Object.keys(window).filter(
          (k) => k.toLowerCase().includes("vite") || k.toLowerCase().includes("supabase")
        ),
      };
    });

    // Report findings
    console.log("📊 DIAGNOSTIC RESULTS:");
    console.log("─────────────────────────────────────────────");
    console.log("\n1. Global config in browser context:");
    console.log(JSON.stringify(globalConfig, null, 2));

    console.log("\n2. All console messages captured:");
    consoleMessages.forEach((msg, i) => {
      console.log(`   [${i}] ${msg.type}: ${msg.text}`);
    });

    console.log("\n3. Page errors:");
    if (pageErrors.length === 0) {
      console.log("   ✅ No page errors");
    } else {
      pageErrors.forEach((err, i) => {
        console.log(`   ❌ [${i}] ${err}`);
      });
    }

    console.log("\n4. Supabase init debug logs:");
    const supabaseInitLogs = consoleMessages.filter((msg) => msg.text.includes("[SUPABASE INIT]"));
    if (supabaseInitLogs.length === 0) {
      console.log("   ⚠️  No Supabase init logs found - module may not have loaded");
    } else {
      supabaseInitLogs.forEach((log) => {
        console.log(`   ${log.text}`);
      });
    }

    console.log("\n─────────────────────────────────────────────\n");

    // Take screenshot for visual reference
    await page.screenshot({
      path: "test-results/env-vars-diagnostic.png",
      fullPage: true,
    });

    // Assertions
    console.log("🧪 VERIFICATION:");

    // Check if we got the Supabase init debug log
    const supabaseInitLog = consoleMessages.find((msg) => msg.text.includes("[SUPABASE INIT]"));
    if (!supabaseInitLog) {
      console.log("❌ No Supabase initialization log found");
      console.log("   This means supabase.ts module never loaded/executed");
      console.log("   → React app failed to initialize");
    } else {
      console.log("✅ Supabase initialization attempted");

      // Check if the log indicates missing env vars
      if (
        supabaseInitLog.text.includes("undefined") ||
        supabaseInitLog.text.includes("is not defined")
      ) {
        console.log("❌ Environment variables are UNDEFINED");
        console.log("   → This is the root cause!");
      }
    }

    console.log(
      `\n📝 Window keys related to config: ${globalConfig.windowKeys.join(", ") || "none"}`
    );

    // Don't fail the test - we want to see the output regardless
    expect(true).toBe(true);
  });
});
