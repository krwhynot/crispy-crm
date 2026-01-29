# Domain Layer: Schemas & Types

Defines what entities (Contact, Opportunity, Task) actually are. If this layer is messy, TypeScript types lie and forms break silently.

## Schema Rules

DO:
- `src/atomic-crm/validation/[entity].ts` - one file per entity
- `export type Contact = z.infer<typeof contactSchema>` - derive types from schemas
- `contactSchema.strict()` - prevent illegal fields reaching Supabase (default for creates)
- `z.coerce.number()` - handle form inputs that return strings
- Match DB columns exactly (e.g., `linkedin_url` in schema if in DB)

DON'T:
- `export interface Contact { ... }` - manual interfaces drift from schemas
- Orphan schemas in `utils/` or component files
- Skip `.strict()` on create schemas - allows invalid data through

### Strict vs Passthrough: When to Use Each

**`.strict()` (Default):** Use at API boundaries for **creates** and provider-level validation. Rejects unknown fields, preventing mass-assignment attacks.

**`.passthrough()` for Updates:** When handling **manual updates** (e.g., SlideOvers, edit forms) where the data object may contain mixed UI state, metadata fields (`id`, `created_at`, `updated_at`), or computed view fields, use `.passthrough()` to prevent Zod from silently stripping required metadata.

WRONG:
```typescript
// .strict() strips `id` and `updated_at` from update payload — save silently fails
const updateSchema = contactSchema.strict();
const cleaned = updateSchema.parse(formData); // { name: "John" } — id is GONE
```

RIGHT:
```typescript
// Create schema: strict (reject unknown fields)
export const contactCreateSchema = contactSchema.strict();

// Update schema: passthrough (preserve metadata, strip only via COMPUTED_FIELDS)
export const contactUpdateSchema = contactSchema.passthrough();
// Computed fields (from views) stripped separately in lifecycle callbacks
```

**Rule of thumb:** `.strict()` for creates (security), `.passthrough()` for updates (preserve metadata). Computed view fields are stripped by `withLifecycleCallbacks` in the provider layer, NOT by Zod.

## Constants

DO:
- `src/atomic-crm/[module]/constants.ts` - centralize magic strings
- `<SelectItem value={OPPORTUNITY_STAGES.WON}>` - use constants
- Define status colors in constants, not scattered CSS

DON'T:
- `<SelectItem value="closed_won">` - hardcoded strings

## Type Export Pattern

WRONG:
```typescript
export const contactSchema = z.object({ ... });
export interface Contact { id: string; name: string; ... }
```

RIGHT:
```typescript
export const contactSchema = z.object({ ... });
export type Contact = z.infer<typeof contactSchema>; // Single Source of Truth
```

Manual interfaces inevitably drift from schemas. Derive types to maintain sync.

## TypeScript Safety

DO:
- Type guards (`if (typeof x === 'string')`) - proper runtime type narrowing
- Mock factory functions (`mockContact()`, `mockUseGetListReturn()`) - typed test helpers
- `unknown` with guards - force explicit type checking before use
- Generics with constraints (`<T extends RaRecord>`) - maintain type boundaries

DON'T:
- `as any` - BANNED, breaks entire type system
- `as unknown as T` - signals broken types, fix the root cause
- Manual type casts in tests - use mock factories from `src/tests/utils/typed-mocks.ts`
- Casting to bypass type errors - always indicates architectural smell

### Broken Test Types

WRONG:
```typescript
// Bypasses type checking - test could pass with wrong data shape
const mockContact = {
  id: 1,
  first_name: "John",
} as any;

// Double cast - means types are fundamentally incompatible
const result = resourceExtractors.organizations(org as unknown as Organization);

// Window mutation without type safety
delete (window as any).location;
```

RIGHT:
```typescript
// Define typed test data using Zod schemas or interfaces
import type { Contact } from '@/atomic-crm/validation/contact';
const testContact: Contact = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  // ... all required fields
};

// Type guard for runtime narrowing
function isOrganization(record: RaRecord): record is Organization {
  return 'name' in record && typeof record.name === 'string';
}
if (isOrganization(org)) {
  const result = resourceExtractors.organizations(org);
}

// Proper window type extension (for test setup only)
declare global {
  interface Window {
    location: undefined;
  }
}
delete window.location;
```

Type casts hide bugs. Tests with `as any` can pass with invalid data shapes, then fail in production.

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

## Checklist

- [ ] Every table in `supabase/migrations/` has matching `z.object` in `validation/`
- [ ] Exporting `z.infer<...>` types (not manual interfaces)
- [ ] Create schemas use `.strict()` to block illegal fields
- [ ] Update schemas use `.passthrough()` to preserve metadata (`id`, `created_at`)
- [ ] Form inputs use `z.coerce` for type conversion
- [ ] No `as any` or `as unknown as` casts (use type guards or typed test data)
- [ ] React Admin hook mocks use generic factories from `src/tests/utils/typed-mocks.ts`
