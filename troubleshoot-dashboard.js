const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Navigating to dashboard...');
  await page.goto('http://localhost:5176/');

  // Wait a moment to see what loads
  await page.waitForTimeout(2000);

  console.log('📸 Taking screenshot of current state...');
  await page.screenshot({ path: 'dashboard-before-clear.png', fullPage: true });

  console.log('🗑️ Clearing local storage and session storage...');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log('🔄 Reloading page...');
  await page.reload();
  await page.waitForTimeout(3000);

  console.log('📸 Taking screenshot after clearing storage...');
  await page.screenshot({ path: 'dashboard-after-clear.png', fullPage: true });

  // Check what's in the console
  page.on('console', msg => console.log('Browser:', msg.text()));

  // Log any errors
  page.on('pageerror', error => console.log('Page Error:', error.message));

  // Check network requests
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log('Supabase Request:', request.url());
    }
  });

  console.log('✅ Troubleshooting complete. Check screenshots:');
  console.log('   - dashboard-before-clear.png');
  console.log('   - dashboard-after-clear.png');
  console.log('\nPress Ctrl+C to close browser...');

  // Keep browser open for inspection
  await page.waitForTimeout(60000);

  await browser.close();
})();
