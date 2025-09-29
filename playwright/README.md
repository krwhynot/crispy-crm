# Playwright E2E Testing

## Overview

Minimal E2E testing infrastructure following the project's **NO OVER-ENGINEERING** principle. Tests critical user journeys only.

## Quick Start

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# View last test report
npm run test:e2e:report
```

## Test Suite

### 1. Authentication (`auth.spec.ts`)
- Login with valid credentials
- Logout functionality
- Invalid credential rejection

### 2. Contacts CRUD (`contacts-crud.spec.ts`)
- Navigate to contacts list
- Create new contact
- View contact details
- Edit contact information

### 3. Organizations CRUD (`organizations-crud.spec.ts`)
- Navigate to organizations list
- Create new organization
- View organization details
- Edit organization information
- Filter by organization type

### 4. Opportunities Kanban (`opportunities-kanban.spec.ts`)
- View kanban board layout
- Create new opportunity
- View opportunity details
- Filter by stage
- Edit opportunity stage

### 5. Cross-Module Integration (`cross-module.spec.ts`)
- Link contact to organization
- Link opportunity to contact/organization
- Navigate between related entities
- Verify relationship persistence

## Test Credentials

```typescript
Email: test@gmail.com
Password: password
```

## Configuration

All configuration in `playwright.config.ts`:

- **Headless only**: No headed mode allowed
- **Browser**: Chromium only
- **Timeouts**: 60s test, 15s action, 30s navigation
- **Retry**: 1 retry in CI, 0 locally
- **Parallelization**: Enabled
- **Artifacts**: Screenshots/videos on failure only

## Writing Tests

### Best Practices

✅ **Use robust selectors**
```typescript
// Good: data-testid
await page.getByTestId('create-button').click();

// Good: semantic role
await page.getByRole('button', { name: /save/i }).click();

// Bad: fragile CSS
await page.locator('.css-class-abc123').click();
```

✅ **Wait for async operations**
```typescript
// Good: wait for network
await page.waitForLoadState('networkidle');

// Good: wait for element
await element.waitFor({ state: 'visible' });

// Bad: arbitrary timeout
await page.waitForTimeout(5000);
```

✅ **Handle React Admin patterns**
- Always wait for `networkidle` after navigation
- Forms have async validation - wait before interacting
- List views load data asynchronously
- CreateButton always has `data-testid="create-button"`

### Adding New Tests

1. Create test file in `playwright/tests/`
2. Follow existing naming pattern: `feature-name.spec.ts`
3. Use helper login function for authenticated tests
4. Add robust selectors (prefer `data-testid`)
5. Include proper wait strategies
6. Test should complete in < 60 seconds

### Adding data-testid to Components

```tsx
// In component files
<button data-testid="submit-form">Submit</button>
<input data-testid="email-input" type="email" />
<div data-testid="list-container">{children}</div>
```

## CI/CD Integration

Tests run automatically in CI:
- On pull requests
- Headless mode only
- Fails fast on first failure
- Screenshots/videos saved on failure
- HTML report generated

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts` (max 60s)
- Verify network requests complete with `networkidle`
- Check for JavaScript errors in browser console

### Element not found
- Add explicit wait: `await element.waitFor()`
- Use more robust selector (prefer `data-testid`)
- Verify React Admin finished rendering

### Flaky tests
- Avoid arbitrary `waitForTimeout()`
- Use `waitForLoadState('networkidle')`
- Add retry logic for unstable operations

## Performance

Target execution time: **~2 minutes** for full suite

Current test count: **5 spec files, ~20 total tests**

Keep suite fast by:
- Testing critical paths only
- Avoiding exhaustive coverage
- Parallel execution
- Efficient selectors

## Architecture Alignment

This testing infrastructure follows the Engineering Constitution:

1. ✅ **NO OVER-ENGINEERING**: Minimal setup, 5 critical tests only
2. ✅ **SINGLE SOURCE OF TRUTH**: Tests use real Supabase (no mocks)
3. ✅ **FAIL FAST**: Quick feedback on failures

---

For more details, see main documentation in `/CLAUDE.md`