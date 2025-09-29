# CRM Comprehensive Test Suite

Production-ready Playwright test suite that validates data flow across the Atomic CRM application with intelligent field discovery, comprehensive error monitoring, and narrative report generation.

## Features

- **Intelligent Field Discovery**: Automatically discovers form fields using multiple strategies (semantic selectors, ARIA labels, React Admin patterns)
- **Context-Aware Test Data**: Generates realistic CRM data that passes validation
- **Comprehensive Error Monitoring**: Captures console errors, network failures, and validation issues
- **Performance Tracking**: Records operation timings and identifies bottlenecks
- **Narrative Reporting**: Generates human-readable reports with actionable recommendations
- **Smart Screenshots**: Captures images only at meaningful moments

## Quick Start

```bash
# Run comprehensive test suite
npm run test:e2e:comprehensive

# View the generated report
open test-results/comprehensive-<timestamp>/report.md
```

## What Gets Tested

### Modules
- ✅ **Dashboard**: Navigation and widget display
- ✅ **Contacts**: Full CRUD operations, search, filters, multi-organization support
- ✅ **Organizations**: Full CRUD operations, hierarchy, filters
- ✅ **Opportunities**: Kanban view, CRUD operations, stage transitions
- ✅ **Products**: List view, category filters (read-only validation)

### Operations
- Create, Read, Update operations where applicable
- Form field discovery and validation
- Search and filter functionality
- Data persistence across navigation
- Referential integrity across modules

## Architecture

### Core Components

- **`TestReporter.ts`**: Narrative report generation with issue categorization
- **`FieldDiscovery.ts`**: Intelligent form field discovery engine
- **`TestDataGenerator.ts`**: Context-aware test data generation
- **`ErrorMonitor.ts`**: Comprehensive error capture and categorization
- **`ScreenshotManager.ts`**: Smart screenshot capture with context
- **`ReactAdminHelpers.ts`**: React Admin specific patterns and utilities

### Test Configuration

Located in `config/testConfig.json`:

```json
{
  "modules": {
    "Contacts": {
      "enabled": true,
      "testCRUD": true,
      "testFilters": true,
      "testSearch": true,
      "requiredFields": ["first_name", "last_name", "sales_id"]
    }
  }
}
```

## Generated Artifacts

After running tests, find artifacts in `test-results/comprehensive-<timestamp>/`:

- **`report.md`**: Human-readable narrative report
- **`report.json`**: Machine-readable test data
- **`screenshots/`**: Captured screenshots with descriptive names
- **`console-output.log`**: Console logs from test execution (if errors occurred)

## Report Structure

The generated markdown report includes:

1. **Executive Summary**: Overall status, module statistics, critical findings
2. **Module Test Results**: Detailed actions, data used, issues found, performance metrics
3. **Critical Findings**: Prioritized list of bugs with code examples and recommendations
4. **Performance Summary**: Response times and bottlenecks per module
5. **Recommendations**: Prioritized by severity (P0-P3) with specific fixes
6. **Assessment**: Overall application health and production readiness

## Extending the Test Suite

### Adding a New Module Test

Edit `crm-comprehensive-test.spec.ts`:

```typescript
// Add new module test section
reporter.startModule('NewModule');
console.log('🆕 Testing NewModule...');

try {
  await reactAdmin.navigateToModule('NewModule');
  await screenshots.capture('newmodule-list-view');

  // Your test logic here

  reporter.endModule('passed');
} catch (error) {
  reporter.recordIssue({
    severity: 'high',
    type: 'bug',
    module: 'NewModule',
    title: 'Issue description',
    description: error.message,
    evidence: [error.stack],
    impact: 'Impact on users',
    recommendation: 'How to fix',
  });
  reporter.endModule('failed');
}
```

### Customizing Test Data

Modify `TestDataGenerator.ts` to add custom data generators:

```typescript
generateCustomField(): string {
  // Your custom logic
  return 'custom value';
}
```

### Adding New Performance Thresholds

Update `config/testConfig.json`:

```json
{
  "performance": {
    "thresholds": {
      "excellent": 500,
      "good": 1000,
      "acceptable": 2000,
      "slow": 5000
    }
  }
}
```

## Troubleshooting

### Tests Fail with "Create Button Not Found"

- Ensure dev server is running on http://localhost:5173
- Check that test user has proper permissions
- Verify React Admin components are rendered correctly

### Screenshots Not Captured

- Check `test-results/` directory permissions
- Ensure sufficient disk space
- Verify `ScreenshotManager` is initialized with valid outputDir

### Report Not Generated

- Check for errors in test execution
- Ensure `TestReporter.saveReport()` is called in `afterAll` hook
- Verify output directory is writable

## Best Practices

1. **Run Before Each Release**: Catch regressions early by running comprehensive tests before deploying
2. **Review Reports Carefully**: The report distinguishes between test failures and application bugs
3. **Prioritize Critical Issues**: Focus on P0 issues first - they block production deployment
4. **Update Test Data**: Keep test data generators aligned with validation schemas
5. **Monitor Performance**: Track operation timings over time to catch performance regressions

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/e2e-comprehensive.yml
- name: Run Comprehensive E2E Tests
  run: npm run test:e2e:comprehensive

- name: Upload Test Report
  uses: actions/upload-artifact@v3
  with:
    name: comprehensive-test-report
    path: test-results/comprehensive-*/
```

## Comparison with Minimal Test Suite

| Feature | Minimal Tests | Comprehensive Tests |
|---------|--------------|---------------------|
| Coverage | Critical paths only | All modules + data flow |
| Field Discovery | Hard-coded selectors | Intelligent discovery |
| Error Monitoring | Basic | Comprehensive with categorization |
| Reporting | Playwright HTML | Narrative markdown + JSON |
| Performance Tracking | No | Yes, per operation |
| Recommendations | No | Yes, with code examples |
| Execution Time | ~2 minutes | ~4-6 minutes |

## Philosophy

This test suite follows the Engineering Constitution:

- **NO OVER-ENGINEERING**: Simple, focused tests that provide value
- **SINGLE SOURCE OF TRUTH**: Uses actual application routes and components
- **BOY SCOUT RULE**: Improves test infrastructure while testing
- **FAIL FAST**: Reports issues immediately with full context

## Support

For issues or questions:
1. Check the generated report for specific error details
2. Review console logs in test-results directory
3. Examine screenshots for visual context
4. Refer to this README for troubleshooting steps

---

*Generated for Atomic CRM v0.1.0*