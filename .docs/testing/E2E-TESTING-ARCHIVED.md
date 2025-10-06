# Testing Documentation

## Overview

Atomic CRM uses a comprehensive 3-layer testing strategy to ensure code quality and reliability. Our testing approach covers unit tests, integration tests, and end-to-end tests, with a baseline coverage requirement of **70%**.

## 3-Layer Testing Strategy

### Layer 1: Unit Tests (Component Level)
- **Focus**: Individual components, utilities, and functions in isolation
- **Location**: `src/**/*.test.ts` and `src/**/*.test.tsx`
- **Framework**: Vitest + React Testing Library
- **Coverage Target**: 80% of components

Unit tests verify that individual components render correctly, handle props, and respond to user interactions as expected. These tests are fast and run in jsdom environment.

### Layer 2: Integration Tests (Feature Level)
- **Focus**: Multi-component workflows and data provider interactions
- **Location**: `src/tests/integration/**/*.test.ts`
- **Framework**: Vitest + Testing Library + Mocked Supabase
- **Coverage Target**: 70% of critical workflows

Integration tests verify that components work together correctly, including form submissions, data fetching, and state management across React Admin resources.

### Layer 3: End-to-End Tests (Application Level)
- **Focus**: Complete user journeys through the application
- **Location**: `tests/e2e/**/*.spec.ts`
- **Framework**: Playwright
- **Coverage Target**: Critical user paths (auth, CRUD operations, filters)

E2E tests run against a real browser and test database, verifying the complete stack from UI to database persistence.

## Running Tests

### Quick Start
```bash
# Run all tests in watch mode (development)
npm test

# Run tests once (CI mode)
npm run test:ci

# Run with coverage report
npm run test:coverage
```

### Test Commands

#### Unit and Integration Tests
```bash
# Watch mode (re-runs on file changes)
npm test

# Run once with verbose output
npm run test:ci

# Run with coverage report
npm run test:coverage

# Launch Vitest UI for visual test exploration
npm run test:ui

# Run only unit tests
npm run test:unit

# Run specific test file
npm test -- src/atomic-crm/opportunities/OpportunityCreate.test.tsx
```

#### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Launch Playwright UI mode
npm run test:e2e:ui

# Debug E2E tests with browser
npm run test:e2e:debug

# Run specific E2E test
npm run test:e2e -- tests/e2e/opportunities.spec.ts
```

#### Performance Tests
```bash
# Run performance benchmarks
npm run test:performance

# Run load tests
npm run test:load
```

## Test Environment Setup

### Prerequisites
1. **Environment Variables**: Copy `.env.example` to `.env.test`
   ```bash
   cp .env.example .env.test
   ```

2. **Test Database**: Tests use the cloud Supabase instance with test data isolation
   - Test data is namespaced with prefix: `test_env_timestamp_random`
   - Automatic cleanup after test runs

3. **Dependencies**: Install test dependencies
   ```bash
   npm install
   ```

## Interpreting Test Failures

### Common Failure Types

#### 1. Assertion Failures
```
Expected: "Opportunity Created"
Received: "Error: Validation failed"
```
**Action**: Check test data matches validation requirements (e.g., required fields, value ranges)

#### 2. Component Not Found
```
TestingLibraryElementError: Unable to find an element with the role "button" and name /save/i
```
**Action**: Verify component renders expected elements. Check for conditional rendering or async loading states.

#### 3. Timeout Errors
```
Timeout: Test exceeded 10000ms
```
**Action**:
- Add explicit waits for async operations: `await waitFor(() => ...)`
- Check if data provider mocks are resolving
- Increase timeout for slow operations: `{ timeout: 20000 }`

#### 4. Database/RLS Errors
```
Error: new row violates row-level security policy
```
**Action**: Ensure test uses authenticated client or service role client for data setup

#### 5. Validation Errors
```
ZodError: Invalid input at "products": Required
```
**Action**: Check Zod schemas in `src/atomic-crm/validation/`. Ensure test data includes all required fields.

### Reading Test Output

#### Vitest Output
```
✓ src/atomic-crm/opportunities/OpportunityCreate.test.tsx (5 tests) 245ms
  ✓ OpportunityCreate
    ✓ renders create form with all required fields 45ms
    ✓ validates required fields before submission 89ms
    ✓ transforms products field to products_to_sync 34ms
    ✓ handles API errors gracefully 67ms
    ✓ redirects to list after successful creation 10ms
