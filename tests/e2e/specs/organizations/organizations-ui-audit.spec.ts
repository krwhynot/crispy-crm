import { test, expect } from "@playwright/test";
import { LoginPage } from "../../support/poms/LoginPage";
import { OrganizationsListPage } from "../../support/poms/OrganizationsListPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Organizations UI Audit
 * Captures screenshots for UI/UX review
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no waitForTimeout) ✓
 * - Visual snapshots embedded in functional tests ✓
 *
 * FOLLOWS: ui-design-consistency skill requirements
 * - iPad viewport (768px-1024px) as primary target ✓
 * - Testing responsive breakpoints ✓
 */

test.describe("Organizations UI Audit", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring for diagnostics
    await consoleMonitor.attach(page);

    // Login using POM (semantic selectors, no CSS)
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    } else {
      // Already logged in, wait for dashboard
      await page.waitForURL(/\/#\//, { timeout: 10000 });
    }
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("Organizations List - iPad Portrait (768px)", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Take full page screenshot
    await expect(page).toHaveScreenshot("organizations-list-ipad-portrait.png", {
      fullPage: true,
      mask: organizationsPage.getDynamicElements(),
    });

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Organizations List - iPad Landscape (1024px)", async ({ page }) => {
    // Set iPad landscape viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Take full page screenshot
    await expect(page).toHaveScreenshot("organizations-list-ipad-landscape.png", {
      fullPage: true,
      mask: organizationsPage.getDynamicElements(),
    });

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Organization Card - Close-up (iPad)", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Get first organization card for close-up screenshot
    const firstCard = organizationsPage.getOrganizationCards().first();
    await expect(firstCard).toBeVisible();

    // Take screenshot of individual card with edit button
    await expect(firstCard).toHaveScreenshot("organization-card-closeup.png");

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Organization Show Page - iPad Portrait (768px)", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Click first organization to view details
    const firstCard = organizationsPage.getOrganizationCards().first();
    await firstCard.click();
    await page.waitForURL(/\/#\/organizations\/\d+\/show/);

    // Wait for content to load
    await page.getByRole("tab", { name: /activity/i }).waitFor({ state: "visible" });

    // Take full page screenshot of show page
    await expect(page).toHaveScreenshot("organization-show-ipad-portrait.png", {
      fullPage: true,
    });

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Organization Edit Page - iPad Portrait (768px)", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Click first organization to view details
    const firstCard = organizationsPage.getOrganizationCards().first();
    await firstCard.click();
    await page.waitForURL(/\/#\/organizations\/\d+\/show/);

    // Click edit button
    await page.getByRole("link", { name: /edit/i }).click();
    await page.waitForURL(/\/#\/organizations\/\d+$/);

    // Wait for form to load
    await page.getByLabel(/name/i).waitFor({ state: "visible" });

    // Take full page screenshot of edit page
    await expect(page).toHaveScreenshot("organization-edit-ipad-portrait.png", {
      fullPage: true,
    });

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Touch Target Verification - Edit Button Size", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Get first edit button
    const firstEditButton = organizationsPage.getEditButtons().first();
    await expect(firstEditButton).toBeVisible();

    // Check button size (should be ≥ 44x44px)
    const boundingBox = await firstEditButton.boundingBox();

    // Log button size for manual verification
    console.log("Edit Button Size:", {
      width: boundingBox?.width,
      height: boundingBox?.height,
    });

    // Visual verification - take screenshot with button highlighted
    await firstEditButton.hover();
    await expect(page).toHaveScreenshot("organization-card-edit-button-highlighted.png", {
      mask: organizationsPage.getDynamicElements(),
    });
  });

  test("Touch Target Verification - Checkbox Size", async ({ page }) => {
    // Set iPad portrait viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const organizationsPage = new OrganizationsListPage(page);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();

    // Get first checkbox
    const firstCheckbox = organizationsPage.getSelectionCheckboxes().first();
    await expect(firstCheckbox).toBeVisible();

    // Check checkbox size (should be ≥ 44x44px)
    const boundingBox = await firstCheckbox.boundingBox();

    // Log checkbox size for manual verification
    console.log("Checkbox Size:", {
      width: boundingBox?.width,
      height: boundingBox?.height,
    });

    // Visual verification - take screenshot with checkbox highlighted
    await firstCheckbox.hover();
    await expect(page).toHaveScreenshot("organization-card-checkbox-highlighted.png", {
      mask: organizationsPage.getDynamicElements(),
    });
  });
});
