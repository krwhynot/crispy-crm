import { test, expect } from "../support/fixtures/authenticated";

/**
 * Dashboard V3 - Responsive Layout Tests
 *
 * Tests the 5-breakpoint responsive grid layout:
 * - Desktop (1440px+): 2-column grid with 320px inline tasks panel
 * - Laptop (1280-1439px): 2-column grid with 48px icon rail + drawer
 * - Tablet landscape (1024-1279px): Single column with header tasks button + drawer
 * - Tablet portrait (768-1023px): Single column with header tasks button + drawer
 * - Mobile (<768px): Single column with bottom quick action bar
 */

test.describe("Dashboard V3 - Responsive Layout", () => {
  // Viewport configurations for each breakpoint
  const viewports = {
    desktop: { width: 1440, height: 900 },
    laptop: { width: 1280, height: 800 },
    tabletLandscape: { width: 1024, height: 768 },
    tabletPortrait: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  };

  test.describe("Desktop (1440px+)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize(viewports.desktop);
    });

    test("should show inline tasks panel", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Should have My Tasks section visible inline
      const tasksSection = authenticatedPage.locator('section[aria-label="My Tasks"]');
      await expect(tasksSection).toBeVisible();

      // Tasks section should have fixed width (320px)
      const boundingBox = await tasksSection.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(320, -1); // Allow ~10px tolerance
    });

    test("should NOT show tasks button in header", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Header tasks button should not be visible
      const tasksButton = authenticatedPage.locator('button[aria-label*="Open tasks panel"]');
      await expect(tasksButton).not.toBeVisible();
    });

    test("should show FAB for activity logging", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // FAB should be visible
      const fab = authenticatedPage.locator('button[aria-label="Log Activity"]');
      await expect(fab).toBeVisible();
    });
  });

  test.describe("Laptop (1280-1439px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize(viewports.laptop);
    });

    test("should show icon rail instead of inline panel", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Icon rail should be visible (48px collapsed panel with task icon)
      const iconRail = authenticatedPage.locator('aside[aria-label*="Tasks panel"]');
      await expect(iconRail).toBeVisible();

      // Should have approximately 48px width
      const boundingBox = await iconRail.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(48, -1);
    });

    test("should open drawer when icon rail is clicked", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Click on icon rail
      const expandButton = authenticatedPage.locator('button[aria-label*="Expand tasks"]');
      await expandButton.click();

      // Drawer should open with Tasks content
      const drawer = authenticatedPage.locator('[role="dialog"]');
      await expect(drawer).toBeVisible();

      // Drawer should contain Tasks title
      await expect(drawer.locator("text=Tasks")).toBeVisible();
    });
  });

  test.describe("Tablet Landscape (1024-1279px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize(viewports.tabletLandscape);
    });

    test("should show tasks button in header", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Header should have tasks button
      const tasksButton = authenticatedPage.locator('button[aria-label*="Open tasks panel"]');
      await expect(tasksButton).toBeVisible();

      // Button should have "Tasks" text
      await expect(tasksButton.locator("text=Tasks")).toBeVisible();
    });

    test("should open drawer when header tasks button is clicked", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Click header tasks button
      const tasksButton = authenticatedPage.locator('button[aria-label*="Open tasks panel"]');
      await tasksButton.click();

      // Drawer should open
      const drawer = authenticatedPage.locator('[role="dialog"]');
      await expect(drawer).toBeVisible();
    });

    test("should NOT show icon rail", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Icon rail should not be visible
      const iconRail = authenticatedPage.locator('aside[aria-label*="Tasks panel"]');
      await expect(iconRail).not.toBeVisible();
    });
  });

  test.describe("Tablet Portrait (768-1023px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize(viewports.tabletPortrait);
    });

    test("should show tasks button in header", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Header should have tasks button
      const tasksButton = authenticatedPage.locator('button[aria-label*="Open tasks panel"]');
      await expect(tasksButton).toBeVisible();
    });

    test("should use single column layout", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Pipeline section should span full width (minus padding)
      const pipelineSection = authenticatedPage.locator(
        'section[aria-label="Pipeline by Principal"]'
      );
      const boundingBox = await pipelineSection.boundingBox();

      // Should be nearly full viewport width (allowing for padding)
      expect(boundingBox?.width).toBeGreaterThan(700);
    });
  });

  test.describe("Mobile (<768px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize(viewports.mobile);
    });

    test("should NOT show tasks button in header", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Header tasks button should not be visible on mobile
      const tasksButton = authenticatedPage.locator('button[aria-label*="Open tasks panel"]');
      await expect(tasksButton).not.toBeVisible();
    });

    test("should show mobile quick action bar", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // Mobile quick action bar should be visible
      const quickActionBar = authenticatedPage.locator('[aria-label="Quick actions"]');
      await expect(quickActionBar).toBeVisible();
    });

    test("should NOT show FAB", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.waitForLoadState("networkidle");

      // FAB should be hidden on mobile
      const fab = authenticatedPage.locator('button[aria-label="Log Activity"]');
      await expect(fab).not.toBeVisible();
    });
  });

  test.describe("Layout Consistency", () => {
    test("KPI Summary Row should span full width at all breakpoints", async ({
      authenticatedPage,
    }) => {
      for (const [_name, viewport] of Object.entries(viewports)) {
        await authenticatedPage.setViewportSize(viewport);
        await authenticatedPage.goto("/");
        await authenticatedPage.waitForLoadState("networkidle");

        // KPI section should be present and span full width
        const kpiSection = authenticatedPage.locator(
          'section[aria-label="Key Performance Indicators"]'
        );
        await expect(kpiSection).toBeVisible();

        const boundingBox = await kpiSection.boundingBox();
        // Should be at least 90% of viewport width (accounting for padding)
        expect(boundingBox?.width).toBeGreaterThan(viewport.width * 0.85);
      }
    });

    test("Pipeline table should be present at all breakpoints", async ({ authenticatedPage }) => {
      for (const [_name, viewport] of Object.entries(viewports)) {
        await authenticatedPage.setViewportSize(viewport);
        await authenticatedPage.goto("/");
        await authenticatedPage.waitForLoadState("networkidle");

        // Pipeline section should always be present
        const pipelineSection = authenticatedPage.locator(
          'section[aria-label="Pipeline by Principal"]'
        );
        await expect(pipelineSection).toBeVisible();
      }
    });
  });
});
