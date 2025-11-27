import { test, expect } from "../support/fixtures/authenticated";
import { createSlideOver, createListPage } from "../support/fixtures/design-system";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * Opportunity Slide-Over Tabs E2E Tests
 *
 * Tests the OpportunitySlideOver component with seeded sample data from:
 *   supabase/seed-sample-opportunity.sql
 *
 * Sample opportunity: "Hubbard Inn Indian Menu Launch - Q1 2025"
 *   - Customer: 8 hospitality group (ID 6)
 *   - Principal: Rapid Rasoi (ID 1802)
 *   - Distributor: A & G FOODSERVICE (ID 9)
 *   - 5 contacts with roles (Decision Maker, Influencer, Purchasing, Operations, Distributor Rep)
 *   - 5 products (Delhi Tikka, Makhani, Tandoori, Biryani, Korma)
 *   - 4 notes (conversation history)
 *
 * Per playwright-e2e-testing skill:
 *   - Page Object Models (via fixtures)
 *   - Semantic selectors (getByRole, getByText)
 *   - Console monitoring for diagnostics
 *   - Condition-based waiting
 */

// Sample opportunity name from seed-sample-opportunity.sql
const SAMPLE_OPPORTUNITY_NAME = "Hubbard Inn Indian Menu Launch";

test.describe("Opportunity Slide-Over - Tab Content", () => {
  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Allow known non-critical errors (like 404s for optional resources)
    const criticalErrors = errors.filter(
      (err) => !err.includes("404") && !err.includes("favicon")
    );
    expect(criticalErrors, "Critical console errors detected").toHaveLength(0);
  });

  test.describe("Tab Structure", () => {
    test("opportunity slide-over has all 4 tabs", async ({ authenticatedPage }) => {
      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.openFromRow("opportunities", 0);

      await slideOver.expectVisible();

      // Verify all 4 tabs are present
      await slideOver.expectTabs(["Details", "Contacts", "Products", "Notes"]);
    });

    test("tabs switch content when clicked", async ({ authenticatedPage }) => {
      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.openFromRow("opportunities", 0);

      await slideOver.expectVisible();

      // Switch through each tab
      const tabs = ["Details", "Contacts", "Products", "Notes"];

      for (const tabName of tabs) {
        await slideOver.switchTab(tabName);
        await slideOver.expectVisible();

        // Tab panel should be visible after switch
        const panel = slideOver.getTabPanel();
        await expect(panel).toBeVisible();
      }
    });
  });

  test.describe("Details Tab", () => {
    test("displays opportunity name and description", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      // Find and click the sample opportunity row
      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      // Skip if sample opportunity not found (seed script not run)
      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      // Verify Details tab content
      const panel = slideOver.getTabPanel();

      // Check for opportunity name
      await expect(panel.getByText(SAMPLE_OPPORTUNITY_NAME)).toBeVisible();

      // Check for description content
      await expect(panel.getByText(/multi-location rollout/i)).toBeVisible();
    });

    test("displays stage and priority badges", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      const panel = slideOver.getTabPanel();

      // Check for stage badge (demo_scheduled)
      await expect(panel.getByText(/demo scheduled/i)).toBeVisible();

      // Check for priority badge (critical)
      await expect(panel.getByText(/critical/i)).toBeVisible();
    });

    test("displays all 3 organization cards", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      const panel = slideOver.getTabPanel();

      // Check for organization labels
      await expect(panel.getByText(/customer/i).first()).toBeVisible();
      await expect(panel.getByText(/principal/i).first()).toBeVisible();
      await expect(panel.getByText(/distributor/i).first()).toBeVisible();

      // Check for organization names from seed data
      await expect(panel.getByText(/8 hospitality group/i)).toBeVisible();
      await expect(panel.getByText(/rapid rasoi/i)).toBeVisible();
      await expect(panel.getByText(/a & g foodservice/i)).toBeVisible();
    });

    test("displays lead source and close date", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      const panel = slideOver.getTabPanel();

      // Check for lead source (trade_show)
      await expect(panel.getByText(/trade show/i)).toBeVisible();

      // Check for estimated close date label
      await expect(panel.getByText(/est\. close/i)).toBeVisible();
    });
  });

  test.describe("Contacts Tab", () => {
    test("displays 5 contacts with roles", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      // Switch to Contacts tab
      await slideOver.switchTab("Contacts");

      const panel = slideOver.getTabPanel();

      // Wait for contacts to load (data fetching is conditional on tab active)
      await authenticatedPage.waitForTimeout(500);

      // Check for role badges from seed data
      const roles = ["Decision Maker", "Influencer", "Purchasing", "Operations", "Distributor Rep"];

      for (const role of roles) {
        const roleElement = panel.getByText(role);
        await expect(roleElement, `Role "${role}" should be visible`).toBeVisible();
      }
    });

    test("shows primary contact indicator", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      await slideOver.switchTab("Contacts");
      await authenticatedPage.waitForTimeout(500);

      const panel = slideOver.getTabPanel();

      // Check for "Primary" badge (from is_primary=true in seed data)
      await expect(panel.getByText(/primary/i)).toBeVisible();
    });
  });

  test.describe("Products Tab", () => {
    test("displays 5 products from seed data", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      // Switch to Products tab
      await slideOver.switchTab("Products");

      const panel = slideOver.getTabPanel();

      // Wait for products to load
      await authenticatedPage.waitForTimeout(500);

      // Check for product names from seed data
      const products = [
        "Delhi Tikka Gravy Base",
        "Makhani Gravy Base",
        "Tandoori Marination",
        "Biryani Mix",
        "Korma Gravy Base",
      ];

      for (const product of products) {
        const productElement = panel.getByText(product);
        await expect(productElement, `Product "${product}" should be visible`).toBeVisible();
      }
    });

    test("displays product notes", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      await slideOver.switchTab("Products");
      await authenticatedPage.waitForTimeout(500);

      const panel = slideOver.getTabPanel();

      // Check for product notes from seed data
      await expect(panel.getByText(/chef favorite from samples/i)).toBeVisible();
    });
  });

  test.describe("Notes Tab", () => {
    test("displays 4 notes from conversation history", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      // Switch to Notes tab
      await slideOver.switchTab("Notes");

      const panel = slideOver.getTabPanel();

      // Wait for notes to load
      await authenticatedPage.waitForTimeout(500);

      // Check for note content from seed data
      const noteExcerpts = [
        "NRA Show booth",
        "Follow-up call",
        "sample kit",
        "kitchen team loves",
      ];

      for (const excerpt of noteExcerpts) {
        const noteElement = panel.getByText(new RegExp(excerpt, "i"));
        await expect(noteElement, `Note containing "${excerpt}" should be visible`).toBeVisible();
      }
    });

    test("notes are in chronological order (newest first)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      await slideOver.switchTab("Notes");
      await authenticatedPage.waitForTimeout(500);

      const panel = slideOver.getTabPanel();

      // Get all note texts and verify order
      // The most recent note should appear first (kitchen team loves)
      const notesContainer = panel.locator('[class*="space-y"]').first();
      const firstNote = notesContainer.locator("p").first();

      // Most recent note mentions "kitchen team loves" (from 2 days ago)
      await expect(firstNote.getByText(/kitchen team loves|check-in call/i)).toBeVisible();
    });

    test("note creation form is visible", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      await slideOver.switchTab("Notes");
      await authenticatedPage.waitForTimeout(500);

      const panel = slideOver.getTabPanel();

      // Check for note creation input/textarea
      const noteInput = panel.locator('textarea, input[type="text"]').first();
      await expect(noteInput).toBeVisible();
    });
  });

  test.describe("Tab Persistence", () => {
    test("active tab persists when switching modes", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const sampleRow = authenticatedPage.getByRole("row", {
        name: new RegExp(SAMPLE_OPPORTUNITY_NAME, "i"),
      });

      if ((await sampleRow.count()) === 0) {
        test.skip();
        return;
      }

      await sampleRow.click();
      await authenticatedPage.waitForTimeout(300);

      const slideOver = createSlideOver(authenticatedPage);
      await slideOver.expectVisible();

      // Switch to Contacts tab
      await slideOver.switchTab("Contacts");
      await authenticatedPage.waitForTimeout(300);

      // Toggle to edit mode
      await slideOver.toggleMode("edit");
      await authenticatedPage.waitForTimeout(300);

      // Contacts tab should still be active
      const contactsTab = slideOver.getTab("Contacts");
      const isSelected = await contactsTab.getAttribute("aria-selected");
      expect(isSelected).toBe("true");
    });
  });
});
