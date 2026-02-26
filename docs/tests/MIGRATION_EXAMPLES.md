# Migration Examples: `as any` to Typed Mocks

This guide provides copy-paste examples for migrating test files from legacy `as any` patterns to the typed mock infrastructure.

## Case Study: ContactShow.test.tsx Migration

**File:** `src/atomic-crm/contacts/__tests__/ContactShow.test.tsx`
**Violations Before:** 8 `as any` casts
**Violations After:** 0

### Import Changes

**BEFORE:**
```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import ContactShow from "../ContactShow";
```

**AFTER:**
```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";  // ← Added for component mock typing
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";  // ← Added
import ContactShow from "../ContactShow";
```

### Hook Mock Pattern

**BEFORE (legacy):**
```typescript
(useShowContext as any).mockReturnValue({
  record: mockContact,
  isPending: false,
  error: null,
});
```

**AFTER (typed):**
```typescript
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ record: mockContact })
);
```

### Loading State

**BEFORE:**
```typescript
(useShowContext as any).mockReturnValue({
  record: undefined,
  isPending: true,
  error: null,
});
```

**AFTER:**
```typescript
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ isPending: true })
);
```

### Component Mock Props

**BEFORE:**
```typescript
vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children }: any) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));
```

**AFTER:**
```typescript
vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));
```

---

## Common Migration Patterns

### Pattern 1: useGetList

**BEFORE:**
```typescript
vi.mocked(useGetList).mockReturnValue({
  data: [
    { id: 1, first_name: "Alice" } as any,
    { id: 2, first_name: "Bob" } as any,
  ],
  total: 2,
  isPending: false,
  isLoading: false,
} as any);
```

**AFTER:**
```typescript
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";
import { createMockContact } from "@/tests/utils/mock-providers";

vi.mocked(useGetList).mockReturnValue(
  mockUseGetListReturn({
    data: [
      createMockContact({ id: 1, first_name: "Alice" }),
      createMockContact({ id: 2, first_name: "Bob" }),
    ],
    total: 2,
  })
);
```

### Pattern 2: useListContext with Filters

**BEFORE:**
```typescript
vi.mocked(useListContext).mockReturnValue({
  data: [{ id: 1, name: "Test" } as any],
  total: 1,
  isPending: false,
  isLoading: false,
  isFetching: false,
  error: null,
  sort: { field: "id", order: "ASC" },
  filterValues: { status: "active" },
  displayedFilters: {},
  setFilters: vi.fn(),
  setSort: vi.fn(),
  setPage: vi.fn(),
  setPerPage: vi.fn(),
  page: 1,
  perPage: 25,
  resource: "contacts",
  selectedIds: [],
  onSelect: vi.fn(),
  onToggleItem: vi.fn(),
  onUnselectItems: vi.fn(),
} as any);
```

**AFTER:**
```typescript
import { mockUseListContextReturn } from "@/tests/utils/typed-mocks";
import { createMockContact } from "@/tests/utils/mock-providers";

vi.mocked(useListContext).mockReturnValue(
  mockUseListContextReturn({
    data: [createMockContact({ id: 1 })],
    total: 1,
    filterValues: { status: "active" },
    sort: { field: "id", order: "ASC" },
    resource: "contacts",
  })
);
```

### Pattern 3: useCreate Mutation

**BEFORE:**
```typescript
const mockCreate = vi.fn();
vi.mocked(useCreate).mockReturnValue([
  mockCreate,
  {
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  },
] as any);
```

**AFTER:**
```typescript
import { mockUseCreateReturn } from "@/tests/utils/typed-mocks";

const mockMutate = vi.fn();
vi.mocked(useCreate).mockReturnValue(
  mockUseCreateReturn({ mutate: mockMutate })
);
```

### Pattern 4: useUpdate Mutation

**BEFORE:**
```typescript
vi.mocked(useUpdate).mockReturnValue([
  vi.fn(),
  { isPending: true, isLoading: true } as any,
] as any);
```

