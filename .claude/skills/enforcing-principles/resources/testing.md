# Testing

## Testing Pyramid

```
      /\
     /  \  E2E Tests (Few) - Critical user journeys
    /____\
   /      \ Unit Tests (Many) - Validation, utilities, components
  /________\
```

Minimum coverage: 70%.

## Unit Tests: Validation Logic

```typescript
import { describe, test, expect } from 'vitest';
import { contactSchema, emailAndTypeSchema } from '../contacts';

describe('contactSchema', () => {
  test('validates valid contact', () => {
    const validContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ value: 'john@example.com', type: 'work' }],
    };
    expect(() => contactSchema.parse(validContact)).not.toThrow();
  });

  test('requires first_name or last_name', () => {
    expect(() => contactSchema.parse({ email: [] })).toThrow();
  });

  test('validates email format', () => {
    const invalid = { first_name: 'John', email: [{ value: 'bad', type: 'work' }] };
    expect(() => contactSchema.parse(invalid)).toThrow('Invalid email address');
  });

  test('applies default type to email', () => {
    const result = emailAndTypeSchema.parse({ value: 'john@example.com' });
    expect(result.type).toBe('work');
  });
});
```

Test: happy path, validation errors, defaults, edge cases (empty strings, nulls).

## Unit Tests: Components

```typescript
import { renderWithAdminContext } from '@/tests/utils/render-admin';
import { screen, waitFor } from '@testing-library/react';

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
  });
});
```

Always use `renderWithAdminContext` for React Admin components. Test DOM structure and accessibility attributes.

## Unit Tests: Error Handling

```typescript
test('throws on Supabase error', async () => {
  vi.mocked(supabase.from).mockImplementation(() => ({
    select: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
  }));
  await expect(getContacts()).rejects.toThrow('RLS policy violation');
});

test('handles partial failures with Promise.allSettled', async () => {
  const { successes, failures } = await bulkMarkAsRead(ids);
  expect(successes).toBe(3);
  expect(failures).toBe(2);
});
```

## Mocking Patterns

```typescript
// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
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
}));

// Reset between tests
beforeEach(() => { vi.clearAllMocks(); });
```

## E2E Tests: Critical Journeys

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard - Critical Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('creates new contact', async ({ page }) => {
    await page.click('a[href="/contacts"]');
    await page.click('button:has-text("Create")');
    await page.fill('input[name="first_name"]', 'John');
    await page.click('button:has-text("Save")');
    await expect(page.locator('.notification-success')).toBeVisible();
  });
});
```

Use data-testid for stable selectors. Wait for elements with `expect().toBeVisible()`.

## E2E: Accessibility Testing

```typescript
test('meets WCAG AA standards', async ({ page }) => {
  await page.goto('/contacts');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/contacts');
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="first_name"]')).toBeFocused();
});
```

## Database Testing

### Testing Migrations (in SQL DO blocks)

```sql
DO $$
BEGIN
  PERFORM 1 FROM pg_type WHERE typname = 'user_role';
  IF NOT FOUND THEN RAISE EXCEPTION 'user_role enum not created'; END IF;
  RAISE NOTICE 'Migration tests passed';
END $$;
```

### Testing RLS Policies

```sql
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  can_delete BOOLEAN;
BEGIN
  INSERT INTO auth.users (id, email) VALUES (test_user_id, 'test@example.com');
  INSERT INTO sales (user_id, email, role) VALUES (test_user_id, 'test@example.com', 'rep');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);

  BEGIN
    DELETE FROM contacts WHERE id = 999999;
    can_delete := TRUE;
  EXCEPTION WHEN insufficient_privilege THEN
    can_delete := FALSE;
  END;

  IF can_delete = TRUE THEN
    RAISE EXCEPTION 'Rep should NOT be able to DELETE contacts';
  END IF;
END $$;
```

## File Structure

```
src/atomic-crm/validation/__tests__/contacts.test.ts   (unit)
src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx (component)
tests/e2e/contacts.spec.ts                              (E2E)
tests/fixtures/test-data.ts                              (shared data)
```

## Test Naming

```typescript
// GOOD - descriptive
test('validates valid contact with email and phone', () => {});
test('requires first_name or last_name', () => {});

// BAD - vague
test('works', () => {});
test('test 1', () => {});
```

## Running Tests

```bash
npm test                    # Unit tests (watch mode)
npm run test:coverage       # With coverage
npm run test:e2e            # E2E tests
npm run test:e2e:ui         # E2E with UI
npm run test:ci             # CI (no watch)
```

## Testing Decision Tree

```
What to test?
|
+- Pure logic? --> Vitest unit tests (happy path, errors, edge cases)
+- Component? --> RTL + renderWithAdminContext
+- Database? --> SQL DO blocks in migration files
+- User journey? --> Playwright E2E
```
