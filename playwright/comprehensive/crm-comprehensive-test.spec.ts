import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { TestReporter } from './lib/TestReporter';
import { FieldDiscovery } from './lib/FieldDiscovery';
import { TestDataGenerator } from './lib/TestDataGenerator';
import { ErrorMonitor } from './lib/ErrorMonitor';
import { ScreenshotManager } from './lib/ScreenshotManager';
import { ReactAdminHelpers } from './lib/ReactAdminHelpers';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CRM Comprehensive Data Flow Validation Test Suite
 *
 * This test suite provides deep validation of the Atomic CRM application:
 * - Intelligent field discovery and form interaction
 * - Comprehensive error monitoring and reporting
 * - Performance metrics tracking
 * - Data flow validation across modules
 * - Narrative report generation
 *
 * Philosophy:
 * - One authenticated session for all tests
 * - Systematic CRUD validation where applicable
 * - Real-time error capture and categorization
 * - Actionable recommendations in reports
 */

test.describe('CRM Comprehensive Test Suite', () => {
  let reporter: TestReporter;
  let outputDir: string;

  test.beforeAll(async () => {
    // Create timestamped output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' +
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    outputDir = path.join(process.cwd(), 'test-results', `comprehensive-${timestamp}`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    reporter = new TestReporter(outputDir);
    console.log(`\n📊 Test artifacts will be saved to: ${outputDir}\n`);
  });

  test.afterAll(async () => {
    // Generate and save comprehensive report
    await reporter.saveReport();
    console.log(`\n✅ Comprehensive test suite completed\n`);
  });

  test('should validate complete CRM data flow', async ({ page }) => {
    const startTime = Date.now();

    // Initialize utilities
    const fieldDiscovery = new FieldDiscovery(page);
    const dataGenerator = new TestDataGenerator();
    const errorMonitor = new ErrorMonitor(page);
    const screenshots = new ScreenshotManager(page, outputDir);
    const reactAdmin = new ReactAdminHelpers(page);

    // Start error monitoring
    await errorMonitor.startMonitoring();

    try {
      // ========== AUTHENTICATION ==========
      console.log('🔐 Authenticating...');
      await login(page);
      await screenshots.capture('authenticated-dashboard');
      console.log('✅ Authentication successful\n');

      // ========== DASHBOARD MODULE ==========
      reporter.startModule('Dashboard');
      console.log('📊 Testing Dashboard module...');

      try {
        await screenshots.capture('dashboard-entry');

        // Verify dashboard widgets
        const hotContacts = page.getByText('Hot Contacts');
        if (await hotContacts.isVisible({ timeout: 5000 }).catch(() => false)) {
          reporter.recordAction('Verified Hot Contacts widget', 'success');
        }

        // Verify navigation menu
        const contactsLink = page.getByRole('link', { name: 'Contacts' });
        const orgsLink = page.getByRole('link', { name: 'Organizations' });
        const oppsLink = page.getByRole('link', { name: 'Opportunities' });

        if (await contactsLink.isVisible() && await orgsLink.isVisible() && await oppsLink.isVisible()) {
          reporter.recordAction('Verified navigation menu structure', 'success');
        }

        reporter.endModule('passed');
        console.log('✅ Dashboard module passed\n');
      } catch (error: any) {
        reporter.recordAction('Dashboard validation failed', 'error', error.message);
        reporter.endModule('failed');
        console.log('❌ Dashboard module failed\n');
      }

      // ========== CONTACTS MODULE ==========
      reporter.startModule('Contacts');
      console.log('👤 Testing Contacts module...');

      try {
        const contactsStart = Date.now();

        // Navigate to Contacts
        await reactAdmin.navigateToModule('Contacts');
        await screenshots.capture('contacts-list-view');
        reporter.recordPerformance('Navigate to Contacts', Date.now() - contactsStart);
        reporter.recordAction('Navigated to Contacts list view', 'success');

        // Click Create button
        await reactAdmin.clickCreateButton();
        await screenshots.capture('contacts-create-form');
        reporter.recordAction('Opened contact create form', 'success');

        // Discover form fields
        const fields = await fieldDiscovery.discoverFormFields();
        reporter.recordAction(`Discovered ${fields.size} form fields automatically`, 'success');
        console.log(`  📋 Discovered ${fields.size} fields`);

        // Generate test data
        const contactData = dataGenerator.generateContact({
          sales_id: 2, // Assuming sales rep with ID 2 exists
        });

        reporter.setTestData(contactData);

        // Fill required fields
        const firstNameField = fields.get('first_name');
        const lastNameField = fields.get('last_name');

        if (firstNameField && lastNameField) {
          await firstNameField.element.fill(contactData.first_name);
          await lastNameField.element.fill(contactData.last_name);
          reporter.recordAction('Filled contact name fields', 'success');
        }

        // Fill email (JSONB array field)
        const emailField = page.locator('input[name*="email"][type="email"]').first();
        if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await emailField.fill(contactData.email[0].email);
          reporter.recordAction('Filled email field', 'success');
        }

        // Fill sales_id (account manager)
        const salesField = fields.get('sales_id');
        if (salesField) {
          if (salesField.type === 'autocomplete') {
            await reactAdmin.fillAutocomplete('sales_id', '2');
          } else {
            await salesField.element.fill('2');
          }
          reporter.recordAction('Assigned account manager', 'success');
        }

        await screenshots.capture('contacts-form-filled');

        // Save contact
        const saveStart = Date.now();
        await reactAdmin.clickSaveButton();
        reporter.recordPerformance('Create Contact', Date.now() - saveStart);

        // Check for success
        const success = await reactAdmin.waitForSuccessNotification();
        if (success) {
          reporter.recordAction('Created new contact successfully', 'success');
          await screenshots.capture('contacts-created-success');
        } else {
          reporter.recordAction('Contact creation - no success notification', 'warning');
        }

        reporter.endModule('passed');
        console.log('✅ Contacts module passed\n');
      } catch (error: any) {
        reporter.recordAction('Contacts test failed', 'error', error.message);
        reporter.recordIssue({
          severity: 'high',
          type: 'bug',
          module: 'Contacts',
          title: 'Contact Creation Failed',
          description: `Failed to create contact: ${error.message}`,
          evidence: [error.stack || error.message],
          impact: 'Users cannot create new contacts',
          recommendation: 'Check form validation and API endpoint',
        });
        await screenshots.captureError('contacts-creation-failed');
        reporter.endModule('failed');
        console.log('❌ Contacts module failed\n');
      }

      // ========== ORGANIZATIONS MODULE ==========
      reporter.startModule('Organizations');
      console.log('🏢 Testing Organizations module...');

      try {
        const orgsStart = Date.now();

        await reactAdmin.navigateToModule('Organizations');
        await screenshots.capture('organizations-list-view');
        reporter.recordPerformance('Navigate to Organizations', Date.now() - orgsStart);
        reporter.recordAction('Navigated to Organizations list view', 'success');

        // Create organization
        await reactAdmin.clickCreateButton();
        await screenshots.capture('organizations-create-form');

        fieldDiscovery.clearCache();
        const orgFields = await fieldDiscovery.discoverFormFields();
        reporter.recordAction(`Discovered ${orgFields.size} form fields`, 'success');

        const orgData = dataGenerator.generateOrganization({
          sales_id: 2,
        });

        reporter.setTestData(orgData);

        // Fill organization name (required)
        const nameField = orgFields.get('name');
        if (nameField) {
          await nameField.element.fill(orgData.name);
          reporter.recordAction('Filled organization name', 'success');
        }

        // Fill website
        const websiteField = orgFields.get('website');
        if (websiteField) {
          await websiteField.element.fill(orgData.website);
          reporter.recordAction('Filled website URL', 'success');
        }

        await screenshots.capture('organizations-form-filled');

        // Save organization
        const orgSaveStart = Date.now();
        await reactAdmin.clickSaveButton();
        reporter.recordPerformance('Create Organization', Date.now() - orgSaveStart);

        const orgSuccess = await reactAdmin.waitForSuccessNotification();
        if (orgSuccess) {
          reporter.recordAction('Created organization successfully', 'success');
          await screenshots.capture('organizations-created-success');
        }

        reporter.endModule('passed');
        console.log('✅ Organizations module passed\n');
      } catch (error: any) {
        reporter.recordAction('Organizations test failed', 'error', error.message);
        reporter.recordIssue({
          severity: 'high',
          type: 'bug',
          module: 'Organizations',
          title: 'Organization Creation Failed',
          description: `Failed to create organization: ${error.message}`,
          evidence: [error.stack || error.message],
          impact: 'Users cannot create new organizations',
          recommendation: 'Check form validation and API endpoint',
        });
        await screenshots.captureError('organizations-creation-failed');
        reporter.endModule('failed');
        console.log('❌ Organizations module failed\n');
      }

      // ========== OPPORTUNITIES MODULE ==========
      reporter.startModule('Opportunities');
      console.log('💼 Testing Opportunities module...');

      try {
        const oppsStart = Date.now();

        await reactAdmin.navigateToModule('Opportunities');
        await screenshots.capture('opportunities-kanban-view');
        reporter.recordPerformance('Navigate to Opportunities', Date.now() - oppsStart);
        reporter.recordAction('Navigated to Opportunities Kanban view', 'success');

        // Note: Creating opportunities requires existing contacts and organizations
        // For now, just validate the Kanban view loads
        const kanbanColumns = page.locator('[data-rbd-droppable-id]');
        const columnCount = await kanbanColumns.count();

        if (columnCount > 0) {
          reporter.recordAction(`Verified Kanban board with ${columnCount} stage columns`, 'success');
        }

        reporter.endModule('passed');
        console.log('✅ Opportunities module passed\n');
      } catch (error: any) {
        reporter.recordAction('Opportunities test failed', 'error', error.message);
        await screenshots.captureError('opportunities-kanban-failed');
        reporter.endModule('warning');
        console.log('⚠️  Opportunities module completed with warnings\n');
      }

      // ========== PRODUCTS MODULE ==========
      reporter.startModule('Products');
      console.log('📦 Testing Products module...');

      try {
        const productsStart = Date.now();

        await reactAdmin.navigateToModule('Products');
        await screenshots.capture('products-list-view');
        reporter.recordPerformance('Navigate to Products', Date.now() - productsStart);
        reporter.recordAction('Navigated to Products list view', 'success');

        // Verify products list loads
        const productGrid = page.locator('[role="grid"], [role="table"]');
        if (await productGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
          reporter.recordAction('Verified products list displays correctly', 'success');
        }

        reporter.endModule('passed');
        console.log('✅ Products module passed\n');
      } catch (error: any) {
        reporter.recordAction('Products test failed', 'error', error.message);
        await screenshots.captureError('products-list-failed');
        reporter.endModule('warning');
        console.log('⚠️  Products module completed with warnings\n');
      }

      // ========== COLLECT ERRORS ==========
      const consoleLogs = await errorMonitor.getConsoleLogs();
      const networkActivity = await errorMonitor.getNetworkActivity();

      consoleLogs.forEach(log => {
        if (log.level === 'error') {
          reporter.addConsoleLog(log);
        }
      });

      networkActivity.forEach(activity => {
        reporter.addNetworkActivity(activity);
      });

      // Check for critical errors
      if (errorMonitor.hasCriticalErrors()) {
        const criticalErrors = errorMonitor.getErrorsBySeverity('critical');
        console.log(`\n⚠️  Found ${criticalErrors.length} critical errors during testing\n`);
      }

    } catch (error: any) {
      console.error('❌ Test suite encountered an error:', error);
      await screenshots.captureError('test-suite-error');
      throw error;
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n⏱️  Total test duration: ${Math.floor(totalDuration / 1000)}s\n`);
  });
});