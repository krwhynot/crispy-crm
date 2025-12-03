# Testing Patterns

## Purpose

Document testing patterns for Atomic CRM including unit tests with Vitest, E2E tests with Playwright, mocking strategies, and test coverage requirements. Focuses on testing what matters while maintaining velocity.

## Core Principle: Test at the Right Level

**Testing Pyramid:**
```
        /\
       /  \  E2E Tests (Few)
      /____\   - Critical user journeys
     /      \  - Integration tests
    /________\
   /          \ Unit Tests (Many)
  /__________\   - Validation logic
                  - Utilities
                  - Components
```

**Test Coverage: 70% minimum**

## Pattern 1: Unit Tests with Vitest

### Testing Validation Logic

**From `src/atomic-crm/validation/__tests__/contacts.test.ts`:**

```typescript
import { describe, test, expect } from 'vitest';
import { contactSchema, emailAndTypeSchema } from '../contacts';

describe('contactSchema', () => {
  test('validates valid contact', () => {
    const validContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ email: 'john@example.com', type: 'Work' }],
      phone: [{ number: '555-1234', type: 'Work' }],
    };

    expect(() => contactSchema.parse(validContact)).not.toThrow();
  });

  test('requires first_name or last_name', () => {
    const invalidContact = {
      email: [{ email: 'test@example.com', type: 'Work' }],
    };

    expect(() => contactSchema.parse(invalidContact)).toThrow();
  });

  test('validates email format', () => {
    const invalidEmail = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ email: 'invalid-email', type: 'Work' }],
    };

    expect(() => contactSchema.parse(invalidEmail)).toThrow('Invalid email address');
  });

  test('applies default type to email', () => {
    const emailEntry = { email: 'john@example.com' };
    const result = emailAndTypeSchema.parse(emailEntry);

    expect(result.type).toBe('Work'); // Default from schema
  });
});
```

**Pattern:**
- Test happy path (valid input)
- Test validation errors (invalid input)
- Test defaults (schema.parse applies .default())
- Test edge cases (empty strings, nulls)

### Testing Components

**From `src/components/admin/__tests__/form.test.tsx:63`:**

```typescript
import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormLabel, FormControl, FormError } from '../form';
import { renderWithAdminContext } from '@/tests/utils/render-admin';

// Wrapper component to provide form context
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}) => {
  const form = useForm({
    defaultValues,
    mode: 'onChange', // Enable onChange validation for tests
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
};

describe('FormField', () => {
  test('provides context to child components', () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="test-field" name="testField">
          <TestFormFieldConsumer />
        </FormField>
      </FormWrapper>
    );

    expect(screen.getByTestId('form-item-id')).toHaveTextContent('test-field');
    expect(screen.getByTestId('form-desc-id')).toHaveTextContent('test-field-description');
  });

  test('applies correct CSS classes', () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="test" name="test" className="custom-field-class">
          <div>Test Content</div>
        </FormField>
      </FormWrapper>
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass('grid', 'gap-2', 'custom-field-class');
    expect(formField).toHaveAttribute('role', 'group');
  });
});

describe('FormLabel', () => {
  test('renders label with correct htmlFor attribute', () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="email-field" name="email">
          <FormLabel>Email Address</FormLabel>
        </FormField>
      </FormWrapper>
    );

    const label = screen.getByText('Email Address');
    expect(label).toHaveAttribute('for', 'email-field');
  });
});
```

**Pattern:**
- Use `renderWithAdminContext` for React Admin components
- Wrap forms in FormWrapper with useForm
- Test DOM structure and accessibility attributes
- Use `screen.getByRole`, `screen.getByText` for queries
- Test CSS classes and HTML attributes

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  test('throws on Supabase error', async () => {
    // Mock Supabase to throw
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
    }));

    // Expect throw, not silent failure
    await expect(getContacts()).rejects.toThrow('RLS policy violation');
  });

  test('handles partial failures with Promise.allSettled', async () => {
    const ids = [1, 2, 3, 4, 5];

    // Mock: 3 succeed, 2 fail
    vi.mocked(supabase.from).mockImplementation((table) => ({
      update: vi.fn((data) => ({
        eq: vi.fn((field, value) => {
          if (value === 2 || value === 4) {
            return Promise.reject(new Error('RLS violation'));
          }
          return Promise.resolve({ data: {}, error: null });
        }),
      })),
    }));

    const { successes, failures } = await bulkMarkAsRead(ids);

    expect(successes).toBe(3);
    expect(failures).toBe(2);
  });
});
```

### Mocking Patterns

```typescript
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

