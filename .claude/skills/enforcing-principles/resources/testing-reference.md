# Testing: Reference Guide

## Purpose

Quick reference for test coverage, organization, database testing, and best practices.

## Test Coverage

**Minimum:** 70% coverage

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

## File Structure

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

## Test Naming

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

## Testing Database Logic

### Testing Migrations

```sql
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

  RAISE NOTICE 'Migration tests passed';
END $$;
```

### Testing RLS Policies

```sql
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_sales_id BIGINT;
  can_select BOOLEAN;
  can_delete BOOLEAN;
BEGIN
  INSERT INTO auth.users (id, email) VALUES (test_user_id, 'test@example.com');
  INSERT INTO sales (user_id, email, role) VALUES (test_user_id, 'test@example.com', 'rep')
  RETURNING id INTO test_sales_id;

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

## Running Tests

```bash
# Run all unit tests (watch mode)
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run once (no watch) - CI
npm run test:ci

# Check coverage threshold (70%)
npm run test:coverage -- --reporter=json-summary
```

## Related Resources

- [testing-unit.md](testing-unit.md) - Unit tests with Vitest
- [testing-e2e.md](testing-e2e.md) - E2E tests with Playwright
- [anti-patterns-testing.md](anti-patterns-testing.md) - Testing mistakes to avoid

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
