# Organization Form Tabs - Implementation Plan

## Prerequisites
- Read: `src/atomic-crm/organizations/OrganizationInputs.tsx`
- Read: `src/components/ui/tabs.tsx`
- Read: `src/components/ui/badge.tsx`
- Read: `src/atomic-crm/validation/organizations.ts`

## Task Execution Order

### Batch 1: Core Implementation (Independent)

#### Task 1: Implement Tabbed Organization Form
**ID:** `org-tabs-implementation`
**Agent:** general-purpose
**Status:** Independent

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationInputs.tsx`

**Implementation Steps:**
1. Add imports at top of file:
   - `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"`
   - `import { Badge } from "@/components/ui/badge"`
   - `import { useFormState } from "react-hook-form"`

2. Define TAB_DEFINITIONS constant (corrected field names):
```typescript
type TabKey = 'general' | 'details' | 'other';

interface TabDefinition {
  key: TabKey;
  label: string;
  fields: string[];
}

const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'logo', 'organization_type', 'description', 'parent_organization_id', 'sales_id']
  },
  {
    key: 'details',
    label: 'Details',
    fields: ['industry_id', 'employee_count', 'priority', 'segment', 'annual_revenue', 'address', 'city', 'postal_code', 'state', 'phone']
  },
  {
    key: 'other',
    label: 'Other',
    fields: ['website', 'linkedin_url', 'context_links']
  }
];
```

3. Add error counting logic to OrganizationInputs component:
```typescript
const { errors } = useFormState();
const errorKeys = Object.keys(errors || {});

const errorCounts: Record<TabKey, number> = {
  general: errorKeys.filter(key => TAB_DEFINITIONS[0].fields.includes(key)).length,
  details: errorKeys.filter(key => TAB_DEFINITIONS[1].fields.includes(key)).length,
  other: errorKeys.filter(key => TAB_DEFINITIONS[2].fields.includes(key)).length
};
```

4. Replace current structure with Tabs:
```tsx
<Tabs defaultValue="general" className="w-full">
  <TabsList>
    <TabsTrigger value="general">
      General
      {errorCounts.general > 0 && (
        <Badge variant="destructive" className="ml-2">
          {errorCounts.general}
        </Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="details">
      Details
      {errorCounts.details > 0 && (
        <Badge variant="destructive" className="ml-2">
          {errorCounts.details}
        </Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="other">
      Other
      {errorCounts.other > 0 && (
        <Badge variant="destructive" className="ml-2">
          {errorCounts.other}
        </Badge>
      )}
    </TabsTrigger>
  </TabsList>

  <TabsContent value="general">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4">
      {/* General tab fields */}
    </div>
  </TabsContent>

  <TabsContent value="details">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4">
      {/* Details tab fields */}
    </div>
  </TabsContent>

  <TabsContent value="other">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4">
      {/* Other tab fields */}
    </div>
  </TabsContent>
</Tabs>
```

5. Map existing input components to tabs:
   - **General tab**: OrganizationDisplayInputs, description field, parent org field, account manager field
   - **Details tab**: Contact info (phone), address fields, context fields (industry, employee count, priority, segment, revenue)
   - **Other tab**: Website, LinkedIn, context_links

6. Run TypeScript check: `npm run build`

**Acceptance Criteria:**
- All 15 fields present and functional
- Error badges appear on tabs with validation errors
- Responsive grid layouts (2-col on lg, 1-col mobile)
- Form state preserved when switching tabs
- No TypeScript compilation errors

---

### Batch 2: Testing (Depends on Batch 1)

#### Task 2: Update Test Suite
**ID:** `org-tabs-tests`
**Agent:** general-purpose
**Status:** Dependent on `org-tabs-implementation`

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationList.spec.tsx`

**Implementation Steps:**
1. Add tab navigation test:
```typescript
it('should navigate between form tabs', async () => {
  // Test implementation
});
```

2. Add validation badge test:
```typescript
it('should show error count badges on tabs', async () => {
  // Test implementation
});
```

3. Verify all existing tests still pass
4. Run test suite: `npm test`

**Acceptance Criteria:**
- New tab tests pass
- All existing organization tests pass
- Test coverage maintained

---

## Completion Criteria
- All tasks complete
- TypeScript compilation succeeds
- All tests pass
- Form functional in both Edit and Create modes
