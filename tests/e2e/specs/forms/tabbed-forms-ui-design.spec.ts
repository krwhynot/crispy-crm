import { test, expect } from "@playwright/test";

/**
 * E2E tests for ultra-compact tabbed forms UI design
 * Verifies tab layout and styling matches design system requirements
 */

test.describe("Tabbed Forms UI Design - Layout Only", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test.describe("Tab Layout Validation", () => {
    test("Organizations form - should have ultra-compact tab styling", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Verify TabsList is compact width (inline-flex, not full width)
      const tabsListBox = await tabsList.boundingBox();
      const formBox = await page.locator("form").first().boundingBox();

      if (tabsListBox && formBox) {
        expect(tabsListBox.width).toBeLessThan(formBox.width * 0.5); // Tabs should be < 50% of form width
      }

      // Verify tabs exist
      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(3); // General, Details, Other

      // Verify tab height is ultra-compact (28px or less)
      const firstTab = tabs.first();
      const tabBox = await firstTab.boundingBox();
      expect(tabBox?.height).toBeLessThanOrEqual(35); // h-7 = 28px + small buffer

      // Verify active tab is visible
      const activeTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toBeVisible();
    });

    test("Contacts form - should have 4 compact tabs", async ({ page }) => {
      await page.goto("/#/contacts/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(4); // Identity, Position, Contact Info, Account

      // Verify compact height for all tabs
      for (let i = 0; i < 4; i++) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();
        expect(box?.height).toBeLessThanOrEqual(35);
      }
    });

    test("Opportunities form - should have 4 compact tabs", async ({ page }) => {
      await page.goto("/#/opportunities/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(4); // General, Classification, Relationships, Details
    });

    test("Products form - should have 3 compact tabs", async ({ page }) => {
      await page.goto("/#/products/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(3); // General, Relationships, Classification
    });

    test("Tasks form - should have 2 compact tabs", async ({ page }) => {
      await page.goto("/#/tasks/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(2); // General, Details
    });

    test("Sales form - should have 2 compact tabs", async ({ page }) => {
      await page.goto("/#/sales/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(2); // General, Permissions
    });
  });

  test.describe("Tab Visual Styling", () => {
    test("should have gray background on TabsList", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const tabsList = page.locator('[role="tablist"]');

      // Verify TabsList has a background color (not transparent)
      const bgColor = await tabsList.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });

      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(bgColor).not.toBe("transparent");
    });

    test("should have white/background color on active tab", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const activeTab = page.locator('[role="tab"][aria-selected="true"]');

      // Verify active tab has background color
      const bgColor = await activeTab.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });

      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(bgColor).not.toBe("transparent");
    });

    test("should have compact padding on tab panel", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const tabPanel = page.locator('[role="tabpanel"]');

      // Verify panel has compact padding (p-3 = 12px)
      const padding = await tabPanel.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingTop);
      });

      expect(padding).toBeLessThanOrEqual(16); // 12px with small buffer
    });

    test("should have rounded top corners on TabsList", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const tabsList = page.locator('[role="tablist"]');

      // Verify rounded corners
      const borderRadius = await tabsList.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.borderTopLeftRadius;
      });

      expect(borderRadius).not.toBe("0px");
    });
  });

  test.describe("Tab Switching", () => {
    test("should switch between tabs correctly", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      // Verify General tab is active by default
      const generalTab = page.locator('[role="tab"]', { hasText: "General" });
      await expect(generalTab).toHaveAttribute("aria-selected", "true");

      // Click Details tab
      const detailsTab = page.locator('[role="tab"]', { hasText: "Details" });
      await detailsTab.click();

      // Verify Details is now active
      await expect(detailsTab).toHaveAttribute("aria-selected", "true");
      await expect(generalTab).toHaveAttribute("aria-selected", "false");

      // Verify Details panel is visible
      const detailsPanel = page
        .locator('[role="tabpanel"]')
        .filter({ hasText: /segment|status|website/i });
      await expect(detailsPanel).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA attributes", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      // Verify tablist role
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Verify tabs have aria-selected
      const tabs = page.locator('[role="tab"]');
      for (let i = 0; i < 3; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute("aria-selected", /true|false/);
      }

      // Verify tabpanel role
      const tabPanel = page.locator('[role="tabpanel"]');
      await expect(tabPanel).toBeVisible();
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      // Focus first tab
      const firstTab = page.locator('[role="tab"]').first();
      await firstTab.focus();

      // Press Arrow Right
      await page.keyboard.press("ArrowRight");

      // Second tab should be focused
      const secondTab = page.locator('[role="tab"]').nth(1);
      await expect(secondTab).toBeFocused();
    });
  });

  test.describe("Responsive Behavior", () => {
    test("should maintain compact styling on iPad viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/#/organizations/create");
      await page.waitForLoadState("networkidle");

      const tabs = page.locator('[role="tab"]');
      const firstTab = tabs.first();
      const tabBox = await firstTab.boundingBox();

      // Should still be compact on iPad
      expect(tabBox?.height).toBeLessThanOrEqual(35);
    });
  });
});