**AFTER:**
```typescript
import { mockUseUpdateReturn } from "@/tests/utils/typed-mocks";

vi.mocked(useUpdate).mockReturnValue(
  mockUseUpdateReturn({ isPending: true })
);
```

### Pattern 5: Entity with Nested Relationships

**BEFORE:**
```typescript
const mockOpportunity = {
  id: 1,
  name: "Test Deal",
  stage: "lead",
  customer_organization_id: 10,
  contact_ids: [1, 2],
  // ... manually type 15 more fields
} as any;
```

**AFTER:**
```typescript
import { createMockOpportunity, createMockOrganization } from "@/tests/utils/mock-providers";

const org = createMockOrganization({ id: 10, name: "Acme Corp" });
const mockOpportunity = createMockOpportunity({
  id: 1,
  name: "Test Deal",
  stage: "lead",
  customer_organization_id: org.id,
  contact_ids: [1, 2],
});
```

### Pattern 6: useRecordContext

**BEFORE:**
```typescript
vi.mocked(useRecordContext).mockReturnValue({
  id: 1,
  first_name: "Test",
} as any);
```

**AFTER:**
```typescript
import { mockUseRecordContextReturn } from "@/tests/utils/typed-mocks";
import { createMockContact } from "@/tests/utils/mock-providers";

vi.mocked(useRecordContext).mockReturnValue(
  mockUseRecordContextReturn(createMockContact({ id: 1, first_name: "Test" }))
);
```

### Pattern 7: Error States

**BEFORE:**
```typescript
vi.mocked(useShowContext).mockReturnValue({
  record: undefined,
  isPending: false,
  error: new Error("Not found"),
} as any);
```

**AFTER:**
```typescript
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ error: new Error("Not found") })
);
```

---

## Files Needing Migration

Based on grep analysis, these files still contain `as any` patterns:

| File | Violations | Priority |
|------|------------|----------|
| `AuthorizationsTab.test.tsx` | 74 | High |
| `CampaignActivityReport.test.tsx` | 38 | High |
| `ActivityRelatedTab.test.tsx` | 17 | Medium |
| `OpportunityShow.test.tsx` | 12 | Medium |
| `useBulkActionsState.test.tsx` | 12 | Medium |
| `OrganizationShow.test.tsx` | 9 | Medium |
| `ContactShow.test.tsx` | ~~8~~ **0** | ✅ Done |
| `PipelineDrillDown.test.tsx` | 8 | Low |
| `OpportunitiesTab.test.tsx` | 7 | Low |

### Migration Priority

1. **High Priority**: Files with >20 violations affecting core components
2. **Medium Priority**: Files with 10-20 violations in feature modules
3. **Low Priority**: Files with <10 violations in utilities/helpers

---

## Verification Checklist

After migrating a file:

- [ ] No `as any` casts remain (`grep "as any" file.test.tsx`)
- [ ] Tests pass (`npx vitest run file.test.tsx`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] IDE shows autocomplete for mock overrides
- [ ] Entity data generated by Faker is realistic

---

## Common Issues During Migration

### Issue: Missing Hook Mock

**Error:** `mockUseXxxReturn is not a function`

**Solution:** Check if the hook mock exists in `typed-mocks.ts`. If not, add it following the existing patterns.

### Issue: Type Mismatch

**Error:** `Type 'number' is not assignable to type 'string | undefined'`

**Solution:** The Zod schema expects a different type. Check `src/atomic-crm/validation/` for the correct type.

### Issue: Missing Required Fields

**Error:** Test fails because entity is missing required fields

**Solution:** Use `createMockXxx()` factory - it auto-generates all required fields with Faker.js.

---

## Next Steps

1. Run `grep -r "as any" src/**/*.test.tsx` to find remaining violations
2. Pick a file from the priority list above
3. Apply migration patterns from this guide
4. Run tests to verify behavior unchanged
5. Submit PR with "test: migrate XxxComponent.test.tsx to typed mocks"
