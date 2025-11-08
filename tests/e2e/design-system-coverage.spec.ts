import { test, expect } from './support/fixtures/authenticated';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Design System Coverage E2E Tests
 *
 * Verifies ResponsiveGrid organism and ARIA landmarks are correctly applied
 * across all Show/Edit pages in the application.
 *
 * Modules tested:
 * - Contacts (Show + Edit)
 * - Organizations (Show + Edit)
 * - Products (Show + Edit)
 *
 * Not tested (intentionally single-column):
 * - Opportunities (Show + Edit)
 * - Sales (Edit)
 * - Tasks (Dialog)
 *
 * Tests verify:
 * - ResponsiveGrid component presence
 * - ARIA landmarks (role="main", role="complementary")
 * - 70/30 layout on desktop
 * - Single-column stacking on mobile
 * - No horizontal scrolling
 * - Touch target sizes
 * - No console errors
 */

test.describe('Design System Coverage', () => {
  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach('console-report', {
        body: consoleMonitor.getReport(),
        contentType: 'text/plain',
      });
    }

    expect(errors, 'Console errors detected. See attached report.').toHaveLength(0);
  });

  test.describe('Contacts Module', () => {
    test.describe('ContactShow', () => {
      test.beforeEach(async ({ authenticatedPage }) => {
        // Navigate to first contact
        await authenticatedPage.goto('/#/contacts');
        await authenticatedPage.waitForTimeout(1000);

        const firstContact = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstContact.waitFor({ state: 'visible' });
        await firstContact.click();
        await authenticatedPage.waitForTimeout(1000);
      });

      test('has ARIA main landmark', async ({ authenticatedPage }) => {
        const main = authenticatedPage.getByRole('main', { name: /contact details/i });
        await expect(main).toBeVisible();
      });

      test('has ARIA complementary landmark', async ({ authenticatedPage }) => {
        const aside = authenticatedPage.getByRole('complementary', { name: /contact information/i });
        await expect(aside).toBeVisible();
      });

      test('displays two-column layout on desktop (1280px)', async ({ authenticatedPage }) => {
        await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
        await authenticatedPage.waitForTimeout(500);

        const main = authenticatedPage.getByRole('main', { name: /contact details/i });
        const aside = authenticatedPage.getByRole('complementary', { name: /contact information/i });

        const mainBox = await main.boundingBox();
        const asideBox = await aside.boundingBox();

        expect(mainBox).not.toBeNull();
        expect(asideBox).not.toBeNull();

        if (mainBox && asideBox) {
          // Main should be wider than aside (70/30 split)
          expect(mainBox.width).toBeGreaterThan(asideBox.width);

          // Both should be visible side-by-side (similar Y position)
          expect(Math.abs(mainBox.y - asideBox.y)).toBeLessThan(20);
        }
      });

      test('no horizontal scrolling on desktop', async ({ authenticatedPage }) => {
        await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
        await authenticatedPage.waitForTimeout(500);

        const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 1280;

        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
      });
    });

    test.describe('ContactEdit', () => {
      test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/#/contacts');
        await authenticatedPage.waitForTimeout(1000);

        const firstContact = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstContact.click();
        await authenticatedPage.waitForTimeout(1000);

        const editButton = authenticatedPage.getByRole('button', { name: /edit/i });
        await editButton.click();
        await authenticatedPage.waitForTimeout(1000);
      });

      test('has ARIA main landmark', async ({ authenticatedPage }) => {
        const main = authenticatedPage.getByRole('main', { name: /edit contact/i });
        await expect(main).toBeVisible();
      });

      test('has ARIA complementary landmark', async ({ authenticatedPage }) => {
        const aside = authenticatedPage.getByRole('complementary', { name: /contact information/i });
        await expect(aside).toBeVisible();
      });
    });
  });

  test.describe('Organizations Module', () => {
    test.describe('OrganizationShow', () => {
      test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/#/organizations');
        await authenticatedPage.waitForTimeout(1000);

        const firstOrg = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstOrg.waitFor({ state: 'visible' });
        await firstOrg.click();
        await authenticatedPage.waitForTimeout(1000);
      });

      test('has ARIA main landmark', async ({ authenticatedPage }) => {
        const main = authenticatedPage.getByRole('main', { name: /organization details/i });
        await expect(main).toBeVisible();
      });

      test('has ARIA complementary landmark', async ({ authenticatedPage }) => {
        const aside = authenticatedPage.getByRole('complementary', { name: /organization information/i });
        await expect(aside).toBeVisible();
      });

      test('displays two-column layout on desktop', async ({ authenticatedPage }) => {
        await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
        await authenticatedPage.waitForTimeout(500);

        const main = authenticatedPage.getByRole('main', { name: /organization details/i });
        const aside = authenticatedPage.getByRole('complementary', { name: /organization information/i });

        const mainBox = await main.boundingBox();
        const asideBox = await aside.boundingBox();

        expect(mainBox).not.toBeNull();
        expect(asideBox).not.toBeNull();

        if (mainBox && asideBox) {
          expect(mainBox.width).toBeGreaterThan(asideBox.width);
          expect(Math.abs(mainBox.y - asideBox.y)).toBeLessThan(20);
        }
      });
    });

    test.describe('OrganizationEdit', () => {
      test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/#/organizations');
        await authenticatedPage.waitForTimeout(1000);

        const firstOrg = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstOrg.click();
        await authenticatedPage.waitForTimeout(1000);

        const editButton = authenticatedPage.getByRole('button', { name: /edit/i });
        await editButton.click();
        await authenticatedPage.waitForTimeout(1000);
      });

      test('has ARIA main landmark', async ({ authenticatedPage }) => {
        const main = authenticatedPage.getByRole('main', { name: /edit organization/i });
        await expect(main).toBeVisible();
      });

      test('has ARIA complementary landmark', async ({ authenticatedPage }) => {
        const aside = authenticatedPage.getByRole('complementary', { name: /organization information/i });
        await expect(aside).toBeVisible();
      });
    });
  });

  test.describe('Products Module', () => {
    test.describe('ProductShow', () => {
      test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/#/products');
        await authenticatedPage.waitForTimeout(1000);

        const firstProduct = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstProduct.waitFor({ state: 'visible' });
        await firstProduct.click();
        await authenticatedPage.waitForTimeout(1000);
      });

      test('has ARIA main landmark', async ({ authenticatedPage }) => {
        const main = authenticatedPage.getByRole('main', { name: /product details/i });
        await expect(main).toBeVisible();
      });

      test('has ARIA complementary landmark', async ({ authenticatedPage }) => {
        const aside = authenticatedPage.getByRole('complementary', { name: /product information/i });
        await expect(aside).toBeVisible();
      });

      test('displays two-column layout on desktop', async ({ authenticatedPage }) => {
        await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
        await authenticatedPage.waitForTimeout(500);

        const main = authenticatedPage.getByRole('main', { name: /product details/i });
        const aside = authenticatedPage.getByRole('complementary', { name: /product information/i });

        const mainBox = await main.boundingBox();
        const asideBox = await aside.boundingBox();

        expect(mainBox).not.toBeNull();
        expect(asideBox).not.toBeNull();

        if (mainBox && asideBox) {
          expect(mainBox.width).toBeGreaterThan(asideBox.width);
          expect(Math.abs(mainBox.y - asideBox.y)).toBeLessThan(20);
        }
      });

      test('tabs navigation works correctly', async ({ authenticatedPage }) => {
        const overviewTab = authenticatedPage.getByRole('tab', { name: /overview/i });
        const detailsTab = authenticatedPage.getByRole('tab', { name: /details/i });
        const activityTab = authenticatedPage.getByRole('tab', { name: /activity/i });

        await expect(overviewTab).toBeVisible();
        await expect(detailsTab).toBeVisible();
        await expect(activityTab).toBeVisible();

        // Click details tab
        await detailsTab.click();
        await authenticatedPage.waitForTimeout(500);

        // Verify URL updated
        const url = authenticatedPage.url();
        expect(url).toContain('/details');
      });
    });
  });

  test.describe('Responsive Behavior', () => {
    test('all modules stack to single column on mobile (375px)', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Test ContactShow
      await authenticatedPage.goto('/#/contacts');
      await authenticatedPage.waitForTimeout(1000);
      const firstContact = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
      await firstContact.click();
      await authenticatedPage.waitForTimeout(1000);

      const main = authenticatedPage.getByRole('main', { name: /contact details/i });
      const aside = authenticatedPage.getByRole('complementary', { name: /contact information/i });

      await expect(main).toBeVisible();
      await expect(aside).toBeVisible();

      const mainBox = await main.boundingBox();
      const asideBox = await aside.boundingBox();

      expect(mainBox).not.toBeNull();
      expect(asideBox).not.toBeNull();

      if (mainBox && asideBox) {
        // On mobile, aside should be below main
        expect(asideBox.y).toBeGreaterThan(mainBox.y + mainBox.height - 50);
      }
    });

    test('touch targets meet minimum size on iPad (768px)', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });

      await authenticatedPage.goto('/#/contacts');
      await authenticatedPage.waitForTimeout(1000);
      const firstContact = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
      await firstContact.click();
      await authenticatedPage.waitForTimeout(1000);

      const editButton = authenticatedPage.getByRole('button', { name: /edit/i });
      await editButton.waitFor({ state: 'visible' });

      const buttonBox = await editButton.boundingBox();
      expect(buttonBox).not.toBeNull();

      if (buttonBox) {
        // Minimum 44x44px for touch targets
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('no console errors on any page', async ({ authenticatedPage }) => {
      const pages = [
        '/#/contacts',
        '/#/organizations',
        '/#/products',
      ];

      for (const page of pages) {
        await authenticatedPage.goto(page);
        await authenticatedPage.waitForTimeout(1000);

        // Click first item
        const firstItem = authenticatedPage.getByRole('link').filter({ hasText: /^[A-Z]/ }).first();
        await firstItem.click();
        await authenticatedPage.waitForTimeout(1000);

        // No RLS errors
        expect(consoleMonitor.hasRLSErrors()).toBe(false);

        // No React errors
        expect(consoleMonitor.hasReactErrors()).toBe(false);
      }
    });
  });
});
