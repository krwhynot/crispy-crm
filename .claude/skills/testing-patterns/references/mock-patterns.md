# Mock Patterns & Supabase Mocking

Detailed mock setup patterns for Crispy CRM. Covers Supabase mocking, per-test overrides, and typed mock factory usage.

## Mocking Supabase

### Global Mock (setup.ts)

```typescript
// src/tests/setup.ts - Global mock
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
  },
}));
```

### Per-Test Override

```typescript
// Per-test override
it('handles database error', async () => {
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' }
    }),
  });

  // Test error handling
});
```

## Typed Mock Factories

Use typed factories from `src/tests/utils/typed-mocks.ts` to eliminate `as any` casts in test mocks.

### React Admin Hook Mocks

WRONG:
```typescript
// Each test manually casts - error-prone and inconsistent
vi.mocked(useGetList).mockReturnValue({
  data: [mockContact],
  total: 1,
} as any);
```

RIGHT:
```typescript
// Use typed factories from src/tests/utils/typed-mocks.ts
import { mockUseGetListReturn } from '@/tests/utils/typed-mocks';
import type { Contact } from '@/atomic-crm/validation/contact';

vi.mocked(useGetList<Contact>).mockReturnValue(
  mockUseGetListReturn<Contact>({
    data: [testContact],
    total: 1
  })
);
```

Generic typed factories eliminate `as any` while maintaining type safety for any entity.

## Mock Scoping Best Practices

- Use `vi.resetAllMocks()` in `beforeEach` (not `clearAllMocks`)
- Scope per-test overrides with `mockReturnValueOnce` to avoid cross-test pollution
- Define shared mock data as constants at the top of `describe` blocks
- Use factory functions for complex mock objects to ensure fresh instances per test
