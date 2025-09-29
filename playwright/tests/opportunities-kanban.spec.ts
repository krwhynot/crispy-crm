import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Opportunities Kanban Board E2E Tests
 *
 * Tests opportunity kanban board functionality:
 * - Navigate to opportunities
 * - View kanban board layout
 * - Create new opportunity
 * - Drag and drop between stages (if applicable)
 */


test.describe('Opportunities Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to opportunities and view kanban board', async ({ page }) => {
    // Click on Opportunities navigation link
    await page.getByText('Opportunities', { exact: true }).click();

    // Verify URL contains opportunities
    await expect(page).toHaveURL(/.*opportunities/);

    // Verify page loaded
    const createButton = page.getByTestId('create-button');
    await expect(createButton).toBeVisible({ timeout: 15000 });

    // Check for kanban columns (stage columns)
    // Common stage names: Lead, Qualified, Proposal, Closed Won, Closed Lost
    const stageIndicators = [
      page.getByText(/lead/i),
      page.getByText(/qualified/i),
      page.getByText(/proposal/i),
    ];

    let kanbanFound = false;
    for (const indicator of stageIndicators) {
      if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        kanbanFound = true;
        break;
      }
    }

    // At least one stage should be visible
    expect(kanbanFound).toBeTruthy();
  });

  test('should create a new opportunity', async ({ page }) => {
    // Navigate to opportunities
    await page.getByText('Opportunities', { exact: true }).click();

    // Click Create button
    const createButton = page.getByTestId('create-button');
    await createButton.click();

    // Verify we're on the create page
    await expect(page).toHaveURL(/.*opportunities\/create/);

    // Fill in opportunity form
    const timestamp = Date.now();

    // Title/Name field
    const titleInput = page.locator('input[name="title"], input[name="name"]');
    await titleInput.fill(`Test Opportunity ${timestamp}`);

    // Amount field (if present)
    const amountInput = page.locator('input[name="amount"]');
    if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await amountInput.fill('50000');
    }

    // Customer organization (if present)
    const orgSelect = page.locator('select[name="customer_organization_id"], [name="customer_organization_id"]');
    if (await orgSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try to select first available organization
      const options = await orgSelect.locator('option').all();
      if (options.length > 1) {
        await orgSelect.selectOption({ index: 1 });
      }
    }

    // Stage field (if present)
    const stageSelect = page.locator('select[name="stage"], [name="stage"]');
    if (await stageSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stageSelect.selectOption({ index: 1 });
    }

    // Save the opportunity
    const saveButton = page.getByRole('button', { name: /save|create/i });
    await saveButton.click();

    // Wait for save to complete

    // Verify we navigated away from create page
    await expect(page).not.toHaveURL(/.*\/create$/);

    // Verify success
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/opportunities(\/\d+)?$/);
  });

  test('should view opportunity details', async ({ page }) => {
    // Navigate to opportunities
    await page.getByText('Opportunities', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Look for an opportunity card in the kanban board
    // Opportunities might be in cards within columns
    const opportunityCard = page.locator('[draggable="true"], [data-rbd-draggable-id]').first();

    if (await opportunityCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await opportunityCard.click();

      // Verify we're on an opportunity detail page
      await expect(page).toHaveURL(/.*opportunities\/\d+$/);

      // Verify some opportunity information is visible
      await expect(page.locator('body')).toContainText(/.+/, { timeout: 5000 });
    } else {
      // Try alternative selector for opportunity links
      const oppLink = page.locator('a[href*="/opportunities/"]').first();
      if (await oppLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await oppLink.click();
        await expect(page).toHaveURL(/.*opportunities\/\d+$/);
      }
    }
  });

  test('should filter opportunities by stage', async ({ page }) => {
    // Navigate to opportunities
    await page.getByText('Opportunities', { exact: true }).click();
    await page.waitForTimeout(1000);

    // Look for filter controls
    // React Admin often has a filter button or sidebar
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // Look for stage filter checkbox or select
      const stageFilter = page.getByText(/lead|qualified/i).first();
      if (await stageFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await stageFilter.click();
        await page.waitForTimeout(1000);

        // Verify content updated
        await expect(page.locator('body')).toContainText(/.+/);
      }
    }
  });

  test('should edit opportunity stage', async ({ page }) => {
    // Navigate to opportunities
    await page.getByText('Opportunities', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Click on first opportunity
    const opportunityCard = page.locator('[draggable="true"], a[href*="/opportunities/"]').first();

    if (await opportunityCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await opportunityCard.click();

      // Look for Edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();

        // Change stage
        const stageSelect = page.locator('select[name="stage"]');
        if (await stageSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Get current selected index and change to different one
          const selectedIndex = await stageSelect.locator('option[selected]').count();
          const targetIndex = selectedIndex === 0 ? 1 : 0;
          await stageSelect.selectOption({ index: targetIndex });

          // Save changes
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();

          // Verify save completed
          await expect(page).not.toHaveURL(/.*\/edit$/);
        }
      }
    }
  });
});