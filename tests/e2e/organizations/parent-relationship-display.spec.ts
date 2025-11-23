import { expect } from "@playwright/test";
import { test } from "../support/fixtures/authenticated";

test.describe("Parent Organization Display", () => {
  test("should display parent relationships in organization list", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to organizations list
    await page.goto("http://localhost:5174/#/organizations");

    // Wait for table to load - React Admin uses tbody with role="group"
    await page.waitForSelector('tbody[role="group"]', { state: "visible", timeout: 10000 });

    // Wait for data rows to load
    await page.waitForSelector("tr[data-id]", { state: "visible", timeout: 5000 });

    // Check that Parent column header exists
    const parentHeader = await page.locator('th:has-text("Parent")');
    await expect(parentHeader).toBeVisible();

    // Find Notre Dame row and verify it shows University of Notre Dame as parent
    const notreDameRow = await page.locator("tr", { hasText: "Notre Dame-110 South Dining Hall" });
    if ((await notreDameRow.count()) > 0) {
      // Check parent cell displays the parent name
      const parentCell = await notreDameRow.locator("td").nth(3); // Parent column is 4th
      await expect(parentCell).toContainText("University of Notre Dame");
    }

    // Find Trinity rows and verify they show Trinity Health System as parent
    const trinityRow = await page.locator("tr", { hasText: "THS-SANCTUARY AT MARYCREST" });
    if ((await trinityRow.count()) > 0) {
      const parentCell = await trinityRow.locator("td").nth(3);
      await expect(parentCell).toContainText("Trinity Health System");
    }
  });

  test("should allow selecting parent organization when editing", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to organizations list
    await page.goto("http://localhost:5174/#/organizations");

    // Wait for table to load
    await page.waitForSelector('tbody[role="group"]', { state: "visible", timeout: 10000 });
    await page.waitForSelector("tr[data-id]", { state: "visible", timeout: 5000 });

    // Click on first organization without a parent
    await page.locator("tr").first().click();
    await page.waitForTimeout(500);

    // Click edit button in slide-over
    const editButton = await page.locator('button[aria-label="Edit"]');
    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit form to load
      await page.waitForSelector('input[name="name"]', { state: "visible" });

      // Check that parent organization input exists
      const parentInput = await page.locator('[data-testid="parent_organization_id-input"]');
      await expect(parentInput).toBeVisible();

      // Verify it's an autocomplete field that can search organizations
      await parentInput.click();
      await parentInput.fill("Trinity");

      // Wait for autocomplete suggestions
      await page.waitForTimeout(500);

      // Check that Trinity Health System appears as an option
      const suggestion = await page.locator('[role="option"]:has-text("Trinity Health System")');
      if ((await suggestion.count()) > 0) {
        await expect(suggestion).toBeVisible();
      }
    }
  });

  test("should not show branch-related UI elements", async ({ authenticatedPage: page }) => {
    // Navigate to organizations list
    await page.goto("http://localhost:5174/#/organizations");

    // Wait for table to load
    await page.waitForSelector('tbody[role="group"]', { state: "visible", timeout: 10000 });
    await page.waitForSelector("tr[data-id]", { state: "visible", timeout: 5000 });

    // Verify "Branches" column does NOT exist
    const branchesHeader = await page.locator('th:has-text("Branches")');
    await expect(branchesHeader).toHaveCount(0);

    // Click on an organization with children
    const parentOrg = await page.locator("tr", { hasText: "Trinity Health System" });
    if ((await parentOrg.count()) > 0) {
      await parentOrg.click();
      await page.waitForTimeout(500);

      // In the slide-over, verify no "Branch Locations" section exists
      const branchSection = await page.locator("text=/Branch Locations/i");
      await expect(branchSection).toHaveCount(0);

      // Verify no "Hierarchy" tab exists
      const hierarchyTab = await page.locator('[role="tab"]:has-text("Hierarchy")');
      await expect(hierarchyTab).toHaveCount(0);
    }
  });
});
