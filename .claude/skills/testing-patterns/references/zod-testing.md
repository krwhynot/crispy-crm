# Zod Schema Validation Testing

Detailed patterns for testing Zod schemas in Crispy CRM. Covers valid/invalid input testing, coercion, defaults, and schema-driven test organization.

## Testing Zod Schemas

```typescript
// src/atomic-crm/validation/__tests__/contacts.test.ts
import { describe, it, expect } from 'vitest';
import { contactSchema, createContactSchema } from '../contacts';

describe('contactSchema', () => {
  describe('valid inputs', () => {
    it('accepts complete valid contact', () => {
      const result = contactSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects email without domain', () => {
      const result = contactSchema.safeParse({
        first_name: 'John',
        email: 'invalid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('rejects name exceeding max length', () => {
      const result = contactSchema.safeParse({
        first_name: 'A'.repeat(101), // Max is 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coercion', () => {
    it('coerces string numbers to numbers', () => {
      const result = opportunitySchema.safeParse({
        amount: '1000', // String from form input
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.amount).toBe('number');
      }
    });
  });

  describe('defaults', () => {
    it('applies schema defaults via partial().parse()', () => {
      const defaults = contactSchema.partial().parse({});
      expect(defaults.status).toBe('active');
    });
  });
});
```

## Test Organization for Schemas

Structure schema tests with these `describe` blocks:

| Block | Purpose |
|-------|---------|
| `valid inputs` | Confirm well-formed data passes |
| `invalid inputs` | Confirm bad data fails with correct error path |
| `coercion` | Verify `z.coerce` handles form string inputs |
| `defaults` | Verify `.default()` values via `partial().parse({})` |
| `strict mode` | Verify `.strict()` rejects unknown fields (create schemas) |
| `passthrough` | Verify `.passthrough()` preserves metadata (update schemas) |

## Key Patterns

### Testing Error Paths

Always verify the error path, not just success/failure:

```typescript
it('rejects email without domain', () => {
  const result = contactSchema.safeParse({ email: 'invalid' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toContain('email');
  }
});
```

### Testing Strict vs Passthrough

```typescript
describe('create schema (strict)', () => {
  it('rejects unknown fields', () => {
    const result = createContactSchema.safeParse({
      first_name: 'John',
      unknown_field: 'should fail',
    });
    expect(result.success).toBe(false);
  });
});

describe('update schema (passthrough)', () => {
  it('preserves metadata fields', () => {
    const result = updateContactSchema.safeParse({
      first_name: 'John',
      id: 123,
      created_at: '2024-01-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(123);
    }
  });
});
```

### Testing Coercion from Form Inputs

```typescript
describe('form input coercion', () => {
  it('coerces string amount to number', () => {
    const result = opportunitySchema.safeParse({
      amount: '1000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.amount).toBe('number');
      expect(result.data.amount).toBe(1000);
    }
  });

  it('coerces string date to Date', () => {
    const result = opportunitySchema.safeParse({
      expected_close_date: '2024-06-15',
    });
    expect(result.success).toBe(true);
  });
});
```

## Coverage Requirements for Schemas

| Type | Minimum | Target |
|------|---------|--------|
| **Validation schemas** | 90% | 100% |

Schema tests are the highest-value tests in the codebase. Every field constraint, coercion, and default should have a corresponding test.