// Mock React Admin hooks
vi.mock('ra-core', () => ({
  useGetIdentity: vi.fn(() => ({
    data: { id: 1, email: 'test@example.com', role: 'admin' },
    isPending: false,
  })),
  useNotify: vi.fn(() => vi.fn()),
  useRefresh: vi.fn(() => vi.fn()),
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Pattern 2: E2E Tests with Playwright

### Critical Journey Test

**From `tests/e2e/dashboard-verification-simple.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard - Critical Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays key metrics', async ({ page }) => {
    // Check that dashboard loads
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Check key metrics are visible
    await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="opportunities-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="contacts-card"]')).toBeVisible();
  });

  test('navigates to opportunities list', async ({ page }) => {
    // Click on opportunities card
    await page.click('[data-testid="opportunities-card"]');

    // Should navigate to opportunities list
    await expect(page).toHaveURL('/opportunities');
    await expect(page.locator('h1')).toContainText('Opportunities');
  });

  test('creates new contact', async ({ page }) => {
    // Navigate to contacts
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL('/contacts');

    // Click create button
    await page.click('button:has-text("Create")');

    // Fill form
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="email.0.email"]', 'john@example.com');

    // Submit
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('.notification-success')).toBeVisible();

    // Should navigate to show page
    await expect(page).toHaveURL(/\/contacts\/\d+\/show/);
  });
});
```

**Pattern:**
- Test complete user journeys (login → action → result)
- Use data-testid for stable selectors
- Wait for elements with `expect().toBeVisible()`
- Test navigation and URL changes
- Verify success/error notifications

### Accessibility Testing

```typescript
test('meets WCAG AA standards', async ({ page }) => {
  await page.goto('/contacts');

  // Run accessibility audit
  const results = await new AxeBuilder({ page }).analyze();

  // Should have no violations
  expect(results.violations).toHaveLength(0);
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/contacts');

  // Tab through form inputs
  await page.keyboard.press('Tab'); // First input
  await expect(page.locator('input[name="first_name"]')).toBeFocused();

  await page.keyboard.press('Tab'); // Second input
  await expect(page.locator('input[name="last_name"]')).toBeFocused();

  // Enter key submits form
  await page.keyboard.press('Enter');
  await expect(page.locator('.notification')).toBeVisible();
});
```

## Pattern 3: Test Coverage

### What to Test

**DO Test:**
- ✅ Validation logic (Zod schemas)
- ✅ Business logic (calculations, transformations)
- ✅ Error handling (fail-fast, Promise.allSettled)
- ✅ Form state (defaults from schema)
- ✅ Component rendering (accessibility, classes)
- ✅ Critical user journeys (E2E)

**DON'T Test:**
- ❌ Third-party libraries (React, Zod, Supabase)
- ❌ React Admin internals
- ❌ CSS styling (use visual regression instead)
- ❌ Implementation details (private methods)

### Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# Output
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
validation/contacts.ts   |  95.23  |  91.66   |  100.00 |  95.00
validation/opportunities |  92.85  |  88.88   |  100.00 |  92.30
utils/csvValidator.ts    |  100.00 |  100.00  |  100.00 | 100.00
components/Form.tsx      |  87.50  |  83.33   |  85.71  |  87.50
-------------------------|---------|----------|---------|--------
All files                |  70.12  |  65.43   |  72.15  |  69.87
```

**Minimum:** 70% coverage

## Pattern 4: Test Organization

### File Structure

```
src/
  atomic-crm/
    validation/
      contacts.ts
      __tests__/
        contacts.test.ts
    utils/
      csvValidator.ts
      __tests__/
        csvValidator.test.ts
    contacts/
      ContactCreate.tsx
      __tests__/
        ContactCreate.test.tsx

tests/
  e2e/
    auth.spec.ts
    contacts.spec.ts
    dashboard.spec.ts
  fixtures/
    test-users.ts
    test-data.ts
```

**Pattern:**
- Unit tests: `__tests__/` next to source files
- E2E tests: `tests/e2e/` at root
- Fixtures: `tests/fixtures/` for shared test data

### Test Naming

```typescript
// ✅ GOOD - Descriptive test names
describe('contactSchema', () => {
  test('validates valid contact with email and phone', () => {});
  test('requires first_name or last_name', () => {});
  test('rejects invalid email format', () => {});
  test('applies default type to email entries', () => {});
});

// ❌ BAD - Vague test names
describe('validation', () => {
  test('works', () => {});
  test('test 1', () => {});
  test('edge case', () => {});
});
```

## Pattern 5: Testing Database Logic

### Testing Migrations

```sql
-- In migration file
DO $$
BEGIN
  -- Test that enum was created
  PERFORM 1 FROM pg_type WHERE typname = 'user_role';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_role enum not created';
  END IF;

  -- Test that column was added
  PERFORM 1 FROM information_schema.columns
  WHERE table_name = 'sales' AND column_name = 'role';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'role column not added';
  END IF;

  -- Test that helper function exists
  PERFORM 1 FROM pg_proc WHERE proname = 'is_admin';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'is_admin function not created';
  END IF;

  RAISE NOTICE 'Migration tests passed';
END $$;
```

### Testing RLS Policies

```sql
-- Test RLS policies
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_sales_id BIGINT;
  can_select BOOLEAN;
  can_insert BOOLEAN;
  can_update BOOLEAN;
  can_delete BOOLEAN;
BEGIN
  -- Create test user
  INSERT INTO auth.users (id, email) VALUES (test_user_id, 'test@example.com');
  INSERT INTO sales (user_id, email, role) VALUES (test_user_id, 'test@example.com', 'rep')
  RETURNING id INTO test_sales_id;

  -- Set session
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);

  -- Test SELECT (should succeed)
  BEGIN
    PERFORM * FROM contacts LIMIT 1;
    can_select := TRUE;
  EXCEPTION WHEN insufficient_privilege THEN
    can_select := FALSE;
  END;

  -- Test DELETE (should fail for rep)
  BEGIN
    DELETE FROM contacts WHERE id = 999999;
    can_delete := TRUE;
  EXCEPTION WHEN insufficient_privilege THEN
    can_delete := FALSE;
  END;

  -- Verify results
  IF can_select = FALSE THEN
    RAISE EXCEPTION 'Rep should be able to SELECT contacts';
  END IF;

  IF can_delete = TRUE THEN
    RAISE EXCEPTION 'Rep should NOT be able to DELETE contacts';
  END IF;

  RAISE NOTICE 'RLS policy tests passed';
END $$;
```

## Testing Decision Tree

```
What to test?
│
├─ Pure logic (validation, utils)?
│  └─ Unit tests with Vitest
│     - Test happy path
│     - Test error cases
│     - Test edge cases
│     - Mock external dependencies
│
├─ Component rendering?
│  └─ Unit tests with React Testing Library
│     - Test DOM structure
│     - Test accessibility
│     - Test user interactions
│     - Mock React Admin hooks
│
├─ Database logic (migrations, RLS)?
│  └─ SQL tests in migration file
│     - Test schema changes
│     - Test RLS policies
│     - Test helper functions
│
└─ Critical user journey?
   └─ E2E tests with Playwright
      - Test login → action → result
      - Test navigation
      - Test notifications
      - Test keyboard navigation
```

## Best Practices

### DO

✅ Test at the right level (unit for logic, E2E for journeys)
✅ Use descriptive test names
✅ Mock external dependencies (Supabase, React Admin)
✅ Test error handling (expect throws)
✅ Test accessibility (WCAG AA, keyboard nav)
✅ Maintain 70% minimum coverage
✅ Reset mocks between tests (beforeEach)
✅ Use data-testid for stable selectors
✅ Test validation logic thoroughly
✅ Test RLS policies in migrations

### DON'T

❌ Test implementation details (private methods)
❌ Test third-party libraries (React, Zod)
❌ Skip error case tests
❌ Use brittle selectors (CSS classes)
❌ Test CSS styling (use visual regression)
❌ Write slow E2E tests for unit logic
❌ Skip accessibility tests
❌ Forget to clear mocks between tests
❌ Test everything (focus on critical paths)
❌ Skip coverage checks in CI

## Running Tests

### Local Development

```bash
# Run all unit tests (watch mode)
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (visible browser)
npm run test:e2e:headed
```

### CI/CD

```bash
# Run once (no watch)
npm run test:ci

# Check coverage threshold (70%)
npm run test:coverage -- --reporter=json-summary

# Run E2E against staging
VITE_SUPABASE_URL=$STAGING_URL npm run test:e2e
```

## Related Resources

- [validation-patterns.md](validation-patterns.md) - Testing validation logic
- [error-handling.md](error-handling.md) - Testing error scenarios
- [database-patterns.md](database-patterns.md) - Testing RLS policies
- [anti-patterns.md](anti-patterns.md) - Testing mistakes to avoid

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
