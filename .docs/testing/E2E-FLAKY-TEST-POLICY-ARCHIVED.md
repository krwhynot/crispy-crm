# Flaky Test Policy

## Detection

A test is considered "flaky" if it fails in CI but passes on re-run more than **2 times in one week**.

### Identification Criteria

- Test passes locally but fails in CI
- Test fails intermittently without code changes
- Test results vary between consecutive runs
- Test passes when run in isolation but fails in suite

### Monitoring

- CI tracks test failure rates automatically
- Weekly review of test stability metrics
- Team members report flaky tests via GitHub issues with `flaky-test` label

## Action Plan

When a flaky test is identified, follow this escalation process:

### 1. Create P2 Ticket to Investigate Root Cause

Create a GitHub issue with:
- Title: `[Flaky Test] {test name} - {brief description}`
- Label: `flaky-test`, `P2-priority`
- Description template:

```markdown
## Flaky Test Report

**Test File**: `path/to/test.spec.ts`
**Test Name**: `should validate form submission`
**Failure Rate**: X failures in Y runs this week

### Symptoms
- Describe what the test does
- When it fails (CI only? Specific conditions?)
- Error messages received

### Initial Investigation
- [ ] Checked for timing issues
- [ ] Verified test isolation
- [ ] Reviewed recent changes
- [ ] Checked for external dependencies

### Reproduction Steps
1. How to reproduce the flakiness
2. Specific conditions that trigger failure
```

### 2. If Test Blocks >3 PRs, Quarantine with `.skip()`

When a flaky test becomes disruptive:

```typescript
// ❌ Remove this:
test('flaky test that blocks PRs', async () => {
  // test implementation
});

// ✅ Replace with:
test.skip('flaky test that blocks PRs - see issue #123', async () => {
  // test implementation
});
```

### 3. Add Comment Explaining Quarantine Reason

Always document why a test is skipped:

```typescript
/**
 * QUARANTINED: Flaky test - fails intermittently in CI
 * Issue: https://github.com/org/repo/issues/123
 * Problem: Race condition when multiple filters applied simultaneously
 * Expected fix: Refactor filter state management
 * Quarantined by: @username on 2025-01-30
 */
test.skip('filters opportunities by multiple criteria - see issue #123', async () => {
  // test implementation
});
```

### 4. Weekly Review of Quarantined Tests

Every Friday, the team reviews quarantined tests:

1. Check if underlying issues are resolved
2. Re-enable tests that are now stable
3. Escalate tests quarantined >30 days to P1
4. Remove skip when fixed:

```typescript
// After fixing, remove .skip() and update comment
/**
 * PREVIOUSLY FLAKY: Fixed in PR #456
 * Issue was race condition in filter state
 * Solution: Added proper async/await in filter application
 */
test('filters opportunities by multiple criteria', async () => {
  // test implementation
});
```

## Common Causes

### Race Conditions (Async Timing Issues)

**Symptoms**: Test fails waiting for elements or state changes

**Common Patterns**:
```typescript
// ❌ BAD - No wait for async operation
await userEvent.click(saveButton);
expect(screen.getByText('Saved')).toBeInTheDocument();

// ✅ GOOD - Wait for async completion
await userEvent.click(saveButton);
await waitFor(() => {
  expect(screen.getByText('Saved')).toBeInTheDocument();
});
```

**Solutions**:
- Use `waitFor()` for async operations
- Add explicit waits for loading states
- Ensure promises are properly awaited
- Mock timers when testing time-dependent code

### Flaky Selectors (Use getByRole, not CSS)

**Symptoms**: Element not found errors, selector matches wrong element

**Common Patterns**:
```typescript
// ❌ BAD - Text content changes break test
screen.getByText('$50,000.00');

// ❌ BAD - CSS classes change with styling updates
container.querySelector('.opportunity-card');

// ✅ GOOD - Semantic selector resilient to changes
screen.getByRole('cell', { name: /amount/i });
```

**Solutions**:
- Follow selector hierarchy: getByRole > getByLabelText > data-testid
- Never use CSS selectors or brittle text matches
- Use accessible names and ARIA attributes
- Add data-testid only when semantic selectors insufficient

### External Dependencies (Network, Database)

**Symptoms**: Network timeouts, database connection errors, API rate limits

**Common Patterns**:
```typescript
// ❌ BAD - Direct API call in test
const response = await fetch('https://api.external.com/data');

// ✅ GOOD - Mock external dependencies
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mocked' })
});
```

**Solutions**:
- Mock all external API calls
- Use test database with predictable data
- Implement retry logic for database connections
- Set appropriate timeouts for slow operations

### Test Pollution (State Leakage Between Tests)

**Symptoms**: Tests pass in isolation but fail when run together

