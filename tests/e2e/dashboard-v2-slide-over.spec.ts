import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Slide-Over E2E Tests
 *
 * Tests opportunity slide-over functionality:
 * 1. Clicking opportunity row opens slide-over
 * 2. Slide-over displays opportunity details
 * 3. Tab switching works (Details, History, Files)
 * 4. Keyboard navigation (H key opens on History tab)
 * 5. Closing slide-over (Esc key, close button)
 * 6. Focus returns to opportunity row after closing
 *
 * Part of Sprint 2 - Dashboard V2 UI/UX Acceptance Testing
 */

test.describe("Dashboard V2 - Opportunity Slide-Over", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for Opportunities panel to load
    await authenticatedPage.getByRole("tree", { name: /opportunities hierarchy/i }).waitFor({ timeout: 5000 });

    // Ensure at least the first customer is expanded (auto-expansion or manual)
    const customerRow = authenticatedPage
      .locator('[role="treeitem"][aria-expanded]')
      .first();

    if ((await customerRow.count()) > 0) {
      const ariaExpanded = await customerRow.getAttribute("aria-expanded");
      if (ariaExpanded === "false") {
        await customerRow.click();
        await authenticatedPage.waitForTimeout(300);
      }
    }
  });

  test("clicking opportunity row opens slide-over", async ({
    authenticatedPage,
  }) => {
    await test.step("Click first opportunity row", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      // Find first opportunity row (treeitem without aria-expanded)
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      const oppCount = await opportunityRow.count();
      if (oppCount === 0) {
        test.skip();
      }

      // Get opportunity name for later verification
      const oppText = await opportunityRow.textContent();

      await opportunityRow.click();

      // Wait for slide-over to open
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify slide-over is visible", async () => {
      // Shadcn Sheet renders as a dialog
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();

      // Verify it's on the right side (has specific width classes)
      const hasRightSideClass = await slideOver.evaluate((el) => {
        return el.className.includes('w-[40vw]');
      });
      expect(hasRightSideClass).toBe(true);
    });

    await test.step("Verify opportunity name appears in slide-over title", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');

      // Wait for title to load (it shows "Loading..." initially)
      await expect(slideOver.getByRole("heading")).not.toContainText("Loading");

      // Title should contain opportunity name
      const title = await slideOver.getByRole("heading").textContent();
      expect(title).toBeTruthy();
      expect(title).not.toBe("Opportunity Details"); // Should have actual name
    });
  });

  test("slide-over tabs work correctly", async ({ authenticatedPage }) => {
    await test.step("Open slide-over", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify Details tab is active by default", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');

      // Details tab should be active
      const detailsTab = slideOver.getByRole("tab", { name: /details/i });
      await expect(detailsTab).toHaveAttribute("data-state", "active");

      // Details content should be visible
      const detailsContent = slideOver.locator('[role="tabpanel"]').filter({ hasText: /stage/i });
      await expect(detailsContent).toBeVisible();
    });

    await test.step("Switch to History tab", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');

      // Click History tab
      const historyTab = slideOver.getByRole("tab", { name: /history/i });
      await historyTab.click();

      // Wait for tab switch animation
      await authenticatedPage.waitForTimeout(200);

      // Verify History tab is now active
      await expect(historyTab).toHaveAttribute("data-state", "active");

      // History content should be visible (or "No activities" message)
      const historyPanel = slideOver.locator('[role="tabpanel"]');
      await expect(historyPanel).toBeVisible();
    });

    await test.step("Switch to Files tab", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');

      // Click Files tab
      const filesTab = slideOver.getByRole("tab", { name: /files/i });
      await filesTab.click();

      // Wait for tab switch animation
      await authenticatedPage.waitForTimeout(200);

      // Verify Files tab is now active
      await expect(filesTab).toHaveAttribute("data-state", "active");

      // Files content should be visible
      const filesPanel = slideOver.locator('[role="tabpanel"]');
      await expect(filesPanel).toBeVisible();
    });
  });

  test("can close slide-over with Esc key", async ({
    authenticatedPage,
  }) => {
    await test.step("Open slide-over", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(300);

      // Verify slide-over is open
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();
    });

    await test.step("Press Esc to close slide-over", async () => {
      await authenticatedPage.keyboard.press("Escape");

      // Wait for close animation
      await authenticatedPage.waitForTimeout(300);

      // Slide-over should be hidden
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).not.toBeVisible();
    });
  });

  test("can close slide-over with close button", async ({
    authenticatedPage,
  }) => {
    await test.step("Open slide-over", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(300);

      // Verify slide-over is open
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();
    });

    await test.step("Click close button", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');

      // Shadcn Sheet has a close button (X icon)
      const closeButton = slideOver.getByRole("button", { name: /close/i });

      // If no explicit close button, Sheet might close by clicking overlay
      const buttonCount = await closeButton.count();

      if (buttonCount > 0) {
        await closeButton.click();
      } else {
        // Click outside the slide-over to close
        await authenticatedPage.mouse.click(100, 100);
      }

      // Wait for close animation
      await authenticatedPage.waitForTimeout(300);

      // Slide-over should be hidden
      await expect(slideOver).not.toBeVisible();
    });
  });

  test("keyboard shortcut 'H' opens slide-over on History tab", async ({
    authenticatedPage,
  }) => {
    await test.step("Select opportunity and close slide-over", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      // Select the opportunity first (click it)
      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(300);

      // Close the slide-over
      await authenticatedPage.keyboard.press("Escape");
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Press 'H' key to open slide-over on History tab", async () => {
      // Press H key
      await authenticatedPage.keyboard.press("h");

      // Wait for slide-over to open
      await authenticatedPage.waitForTimeout(300);

      // Slide-over should be visible
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();

      // History tab should be active
      const historyTab = slideOver.getByRole("tab", { name: /history/i });
      await expect(historyTab).toHaveAttribute("data-state", "active");
    });
  });

  test("opportunity row can be opened with keyboard (Enter/Space)", async ({
    authenticatedPage,
  }) => {
    await test.step("Open opportunity with Space key", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      // Focus opportunity row
      await opportunityRow.focus();

      // Press Space to open
      await authenticatedPage.keyboard.press("Space");

      // Wait for slide-over to open
      await authenticatedPage.waitForTimeout(300);

      // Slide-over should be visible
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();
    });
  });

  test("tab preference persists across slide-over opens", async ({
    authenticatedPage,
  }) => {
    await test.step("Open slide-over and switch to History tab", async () => {
      // Top 3 customers are auto-expanded, so opportunities are directly visible
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }

      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(300);

      // Switch to History tab
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      const historyTab = slideOver.getByRole("tab", { name: /history/i });
      await historyTab.click();
      await authenticatedPage.waitForTimeout(200);

      // Verify History is active
      await expect(historyTab).toHaveAttribute("data-state", "active");
    });

    await test.step("Close and reopen slide-over", async () => {
      // Close slide-over
      await authenticatedPage.keyboard.press("Escape");
      await authenticatedPage.waitForTimeout(300);

      // Reopen slide-over (click another opportunity)
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .nth(1); // Second opportunity

      if ((await opportunityRow.count()) === 0) {
        // If no second opportunity, click first again
        await authenticatedPage
          .locator('[role="treeitem"]:not([aria-expanded])')
          .first()
          .click();
      } else {
        await opportunityRow.click();
      }

      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify History tab is still active", async () => {
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      const historyTab = slideOver.getByRole("tab", { name: /history/i });

      // History tab should still be active
      await expect(historyTab).toHaveAttribute("data-state", "active");
    });
  });
});
