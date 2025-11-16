# Dashboard V2 Testing Guide

## Overview

Dashboard V2 has comprehensive test coverage across unit, integration, and E2E tests to ensure stability and accessibility.

## Test Structure

```
src/atomic-crm/dashboard/v2/
├── __tests__/
│   └── PrincipalDashboardV2.test.tsx        # Integration tests
├── components/__tests__/
│   ├── DashboardHeader.test.tsx             # Unit tests
│   ├── FiltersSidebar.test.tsx
│   ├── OpportunitiesHierarchy.test.tsx
│   ├── TasksPanel.test.tsx
│   ├── QuickLogger.test.tsx
│   └── RightSlideOver.test.tsx
├── context/__tests__/
│   └── PrincipalContext.test.tsx
└── hooks/__tests__/
    └── useFeatureFlag.test.tsx

tests/e2e/
├── dashboard-v2.spec.ts                      # E2E smoke tests
├── dashboard-v2-tasks.spec.ts                # Task completion flow
├── dashboard-v2-slide-over.spec.ts           # Slide-over interactions
├── dashboard-v2-navigation.spec.ts           # New menu navigation
└── dashboard-v2-accessibility.spec.ts        # Axe accessibility scan
```

## Running Tests

**Unit Tests (Vitest):**
```bash
# Run all dashboard v2 unit tests
npm test -- src/atomic-crm/dashboard/v2/

# Run specific component tests
npm test -- OpportunitiesHierarchy.test.tsx

# Run with coverage
npm run test:coverage -- src/atomic-crm/dashboard/v2/
```

**E2E Tests (Playwright):**
```bash
# Run all dashboard v2 E2E tests
npm run test:e2e tests/e2e/dashboard-v2*.spec.ts

# Run specific test file
npm run test:e2e tests/e2e/dashboard-v2-tasks.spec.ts

# Run in UI mode (interactive debugging)
npm run test:e2e:ui
```

## Test Coverage Goals

- **Unit Tests:** ≥70% coverage for all components
- **Integration Tests:** Core user journeys (principal selection, filtering, task completion)
- **E2E Tests:** Critical paths (navigation, data refresh, accessibility)
- **Accessibility:** Zero Axe violations on all pages

## Key Testing Patterns

### 1. React Admin Context Wrapper

All component tests require `AdminContext` and `PrincipalProvider`:

```typescript
render(
  <AdminContext>
    <PrincipalProvider>
      <YourComponent />
    </PrincipalProvider>
  </AdminContext>
);
```

### 2. Data Fetching (useGetList)

Mock React Admin hooks for data fetching tests:

```typescript
vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
}));
```

### 3. User Events

Use `@testing-library/user-event` for realistic interactions:

```typescript
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByLabelText('Subject'), 'Test');
```

### 4. Accessibility Tests

Use `@axe-core/playwright` for automated a11y scans:

```typescript
const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
expect(accessibilityScanResults.violations).toEqual([]);
```

## Common Issues

### Issue: Tests fail with "window is not defined"

**Solution:** Add SSR guard to hooks:
```typescript
if (typeof window === 'undefined') return false;
```

### Issue: E2E tests timeout waiting for data

**Solution:** Increase timeout or add explicit wait:
```typescript
await page.waitForTimeout(1000); // Wait for data load
```

### Issue: React Admin hooks not mocked

**Solution:** Mock the entire module:
```typescript
vi.mock('react-admin', () => ({
  useGetList: vi.fn(),
  useUpdate: vi.fn(),
  useNotify: vi.fn(),
  // ... etc
}));
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Every pull request
- Manual workflow dispatch

**Minimum Requirements:**
- All unit tests must pass
- All E2E tests must pass
- Coverage ≥70%
- Zero accessibility violations

## References

- [Testing Quick Reference](./testing-quick-reference.md)
- [Playwright MCP Guide](./playwright-mcp-guide.md)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
