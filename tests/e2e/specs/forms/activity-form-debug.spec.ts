import { test, expect } from "@playwright/test";

/**
 * Debug test to understand Radix combobox interaction
 * Run with: npm run test:e2e -- --grep "DEBUG" --project=chromium --headed
 */
test.describe("DEBUG - Activity Form Combobox", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("DEBUG - Explore opportunity combobox structure", async ({ page }) => {
    await page.goto("/#/activities/create");
    await page.waitForURL(/\/#\/activities\/create/, { timeout: 10000 });

    // Wait for form to load
    const subjectInput = page.getByLabel(/subject/i);
    await expect(subjectInput).toBeVisible({ timeout: 10000 });

    // Fill subject first
    await subjectInput.fill("Debug Test");

    // Find opportunity combobox within main
    const main = page.getByRole("main");

    // Log all groups with their text
    const groups = main.getByRole("group");
    const groupCount = await groups.count();
    console.log(`Found ${groupCount} groups`);

    for (let i = 0; i < groupCount; i++) {
      const text = await groups.nth(i).textContent();
      console.log(`Group ${i}: ${text?.substring(0, 50)}...`);
    }

    // Try to find Opportunity group
    const opportunityGroup = main.locator('[role="group"]').filter({
      hasText: "Opportunity",
    });
    const oppGroupCount = await opportunityGroup.count();
    console.log(`Opportunity groups found: ${oppGroupCount}`);

    if (oppGroupCount > 0) {
      // Get the first opportunity group
      const firstOppGroup = opportunityGroup.first();
      const html = await firstOppGroup.innerHTML();
      console.log(`Opportunity group HTML (first 500 chars): ${html.substring(0, 500)}`);

      // Find combobox within this group
      const comboboxes = firstOppGroup.getByRole("combobox");
      const cbCount = await comboboxes.count();
      console.log(`Comboboxes in opportunity group: ${cbCount}`);

      if (cbCount > 0) {
        const firstCombobox = comboboxes.first();
        const cbText = await firstCombobox.textContent();
        console.log(`First combobox text: ${cbText}`);

        // Click the combobox
        await firstCombobox.click();
        console.log("Clicked combobox");

        // Wait a moment for popover
        await page.waitForTimeout(1000);

        // Check for dialog or listbox
        const dialog = page.getByRole("dialog");
        const listbox = page.getByRole("listbox");

        const dialogVisible = await dialog.isVisible().catch(() => false);
        const listboxVisible = await listbox.isVisible().catch(() => false);

        console.log(`Dialog visible: ${dialogVisible}`);
        console.log(`Listbox visible: ${listboxVisible}`);

        if (dialogVisible) {
          const dialogHtml = await dialog.innerHTML();
          console.log(`Dialog HTML (first 500 chars): ${dialogHtml.substring(0, 500)}`);
        }

        if (listboxVisible) {
          const options = listbox.getByRole("option");
          const optCount = await options.count();
          console.log(`Options in listbox: ${optCount}`);

          for (let j = 0; j < Math.min(optCount, 5); j++) {
            const optText = await options.nth(j).textContent();
            console.log(`Option ${j}: ${optText}`);
          }
        }

        // The dialog uses Command pattern (cmdk) - find the search input
        if (dialogVisible) {
          // Command input has cmdk-input attribute
          const cmdkInput = dialog.locator("[cmdk-input]");
          const cmdkInputVisible = await cmdkInput.isVisible().catch(() => false);
          console.log(`cmdk-input visible: ${cmdkInputVisible}`);

          if (cmdkInputVisible) {
            // Type a search term
            await cmdkInput.fill("Gun Lake");
            console.log("Typed 'Gun Lake' in command input");

            // Wait for results
            await page.waitForTimeout(1000);

            // Command items have cmdk-item attribute
            const cmdkItems = dialog.locator("[cmdk-item]");
            const itemCount = await cmdkItems.count();
            console.log(`cmdk-item count after search: ${itemCount}`);

            for (let j = 0; j < Math.min(itemCount, 5); j++) {
              const itemText = await cmdkItems.nth(j).textContent();
              console.log(`Item ${j}: ${itemText?.substring(0, 80)}`);
            }

            // Click the first item if available
            if (itemCount > 0) {
              await cmdkItems.first().click();
              console.log("Clicked first command item");

              // Wait and check if dialog closed
              await page.waitForTimeout(500);
              const stillOpen = await dialog.isVisible().catch(() => false);
              console.log(`Dialog still visible after click: ${stillOpen}`);

              // Check if combobox now has a value
              const newCbText = await comboboxes.first().textContent();
              console.log(`Combobox text after selection: ${newCbText}`);
            }
          }
        }

        // Try to find a search input
        const searchInputs = page.locator(
          'input[type="text"], input[type="search"], [role="combobox"]'
        );
        const inputCount = await searchInputs.count();
        console.log(`Potential search inputs: ${inputCount}`);

        // Take a screenshot
        await page.screenshot({ path: "test-results/debug-combobox-open.png" });
      }
    }

    // Let test pass - this is just for debugging
    expect(true).toBe(true);
  });
});
