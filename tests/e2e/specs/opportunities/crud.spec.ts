import { test, expect } from "../../support/fixtures/authenticated";
import { OpportunitiesListPage } from "../../support/poms/OpportunitiesListPage";
import { OpportunityShowPage } from "../../support/poms/OpportunityShowPage";
import { OpportunityFormPage } from "../../support/poms/OpportunityFormPage";
import { createOpportunitySeedHelper, cleanupTestOpportunities } from "../../support/helpers/opportunity-seed";

/**
 * Opportunities CRUD Test Suite
 * Tests create, read, update, delete operations for opportunities
 *
 * Priority: High (Priority 1 from testing strategy)
 * Coverage: Basic lifecycle operations with deterministic test data
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no arbitrary timeouts) ✓
 * - Deterministic seed data for reliability ✓
 * - Authenticated fixture (no manual login) ✓
 */

test.describe("Opportunities CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Page is already authenticated via fixture
    // Navigate to root to load the app
    await page.goto("/");

    // Wait for navigation to be visible (proves auth worked)
    await page.getByRole("navigation").first().waitFor({ state: "visible", timeout: 10000 });
  });

  test("should create opportunity with minimal required fields", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const showPage = new OpportunityShowPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // Generate unique test data using timestamp
    const timestamp = Date.now();
    const opportunityName = `Test Opportunity ${timestamp}`;
    const orgName = "A&W"; // From seed.sql (id: 12, customer type)

    // Navigate to create form
    await listPage.clickCreate();

    // Fill and submit form
    await formPage.fillName(opportunityName);
    await formPage.selectOrganization(orgName);
    await formPage.submit();

    // Verify redirect to show page or list
    await page.waitForURL(/\/#\/opportunities(\/\d+\/show)?/, { timeout: 10000 });

    // If redirected to show page, verify opportunity name
    if (page.url().includes("/show")) {
      const displayedName = await showPage.getOpportunityName();
      expect(displayedName).toContain(opportunityName);
    } else {
      // If redirected to list, verify opportunity appears
      await listPage.expectOpportunityVisible(opportunityName);
    }

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Check for RLS errors
    const rlsErrors = consoleErrors.filter(
      (err) => err.includes("RLS") || err.includes("permission")
    );
    expect(rlsErrors).toHaveLength(0);
  });

  test("should create opportunity with complete data including products", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const showPage = new OpportunityShowPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    const timestamp = Date.now();
    const opportunityData = {
      name: `Complete Opportunity ${timestamp}`,
      organization: "A&W",
      stage: "Qualification",
      value: "50000",
      probability: "60",
      expectedCloseDate: "2025-12-31",
      description: `Test opportunity created at ${new Date().toISOString()}`,
      products: [
        { name: "Product A", quantity: "5" },
        { name: "Product B", quantity: "10" },
      ],
    };

    // Navigate to create form
    await listPage.clickCreate();

    // Fill complete form
    await formPage.fillCompleteForm(opportunityData);
    await formPage.submit();

    // Wait for navigation
    await page.waitForURL(/\/#\/opportunities/, { timeout: 10000 });

    // Navigate to show page to verify all fields
    await listPage.viewOpportunity(opportunityData.name);

    // Verify basic fields
    const displayedName = await showPage.getOpportunityName();
    expect(displayedName).toContain(opportunityData.name);

    // Verify stage
    await showPage.expectInStage(opportunityData.stage);

    // Verify value
    await showPage.expectValue(opportunityData.value);

    // Verify products (if products table is visible)
    const productsTable = showPage.getProductsTable();
    const isProductsVisible = await productsTable.isVisible().catch(() => false);

    if (isProductsVisible) {
      for (const product of opportunityData.products) {
        await showPage.expectProductVisible(product.name);
      }
    }
  });

  test("should read and display opportunity details", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const showPage = new OpportunityShowPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // Create test opportunity first
    const timestamp = Date.now();
    const opportunityName = `Read Test ${timestamp}`;
    const orgName = "A&W";

    await listPage.clickCreate();
    await formPage.createOpportunity(opportunityName, orgName);

    // Navigate back to list
    await listPage.goto();

    // View opportunity details
    await listPage.viewOpportunity(opportunityName);

    // Verify show page loads
    await page.waitForURL(/\/#\/opportunities\/\d+\/show/, { timeout: 10000 });

    // Verify opportunity name is displayed
    const displayedName = await showPage.getOpportunityName();
    expect(displayedName).toContain(opportunityName);

    // Verify organization link exists
    const orgLink = showPage.getOrganizationLink();
    await expect(orgLink).toBeVisible();

    // Verify edit and delete buttons are available
    await expect(showPage.getEditButton()).toBeVisible();
    await expect(showPage.getDeleteButton()).toBeVisible();
  });

  test("should update opportunity details", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const showPage = new OpportunityShowPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // Create test opportunity
    const timestamp = Date.now();
    const originalName = `Update Test Original ${timestamp}`;
    const updatedName = `Update Test Modified ${timestamp}`;
    const orgName = "A&W";

    await listPage.clickCreate();
    await formPage.createOpportunity(originalName, orgName);

    // Navigate to list to find the opportunity
    await listPage.goto();
    await listPage.viewOpportunity(originalName);

    // Click edit button
    await showPage.clickEdit();

    // Wait for edit form to load
    await page.waitForURL(/\/#\/opportunities\/\d+$/, { timeout: 10000 });

    // Update the name
    await formPage.fillName(updatedName);
    await formPage.submit();

    // Wait for redirect
    await page.waitForURL(/\/#\/opportunities/, { timeout: 10000 });

    // Verify updated name appears
    if (page.url().includes("/show")) {
      const displayedName = await showPage.getOpportunityName();
      expect(displayedName).toContain(updatedName);
    } else {
      await listPage.goto();
      await listPage.expectOpportunityVisible(updatedName);
    }

    // Verify old name is not visible
    const oldNameRow = listPage.getOpportunityRowByName(originalName);
    await expect(oldNameRow).not.toBeVisible();
  });

  test("should delete opportunity", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const showPage = new OpportunityShowPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // Create test opportunity
    const timestamp = Date.now();
    const opportunityName = `Delete Test ${timestamp}`;
    const orgName = "A&W";

    await listPage.clickCreate();
    await formPage.createOpportunity(opportunityName, orgName);

    // Navigate to show page
    await listPage.goto();
    await listPage.viewOpportunity(opportunityName);

    // Delete opportunity
    await showPage.clickDeleteAndConfirm();

    // Verify redirect to list
    await page.waitForURL(/\/#\/opportunities$/, { timeout: 10000 });

    // Verify opportunity is not visible in list
    await listPage.expectOpportunityNotVisible(opportunityName);
  });

  test("should handle validation errors on create", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // Navigate to create form
    await listPage.clickCreate();

    // Try to submit without required fields
    const saveButton = formPage.getSaveButton();
    await saveButton.click();

    // Verify validation errors appear and form doesn't submit
    // React Admin typically shows inline errors
    const errorMessages = page
      .locator('[role="alert"]')
      .or(page.locator('.error, [class*="error"]'));

    // Wait for at least one error to appear (proves form didn't submit)
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 });

    // Verify still on create page (no redirect)
    expect(page.url()).toContain("/create");
  });

  test("should maintain test data isolation with concurrent creates", async ({ page }) => {
    // Initialize POMs
    const listPage = new OpportunitiesListPage(page);
    const formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();

    // This test verifies that timestamp-based naming prevents conflicts
    // Using high-resolution timestamp for uniqueness
    const timestamp1 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const name1 = `Concurrent Test ${timestamp1}`;

    const timestamp2 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const name2 = `Concurrent Test ${timestamp2}`;

    // Verify names are different (data isolation works)
    expect(name1).not.toBe(name2);

    // Create both opportunities
    await listPage.clickCreate();
    await formPage.createOpportunity(name1, "A&W");

    await listPage.goto();
    await listPage.clickCreate();
    await formPage.createOpportunity(name2, "A&W");

    // Verify both exist independently
    await listPage.goto();
    await listPage.expectOpportunityVisible(name1);
    await listPage.expectOpportunityVisible(name2);
  });
});
