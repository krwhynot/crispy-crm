import { test, expect } from "../support/fixtures/authenticated";
import { consoleMonitor } from "../support/utils/console-monitor";
import { PipelineDrillDownPOM } from "../support/poms/PipelineDrillDownPOM";

/**
 * Pipeline Drill-Down E2E Tests
 *
 * Tests the pipeline drill-down functionality on Dashboard V3.
 * When a user clicks a principal row in the Pipeline table,
 * a sheet opens showing that principal's opportunities.
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Model (PipelineDrillDownPOM) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting ✓
 *
 * Component: PrincipalPipelineTable.tsx → PipelineDrillDownSheet.tsx
 * Feature: B3 Pipeline Drill-Down from Polish & Consistency Plan
 */

test.describe("Pipeline Drill-Down - Dashboard V3", () => {
  let drillDownPOM: PipelineDrillDownPOM;

  test.beforeEach(async ({ authenticatedPage }) => {
    drillDownPOM = new PipelineDrillDownPOM(authenticatedPage);

    // Navigate to Dashboard V3
    await authenticatedPage.goto("/");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for the Pipeline table to be visible
    const pipelineHeading = authenticatedPage.getByRole("heading", {
      name: /pipeline by principal/i,
    });
    await expect(pipelineHeading).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Fail test if unexpected console errors
    expect(
      errors.filter((e) => !e.includes("ResizeObserver")),
      "Console errors detected"
    ).toHaveLength(0);
  });

  test.describe("Opening Drill-Down Sheet", () => {
    test("clicking a pipeline row opens the drill-down sheet", async ({ authenticatedPage }) => {
      // Get the first pipeline row button
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      // Get the principal name from aria-label
      const ariaLabel = await pipelineRow.getAttribute("aria-label");
      const principalName = ariaLabel?.replace("View opportunities for ", "") || "";

      // Click the row
      await pipelineRow.click();

      // Verify sheet opens with correct principal name
      await drillDownPOM.expectSheetOpenForPrincipal(principalName);
    });

    test("drill-down sheet shows loading state while fetching", async ({ authenticatedPage }) => {
      // Delay API response to observe loading state
      await authenticatedPage.route("**/rest/v1/opportunities*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Click first pipeline row
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();

      // Check for loading state
      await drillDownPOM.waitForSheetOpen();
      const isLoading = await drillDownPOM.isLoading();
      expect(isLoading).toBe(true);
    });

    test("drill-down sheet displays opportunity count", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      // Verify description shows count (e.g., "3 opportunities" or "1 opportunity")
      const description = drillDownPOM.getSheetDescription();
      await expect(description).toBeVisible();
      const text = await description.textContent();
      expect(text).toMatch(/\d+\s+opportunit(y|ies)/i);
    });
  });

  test.describe("Opportunity Display", () => {
    test("drill-down shows opportunity cards with stage badges", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      // Check if opportunities exist or empty state
      const oppCount = await drillDownPOM.getOpportunityCards().count();
      const isEmpty = await drillDownPOM.isEmptyState();

      if (oppCount > 0) {
        // Verify stage badges are visible
        const stageBadges = drillDownPOM.getStageBadges();
        await expect(stageBadges.first()).toBeVisible();
      } else {
        expect(isEmpty).toBe(true);
      }
    });

    test("drill-down shows pipeline summary stats when opportunities exist", async ({
      authenticatedPage,
    }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      const oppCount = await drillDownPOM.getOpportunityCards().count();

      if (oppCount > 0) {
        // Verify summary stats are visible
        await drillDownPOM.expectPipelineStatsVisible();
      }
    });

    test("drill-down shows empty state for principal with no opportunities", async ({
      authenticatedPage,
    }) => {
      // Intercept API to return empty array
      await authenticatedPage.route("**/rest/v1/opportunities*", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          });
        } else {
          await route.continue();
        }
      });

      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      // Verify empty state
      await drillDownPOM.expectEmptyState();
    });

    test("drill-down shows error state when API fails", async ({ authenticatedPage }) => {
      // Intercept API to force failure
      await authenticatedPage.route("**/rest/v1/opportunities*", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Internal server error" }),
          });
        } else {
          await route.continue();
        }
      });

      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();

      // Verify error state
      await drillDownPOM.expectErrorState();
    });
  });

  test.describe("Navigation from Drill-Down", () => {
    test("clicking opportunity card navigates to opportunity detail", async ({
      authenticatedPage,
    }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      const oppCount = await drillDownPOM.getOpportunityCards().count();
      if (oppCount === 0) {
        test.skip("No opportunities to click");
        return;
      }

      // Click first opportunity
      await drillDownPOM.clickFirstOpportunity();

      // Verify navigation to opportunities page with view param
      await expect(authenticatedPage).toHaveURL(/\/opportunities\?view=\d+/);
    });

    test("opportunity card is keyboard accessible (Enter/Space)", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      const oppCards = drillDownPOM.getOpportunityCards();
      const oppCount = await oppCards.count();

      if (oppCount === 0) {
        test.skip("No opportunities for keyboard test");
        return;
      }

      // Focus the first opportunity card
      await oppCards.first().focus();
      await expect(oppCards.first()).toBeFocused();

      // Press Enter to activate
      await authenticatedPage.keyboard.press("Enter");

      // Should navigate
      await expect(authenticatedPage).toHaveURL(/\/opportunities\?view=\d+/);
    });
  });

  test.describe("Closing Drill-Down Sheet", () => {
    test("close button dismisses the sheet", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();

      // Close via button
      await drillDownPOM.close();

      // Verify closed
      await drillDownPOM.waitForSheetClosed();
    });

    test("pressing Escape closes the sheet", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();

      // Close via Escape
      await drillDownPOM.closeWithEscape();

      // Verify closed
      await drillDownPOM.waitForSheetClosed();
    });

    test("clicking overlay/backdrop closes the sheet", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();

      // Close by clicking outside
      await drillDownPOM.closeByClickingOutside();

      // Verify closed
      await drillDownPOM.waitForSheetClosed();
    });
  });

  test.describe("Accessibility", () => {
    test("sheet has proper ARIA attributes", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();

      // Verify dialog role
      const sheet = drillDownPOM.getSheet();
      await expect(sheet).toHaveAttribute("role", "dialog");
      await expect(sheet).toHaveAttribute("aria-modal", "true");
    });

    test("pipeline row has proper aria-label", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      // Verify aria-label includes principal name
      const ariaLabel = await pipelineRow.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/view opportunities for .+/i);
    });

    test("opportunity cards have proper aria-labels", async ({ authenticatedPage }) => {
      const pipelineRow = authenticatedPage
        .getByRole("button", { name: /view opportunities for/i })
        .first();

      const rowCount = await pipelineRow.count();
      if (rowCount === 0) {
        test.skip("No pipeline data available");
        return;
      }

      await pipelineRow.click();
      await drillDownPOM.waitForSheetOpen();
      await drillDownPOM.waitForOpportunitiesLoaded();

      const oppCards = drillDownPOM.getOpportunityCards();
      const oppCount = await oppCards.count();

      if (oppCount === 0) {
        test.skip("No opportunities for aria-label test");
        return;
      }

      // Verify aria-label on first opportunity
      const ariaLabel = await oppCards.first().getAttribute("aria-label");
      expect(ariaLabel).toMatch(/view .+/i);
    });
  });
});