```

- **✓**: Test passed
- **✗**: Test failed
- **⊘**: Test skipped
- **Time**: Execution time (watch for slow tests >1000ms)

#### Coverage Report
```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
OpportunityCreate.tsx   |   85.2  |   78.4   |   90.0  |   84.8  |
OpportunityInputs.tsx   |   92.1  |   88.6   |   95.2  |   91.7  |
------------------------|---------|----------|---------|---------|
All files              |   72.4  |   68.9   |   74.2  |   71.8  |
```

**Baseline Requirement**: 70% coverage across all metrics

### Debug Strategies

1. **Run Single Test**: Focus on failing test
   ```bash
   npm test -- OpportunityCreate.test.tsx -t "validates required fields"
   ```

2. **Enable Debug Output**: See what Testing Library finds
   ```javascript
   screen.debug(); // Shows current DOM
   screen.logTestingPlaygroundURL(); // Opens interactive debugger
   ```

3. **Check Test Isolation**: Ensure tests don't pollute each other
   ```javascript
   afterEach(async () => {
     await cleanup();
     vi.clearAllMocks();
   });
   ```

4. **Mock Verification**: Ensure mocks are called correctly
   ```javascript
   expect(dataProvider.create).toHaveBeenCalledWith('opportunities', {
     data: expect.objectContaining({
       name: 'Test Opportunity'
     })
   });
   ```

## Coverage Requirements

### Baseline Coverage: 70%

All code changes must maintain or improve the baseline coverage of **70%** across:
- **Statements**: 70% minimum
- **Branches**: 70% minimum
- **Functions**: 70% minimum
- **Lines**: 70% minimum

### Priority Coverage Areas

1. **Critical Paths** (90% target):
   - Authentication flows
   - Data provider operations
   - Validation logic
   - Error handling

2. **UI Components** (80% target):
   - Form components
   - List views with filters
   - Custom inputs

3. **Utilities** (85% target):
   - Data transformations
   - Validation helpers
   - Format functions

### Viewing Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### Coverage Enforcement

The CI pipeline enforces coverage thresholds:

```javascript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

Tests will fail in CI if coverage drops below 70%.

## Continuous Integration

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests
- Commits to main branch
- Daily scheduled runs (flaky test detection)

### CI Test Pipeline

1. **Lint & Format** (`npm run lint`)
2. **Type Check** (`tsc --noEmit`)
3. **Unit/Integration Tests** (`npm run test:ci`)
4. **Coverage Check** (minimum 70%)
5. **E2E Tests** (`npm run test:e2e`)
6. **Build Verification** (`npm run build`)

### Monitoring Test Health

- **Test Duration**: Tests taking >10s are flagged for optimization
- **Flaky Tests**: Tests failing >2 times/week are quarantined (see [FLAKY_TEST_POLICY.md](./FLAKY_TEST_POLICY.md))
- **Coverage Trends**: Coverage must not decrease between PRs

## Best Practices

### Test Organization
- Colocate tests with components: `OpportunityCreate.tsx` → `OpportunityCreate.test.tsx`
- Use descriptive test names that explain the behavior being tested
- Group related tests with `describe` blocks

### Test Data
- Use test factories with faker.js for realistic data
- Namespace test data to prevent conflicts
- Clean up after tests with `safeCleanup()` helper

### Selectors
- **Preferred**: `getByRole()`, `getByLabelText()`
- **Acceptable**: `data-testid` for complex cases
- **Avoid**: Text selectors, CSS selectors

### Async Testing
- Always await async operations
- Use `waitFor()` for elements that appear after async operations
- Set appropriate timeouts for slow operations

## Related Documentation

- [Writing Tests Guide](./WRITING_TESTS.md) - Detailed patterns and examples
- [Flaky Test Policy](./FLAKY_TEST_POLICY.md) - Handling unreliable tests
- [Testing Requirements](./../plans/ui-ux-testing-automation/requirements.md) - Complete testing strategy

## Quick Reference

### Most Common Test Patterns

```typescript
// Component test
it('renders opportunity form', () => {
  render(<OpportunityCreate />);
  expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
});

// Form submission test
it('creates opportunity on form submission', async () => {
  const user = userEvent.setup();
  render(<OpportunityCreate />);

  await user.type(screen.getByRole('textbox', { name: /name/i }), 'New Deal');
  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(mockDataProvider.create).toHaveBeenCalledWith('opportunities', {
      data: expect.objectContaining({ name: 'New Deal' })
    });
  });
});

// Error handling test
it('displays error when API fails', async () => {
  mockDataProvider.create.mockRejectedValue(new Error('Server error'));

  const user = userEvent.setup();
  render(<OpportunityCreate />);

  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
  });
});
```

## Support

For testing questions or issues:
1. Check the [Testing Requirements](./../plans/ui-ux-testing-automation/requirements.md)
2. Review existing tests for patterns
3. Ask in the development team channel