**Common Patterns**:
```typescript
// ❌ BAD - Shared state between tests
let testData;

beforeAll(() => {
  testData = createTestData();
});

test('test 1', () => {
  testData.modified = true; // Pollutes next test
});

test('test 2', () => {
  expect(testData.modified).toBe(false); // Fails!
});

// ✅ GOOD - Fresh state for each test
beforeEach(() => {
  testData = createTestData();
});
```

**Solutions**:
- Use `beforeEach` instead of `beforeAll` for test data
- Clean up after each test with `afterEach`
- Clear all mocks: `vi.clearAllMocks()`
- Reset DOM: `cleanup()`
- Clear storage: `localStorage.clear()`

## Prevention Strategies

### 1. Write Resilient Tests

```typescript
// Use data-testid for complex UI elements
<div data-testid="kanban-column-qualified">

// Use flexible matchers
expect(amount).toBeGreaterThan(0); // Not exact values

// Handle loading states explicitly
await waitFor(() => {
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

### 2. Isolate Test Data

```typescript
// Namespace test data
const testId = `test_${Date.now()}_${Math.random()}`;
const opportunity = {
  name: `${testId}_Opportunity`,
  // ...
};

// Clean up reliably
afterEach(async () => {
  await safeCleanup([
    () => deleteByPrefix(testId)
  ]);
});
```

### 3. Mock Time-Dependent Code

```typescript
// Control time in tests
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-30'));
});

afterEach(() => {
  vi.useRealTimers();
});

test('shows correct relative time', () => {
  render(<TimeAgo date="2025-01-29" />);
  expect(screen.getByText('1 day ago')).toBeInTheDocument();
});
```

### 4. Set Appropriate Timeouts

```typescript
// Increase timeout for slow operations
test('loads large dataset', async () => {
  // ... test code
}, 20000); // 20 second timeout

// Or in waitFor
await waitFor(
  () => expect(screen.getByText('Loaded')).toBeInTheDocument(),
  { timeout: 5000 } // 5 second timeout
);
```

## Reporting

### Weekly Metrics

Track and report:
- Number of flaky tests detected
- Number of tests quarantined
- Number of tests fixed and re-enabled
- Average time to fix flaky tests

### Monthly Review

- Identify patterns in flaky tests
- Update testing guidelines based on learnings
- Celebrate improvements in test stability

## Examples from Codebase

### Example 1: Race Condition in Filter Application

```typescript
// FLAKY VERSION
test('applies multiple filters', async () => {
  await userEvent.click(screen.getByRole('button', { name: /filters/i }));
  await userEvent.selectOptions(stageSelect, 'qualified');
  await userEvent.selectOptions(prioritySelect, 'high');

  // Race condition: filters might not be applied yet
  expect(screen.getByText('2 results')).toBeInTheDocument();
});

// FIXED VERSION
test('applies multiple filters', async () => {
  await userEvent.click(screen.getByRole('button', { name: /filters/i }));
  await userEvent.selectOptions(stageSelect, 'qualified');
  await userEvent.selectOptions(prioritySelect, 'high');

  // Wait for filters to be applied and results to update
  await waitFor(() => {
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });
});
```

### Example 2: External Dependency

```typescript
// FLAKY VERSION
test('fetches user data from Supabase', async () => {
  // Direct database call - can timeout or fail
  const { data } = await supabase.from('users').select('*');
  expect(data).toHaveLength(5);
});

// FIXED VERSION
test('fetches user data from Supabase', async () => {
  // Mock the data provider
  mockDataProvider.getList.mockResolvedValue({
    data: createMockUsers(5),
    total: 5
  });

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getAllByRole('row')).toHaveLength(6); // 5 + header
  });
});
```

## Tools for Debugging

### 1. Test Replay

```typescript
// Log state at failure point
test('complex workflow', async () => {
  try {
    // test steps
  } catch (error) {
    console.log('Test failed at state:', {
      url: window.location.href,
      localStorage: { ...localStorage },
      DOMSnapshot: screen.debug()
    });
    throw error;
  }
});
```

### 2. Flaky Test Detector

```bash
# Run test multiple times to detect flakiness
for i in {1..10}; do
  npm test -- --run OpportunityList.test.tsx
  if [ $? -ne 0 ]; then
    echo "Failed on run $i"
  fi
done
```

### 3. CI Flaky Test Report

GitHub Actions can track flaky tests:

```yaml
- name: Run tests with retry
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm run test:ci
    on_retry_command: echo "Test failed, retrying..."
```

## Related Documentation

- [Testing Overview](./TESTING.md)
- [Writing Tests Guide](./WRITING_TESTS.md)
- [CI/CD Documentation](../../.github/workflows/README.md)