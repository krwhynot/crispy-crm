import { test, expect } from '@playwright/test';

/**
 * Investigation test for Phase 1 Sysco parent organization issue
 *
 * This test checks:
 * 1. Whether "Sysco Corporation" parent exists in cloud database
 * 2. Whether Sysco branch organizations have parent_organization_id set
 * 3. Reports detailed findings to console
 */

test.describe('Sysco Parent Organization Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to complete
    await page.waitForURL(/dashboard|organizations/);
  });

  test('investigate Sysco Corporation parent organization', async ({ page }) => {
    // Navigate to Organizations
    await page.getByRole('link', { name: 'Organizations' }).click();
    await page.waitForLoadState('networkidle');

    console.log('\n========================================');
    console.log('SYSCO PARENT INVESTIGATION');
    console.log('========================================\n');

    // Step 1: Search for "Sysco Corporation" parent
    console.log('Step 1: Searching for "Sysco Corporation" parent...');

    const searchBox = page.getByPlaceholder(/search/i).first();
    await searchBox.clear();
    await searchBox.fill('Sysco Corporation');
    await page.waitForTimeout(1000); // Wait for search to filter

    // Check if parent organization exists
    const parentExists = await page.getByText('Sysco Corporation', { exact: true }).isVisible().catch(() => false);

    if (parentExists) {
      console.log('✅ FOUND: Sysco Corporation parent exists');

      // Click on it to view details
      await page.getByText('Sysco Corporation', { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // Get organization ID from URL
      const url = page.url();
      const parentId = url.match(/organizations\/(\d+)/)?.[1];
      console.log(`   Parent ID: ${parentId}`);

      // Check if it has branches
      const branchesSection = await page.getByText(/branch locations/i).isVisible().catch(() => false);
      if (branchesSection) {
        console.log('   Has "Branch Locations" section');

        // Try to count branches
        const branchRows = page.locator('table tr').filter({ hasText: /sysco/i });
        const branchCount = await branchRows.count();
        console.log(`   Branch count: ${branchCount}`);
      } else {
        console.log('   ⚠️ No "Branch Locations" section found');
      }

      await page.goBack();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('❌ NOT FOUND: Sysco Corporation parent does not exist in database');
    }

    // Step 2: Check individual Sysco branches
    console.log('\nStep 2: Checking Sysco branch organizations...');

    await searchBox.clear();
    await searchBox.fill('sysco');
    await page.waitForTimeout(1000);

    // Get all visible organization rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`   Found ${rowCount} Sysco organizations`);

    // Check each row for parent relationship
    const syscoOrgs: Array<{ name: string; parent: string; branches: string }> = [];

    for (let i = 0; i < Math.min(rowCount, 15); i++) {
      const row = rows.nth(i);
      const name = await row.locator('td').nth(1).textContent() || '';
      const parent = await row.locator('td').filter({ hasText: /parent/i }).first().textContent() || '-';
      const branches = await row.locator('td').filter({ hasText: /branches/i }).first().textContent() || '-';

      if (name.toLowerCase().includes('sysco')) {
        syscoOrgs.push({ name: name.trim(), parent: parent.trim(), branches: branches.trim() });
      }
    }

    console.log('\n   Sysco Organizations:');
    console.log('   ' + '='.repeat(80));
    console.log('   Name'.padEnd(40) + 'Parent'.padEnd(20) + 'Branches');
    console.log('   ' + '-'.repeat(80));

    for (const org of syscoOrgs) {
      console.log('   ' + org.name.padEnd(40) + org.parent.padEnd(20) + org.branches);
    }

    // Step 3: Analysis
    console.log('\n========================================');
    console.log('ANALYSIS');
    console.log('========================================');

    const orgsWithParent = syscoOrgs.filter(o => o.parent !== '-' && o.parent !== '');
    const orgsWithBranches = syscoOrgs.filter(o => o.branches !== '-' && o.branches !== '0');

    console.log(`Total Sysco organizations: ${syscoOrgs.length}`);
    console.log(`Organizations with parent set: ${orgsWithParent.length}`);
    console.log(`Organizations with branches: ${orgsWithBranches.length}`);

    if (!parentExists) {
      console.log('\n❌ ROOT CAUSE: Sysco Corporation parent was NOT created');
      console.log('   Migration 20251117112343 likely failed or was not applied to cloud');
      console.log('\n📋 RECOMMENDED FIX:');
      console.log('   1. Create new migration to establish Sysco parent');
      console.log('   2. Link all Sysco branches to parent');
    } else if (orgsWithParent.length === 0) {
      console.log('\n⚠️ ISSUE: Parent exists but branches are not linked');
      console.log('   The UPDATE statement in migration failed to link branches');
      console.log('\n📋 RECOMMENDED FIX:');
      console.log('   Create migration to UPDATE organizations SET parent_organization_id');
    } else {
      console.log('\n✅ Parent organization structure appears correct');
    }

    console.log('========================================\n');

    // Assertion to make test fail if parent doesn't exist (for visibility)
    expect(parentExists, 'Sysco Corporation parent should exist').toBe(true);
  });

  test('check Phase 1 migration application status', async ({ page }) => {
    console.log('\n========================================');
    console.log('CHECKING OTHER PHASE 1 PARENTS');
    console.log('========================================\n');

    await page.getByRole('link', { name: 'Organizations' }).click();
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByPlaceholder(/search/i).first();

    // Check for other Phase 1 parents
    const expectedParents = [
      'US Foods Corporate',
      'Sysco Corporation',
      'Gordon Food Service',
      'Performance Food Group',
      'PFS Corporate',
      'Trinity Health System'
    ];

    console.log('Expected Phase 1 parent organizations:\n');

    for (const parentName of expectedParents) {
      await searchBox.clear();
      await searchBox.fill(parentName);
      await page.waitForTimeout(800);

      const exists = await page.getByText(parentName, { exact: true }).isVisible().catch(() => false);
      const status = exists ? '✅ EXISTS' : '❌ MISSING';
      console.log(`   ${status}: ${parentName}`);
    }

    console.log('\n========================================\n');
  });
});
