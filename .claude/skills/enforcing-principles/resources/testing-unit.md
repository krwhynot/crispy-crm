# Testing: Unit Tests with Vitest

## Purpose

Document unit testing patterns for validation logic, components, and error handling.

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

## Pattern: Testing Validation Logic

**From `src/atomic-crm/validation/__tests__/contacts.test.ts`:**

```typescript
import { describe, test, expect } from 'vitest';
import { contactSchema, emailAndTypeSchema } from '../contacts';

describe('contactSchema', () => {
  test('validates valid contact', () => {
    const validContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ value: 'john@example.com', type: 'work' }],
      phone: [{ value: '555-1234', type: 'work' }],
    };

    expect(() => contactSchema.parse(validContact)).not.toThrow();
  });

  test('requires first_name or last_name', () => {
    const invalidContact = {
      email: [{ value: 'test@example.com', type: 'work' }],
    };

    expect(() => contactSchema.parse(invalidContact)).toThrow();
  });

  test('validates email format', () => {
    const invalidEmail = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ value: 'invalid-email', type: 'work' }],
    };

    expect(() => contactSchema.parse(invalidEmail)).toThrow('Invalid email address');
  });

  test('applies default type to email', () => {
    const emailEntry = { value: 'john@example.com' };
    const result = emailAndTypeSchema.parse(emailEntry);

    expect(result.type).toBe('work'); // Default from schema
  });
});
```

**Pattern:**
- Test happy path (valid input)
- Test validation errors (invalid input)
- Test defaults (schema.parse applies .default())
- Test edge cases (empty strings, nulls)

## Pattern: Testing Components

**From `src/components/admin/__tests__/form.test.tsx:63`:**

```typescript
import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormLabel } from '../form';
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
    mode: 'onChange',
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
  });
});
```

**Pattern:**
- Use `renderWithAdminContext` for React Admin components
- Wrap forms in FormWrapper with useForm
- Test DOM structure and accessibility attributes
- Use `screen.getByRole`, `screen.getByText` for queries

## Pattern: Testing Error Handling

```typescript
describe('Error Handling', () => {
  test('throws on Supabase error', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
    }));

    await expect(getContacts()).rejects.toThrow('RLS policy violation');
  });

  test('handles partial failures with Promise.allSettled', async () => {
    const ids = [1, 2, 3, 4, 5];

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

## Pattern: Mocking

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

## Related Resources

- [testing-e2e.md](testing-e2e.md) - E2E tests with Playwright
- [testing-reference.md](testing-reference.md) - Coverage, organization, best practices
- [validation-basics.md](validation-basics.md) - Validation patterns to test

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
