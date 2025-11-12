import { test, expect } from "@playwright/test";

/**
 * Comprehensive E2E Tests for All Dashboard Widgets
 *
 * Tests all 5 widgets with their respective actions:
 * 1. Upcoming Events by Principal - Read-only display
 * 2. Principal Performance Command Center - Navigation & task completion
 * 3. My Tasks This Week - Task management & navigation
 * 4. Recent Activity Feed - Activity navigation
 * 5. Pipeline Summary - Metrics display
 */

test.describe("Dashboard Widgets - Comprehensive E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

    // Perform login
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for dashboard to load - look for any widget
    await page.waitForSelector('text=/MY TASKS|RECENT ACTIVITY|PIPELINE SUMMARY|Upcoming/i', { timeout: 15000 });

    // Additional wait for React hydration
    await page.waitForTimeout(1000);
  });

  test.describe("Widget 1: Upcoming Events by Principal", () => {
    test("displays widget with correct title", async ({ page }) => {
      await expect(page.getByText("Upcoming by Principal")).toBeVisible();
    });

    test("shows events or empty state", async ({ page }) => {
      const widget = page.locator('div:has-text("Upcoming by Principal")').first();
      await expect(widget).toBeVisible();

      // Check for either events or empty state message
      const hasEvents = await page.locator('text=/🟢|🟡|🔴/').count() > 0;
      const hasEmptyState = await page.locator('text="No scheduled events this week"').isVisible().catch(() => false);

      expect(hasEvents || hasEmptyState).toBe(true);
    });
  });

  test.describe("Widget 2: Principal Performance Command Center", () => {
    test("displays principal table with all columns", async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });

      // Verify column headers (actual production columns)
      await expect(page.getByRole('columnheader', { name: /principal/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /pipeline/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /this week/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /reps/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /quick actions/i })).toBeVisible();
    });

    test("navigates to organization detail when clicking principal name", async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Check if there are any rows
      const rows = await page.locator('table tbody tr').count();
      if (rows === 0) {
        console.log("⚠️ No principals in table, skipping navigation test");
        return;
      }

      // Click the first principal name link
      const firstPrincipalLink = page.locator('table tbody tr').first().locator('a[href*="/organizations/"]');

      // Get the href to verify it's correct
      const href = await firstPrincipalLink.getAttribute('href');
      expect(href).toMatch(/\/organizations\/\d+\/show/);

      // Click and verify navigation
      await firstPrincipalLink.click();
      await page.waitForURL(/.*\/organizations\/\d+\/show/, { timeout: 5000 });

      // Verify we're on an organization detail page
      expect(page.url()).toContain('/organizations/');
      expect(page.url()).toContain('/show');
    });

    test("opens quick complete modal when clicking task checkbox", async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Find a row with a task checkbox (Next Action column)
      const checkboxes = page.locator('table tbody tr').locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount === 0) {
        console.log("⚠️ No tasks with checkboxes found, skipping modal test");
        return;
      }

      // Click the first checkbox
      await checkboxes.first().click();

      // Verify modal opens
      await expect(page.locator('div[role="dialog"], [role="alertdialog"]')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Widget 3: My Tasks This Week", () => {
    test("displays widget with correct title and count badge", async ({ page }) => {
      await expect(page.locator('text="MY TASKS THIS WEEK"')).toBeVisible();

      // Check for count badge or empty state
      const hasBadge = await page.locator('div:has-text("MY TASKS THIS WEEK")').locator('[class*="badge"]').isVisible().catch(() => false);
      const hasEmptyState = await page.locator('text="No tasks this week"').isVisible().catch(() => false);

      expect(hasBadge || hasEmptyState).toBe(true);
    });

    test("groups tasks by urgency (OVERDUE, DUE TODAY, THIS WEEK)", async ({ page }) => {
      // Check if any urgency headers are visible
      const hasOverdue = await page.locator('text=/⚠️\s*OVERDUE/i').isVisible().catch(() => false);
      const hasDueToday = await page.locator('text=/📅\s*DUE TODAY/i').isVisible().catch(() => false);
      const hasThisWeek = await page.locator('text=/📆\s*THIS WEEK/i').isVisible().catch(() => false);
      const hasEmptyState = await page.locator('text="No tasks this week"').isVisible().catch(() => false);

      // Should have at least one group or empty state
      expect(hasOverdue || hasDueToday || hasThisWeek || hasEmptyState).toBe(true);
    });

    test("navigates to task detail when clicking task row", async ({ page }) => {
      // Find task rows (within MY TASKS THIS WEEK widget)
      const taskWidget = page.locator('div:has-text("MY TASKS THIS WEEK")').first();
      const taskRows = taskWidget.locator('[role="button"]').locator('text=/[A-Za-z].*[A-Za-z]/').first();

      const hasRows = await taskRows.isVisible().catch(() => false);
      if (!hasRows) {
        console.log("⚠️ No task rows found, skipping navigation test");
        return;
      }

      // Click the task row
      await taskRows.click();

      // Verify navigation to tasks page
      await page.waitForURL(/.*\/tasks\/\d+/, { timeout: 5000 });
      expect(page.url()).toContain('/tasks/');
    });

    test("navigates to tasks list when clicking footer link", async ({ page }) => {
      const footerLink = page.locator('div:has-text("MY TASKS THIS WEEK")').locator('a:has-text("View all tasks")');

      if (!(await footerLink.isVisible())) {
        console.log("⚠️ Footer link not found");
        return;
      }

      await footerLink.click();
      await page.waitForURL(/.*\/tasks\/?$/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/tasks\/?$/);
    });

    test("opens quick complete modal when clicking task checkbox", async ({ page }) => {
      const taskWidget = page.locator('div:has-text("MY TASKS THIS WEEK")').first();
      const checkboxes = taskWidget.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount === 0) {
        console.log("⚠️ No task checkboxes found, skipping modal test");
        return;
      }

      // Click the first checkbox
      await checkboxes.first().click();

      // Verify modal opens
      await expect(page.locator('div[role="dialog"], [role="alertdialog"]')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Widget 4: Recent Activity Feed", () => {
    test("displays widget with correct title and count badge", async ({ page }) => {
      await expect(page.locator('text="RECENT ACTIVITY"')).toBeVisible();

      // Check for count badge or empty state
      const hasBadge = await page.locator('div:has-text("RECENT ACTIVITY")').locator('[class*="badge"]').isVisible().catch(() => false);
      const hasEmptyState = await page.locator('text="No recent activity"').isVisible().catch(() => false);

      expect(hasBadge || hasEmptyState).toBe(true);
    });

    test("displays activities with icons and timestamps", async ({ page }) => {
      const activityWidget = page.locator('div:has-text("RECENT ACTIVITY")').first();

      // Check if activities are visible (they have icon + description + timestamp)
      const hasActivities = await activityWidget.locator('[role="button"]').count() > 0;
      const hasEmptyState = await page.locator('text="No recent activity"').isVisible().catch(() => false);

      expect(hasActivities || hasEmptyState).toBe(true);
    });

    test("navigates to activity detail when clicking activity row", async ({ page }) => {
      const activityWidget = page.locator('div:has-text("RECENT ACTIVITY")').first();
      const activityRows = activityWidget.locator('[role="button"]');
      const rowCount = await activityRows.count();

      if (rowCount === 0) {
        console.log("⚠️ No activity rows found, skipping navigation test");
        return;
      }

      // Click the first activity row
      await activityRows.first().click();

      // Verify navigation to activities page
      await page.waitForURL(/.*\/activities\/\d+/, { timeout: 5000 });
      expect(page.url()).toContain('/activities/');
    });

    test("navigates to activities list when clicking footer link", async ({ page }) => {
      const footerLink = page.locator('div:has-text("RECENT ACTIVITY")').locator('a:has-text("View all activities")');

      if (!(await footerLink.isVisible())) {
        console.log("⚠️ Footer link not found");
        return;
      }

      await footerLink.click();
      await page.waitForURL(/.*\/activities\/?$/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/activities\/?$/);
    });
  });

  test.describe("Widget 5: Pipeline Summary", () => {
    test("displays widget with correct title", async ({ page }) => {
      await expect(page.locator('text="PIPELINE SUMMARY"')).toBeVisible();
    });

    test("displays total opportunities count", async ({ page }) => {
      const widget = page.locator('div:has-text("PIPELINE SUMMARY")').first();

      // Check for "Total Opportunities" label and a count
      await expect(widget.locator('text="Total Opportunities"')).toBeVisible();

      // Verify a number is displayed (could be 0 or more)
      const hasNumber = await widget.locator('span[class*="font-bold"]').isVisible().catch(() => false);
      const hasEmptyState = await widget.locator('text="No active opportunities"').isVisible().catch(() => false);

      expect(hasNumber || hasEmptyState).toBe(true);
    });

    test("displays stage breakdown section", async ({ page }) => {
      const widget = page.locator('div:has-text("PIPELINE SUMMARY")').first();

      // Check for "BY STAGE" section or empty state
      const hasStageSection = await widget.locator('text="BY STAGE"').isVisible().catch(() => false);
      const hasEmptyState = await widget.locator('text="No active opportunities"').isVisible().catch(() => false);

      expect(hasStageSection || hasEmptyState).toBe(true);
    });

    test("displays status breakdown section", async ({ page }) => {
      const widget = page.locator('div:has-text("PIPELINE SUMMARY")').first();

      // Check for "BY STATUS" section or empty state
      const hasStatusSection = await widget.locator('text="BY STATUS"').isVisible().catch(() => false);
      const hasEmptyState = await widget.locator('text="No active opportunities"').isVisible().catch(() => false);

      expect(hasStatusSection || hasEmptyState).toBe(true);
    });

    test("displays pipeline health score", async ({ page }) => {
      const widget = page.locator('div:has-text("PIPELINE SUMMARY")').first();

      // Check for "Pipeline Health" section or empty state
      const hasHealthSection = await widget.locator('text="Pipeline Health"').isVisible().catch(() => false);
      const hasEmptyState = await widget.locator('text="No active opportunities"').isVisible().catch(() => false);

      expect(hasHealthSection || hasEmptyState).toBe(true);

      // If health section exists, verify it has one of the health indicators
      if (hasHealthSection) {
        const hasHealthIndicator = await widget.locator('text=/🟢|🟡|🔴/').isVisible().catch(() => false);
        expect(hasHealthIndicator).toBe(true);
      }
    });
  });

  test.describe("Dashboard Global Features", () => {
    test("displays manual refresh button", async ({ page }) => {
      await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
    });

    test("displays quick log button", async ({ page }) => {
      await expect(page.getByRole('button', { name: /quick log/i })).toBeVisible();
    });

    test("opens quick log modal when clicking quick log button", async ({ page }) => {
      await page.getByRole('button', { name: /quick log/i }).click();

      // Verify modal opens
      await expect(page.locator('div[role="dialog"], [role="alertdialog"]')).toBeVisible({ timeout: 3000 });
    });

    test("refreshes dashboard when clicking refresh button", async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await refreshButton.click();

      // Verify button shows loading state (spin animation)
      await expect(refreshButton).toHaveAttribute('disabled', '');

      // Wait for refresh to complete
      await expect(refreshButton).not.toHaveAttribute('disabled', '', { timeout: 3000 });
    });
  });

  test.describe("Responsive Layout", () => {
    test("displays grid layout on desktop (1440x900)", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Verify all 5 widgets are visible
      await expect(page.locator('text="Upcoming by Principal"')).toBeVisible();
      await expect(page.locator('text="MY TASKS THIS WEEK"')).toBeVisible();
      await expect(page.locator('text="RECENT ACTIVITY"')).toBeVisible();
      await expect(page.locator('text="PIPELINE SUMMARY"')).toBeVisible();

      // Verify principal table is visible
      await expect(page.locator('table')).toBeVisible();
    });

    test("displays stacked layout on iPad Portrait (768x1024)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Verify all widgets are still accessible
      await expect(page.locator('text="Upcoming by Principal"')).toBeVisible();
      await expect(page.locator('text="MY TASKS THIS WEEK"')).toBeVisible();
      await expect(page.locator('text="RECENT ACTIVITY"')).toBeVisible();
      await expect(page.locator('text="PIPELINE SUMMARY"')).toBeVisible();
    });

    test("displays mobile layout (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify widgets are accessible (may need to scroll)
      await expect(page.locator('text="Upcoming by Principal"')).toBeVisible();

      // Scroll to verify other widgets
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect(page.locator('text="MY TASKS THIS WEEK"')).toBeVisible();
    });
  });
});
