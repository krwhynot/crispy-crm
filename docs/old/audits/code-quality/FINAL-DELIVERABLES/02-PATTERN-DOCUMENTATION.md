# Pattern Documentation - Baseline Patterns Reference

**Agent:** 25 - Forensic Aggregator
**Date:** 2025-12-21
**Source Reports:** Agent 10 (Module Structure), Agent 17 (Pattern Drift)
**Last Verified:** 2025-12-21 ✅

---

## Purpose

This document establishes the **canonical patterns** for Crispy CRM development, extracted from the forensic audit findings. Use these as the single source of truth for new feature development and code reviews.

---

## 1. Module Structure Pattern

### Directory Layout

```
src/atomic-crm/[feature]/
├── index.tsx           # Re-exports from resource.tsx
├── resource.tsx        # React Admin config with lazy loading + error boundaries
├── [Feature]List.tsx   # List view with filtering
├── [Feature]Show.tsx   # Detail view (or SlideOver pattern)
├── [Feature]Edit.tsx   # Edit form using EditBase + Form
├── [Feature]Create.tsx # Create form using CreateBase + Form
├── [Feature]Inputs.tsx # Shared form inputs for Create/Edit
├── [Feature]SlideOver.tsx # 40vw right panel (URL: ?view=123)
├── slideOverTabs/      # Tab components for SlideOver
│   ├── DetailsTab.tsx
│   └── ActivityTab.tsx
├── components/         # Feature-specific UI components
├── hooks/              # Feature-specific hooks
├── utils/              # Feature-specific utilities
└── __tests__/          # Unit tests
```

### Compliance Score: 65%

**Compliant Modules:** contacts, tasks, opportunities
**Partial Compliance:** organizations (missing resource.tsx), activities (missing Edit/Inputs)

---

## 2. List Component Pattern

**Baseline:** `src/atomic-crm/contacts/ContactList.tsx`

### Required Elements

```typescript
export const FeatureList = () => {
  // 1. Identity check with skeleton
  const { isPending } = useGetIdentity();
  if (isPending) return <ListSkeleton />;

  // 2. Slide-over integration
  const { recordId, isOpen, openSlideOver, closeSlideOver } = useSlideOverState();

  // 3. Keyboard navigation
  const { focusedIndex, handleKeyDown } = useListKeyboardNavigation();

  // 4. Filter cleanup
  useFilterCleanup("feature");

  return (
    // 5. List wrapper with title=false
    <List title={false} actions={<ListActions />} exporter={exporter}>
      {/* 6. Standard layout with filter component */}
      <StandardListLayout resource="feature" filterComponent={<FeatureFilter />}>
        {/* 7. Search bar with filter config */}
        <ListSearchBar filterConfig={FILTER_CONFIG} />
        
        {/* 8. Premium Datagrid with row click */}
        <PremiumDatagrid onRowClick={openSlideOver} focusedIndex={focusedIndex}>
          {/* Columns... */}
        </PremiumDatagrid>
        
        {/* 9. Bulk actions toolbar */}
        <BulkActionsToolbar />
      </StandardListLayout>
      
      {/* 10. Slide-over component */}
      <FeatureSlideOver recordId={recordId} isOpen={isOpen} onClose={closeSlideOver} />
      
      {/* 11. Tutorial trigger */}
      <PageTutorialTrigger chapter="feature" />
    </List>
  );
};

export default FeatureList;
```

### Deviation Handling

| Deviation | Acceptable? | Notes |
|-----------|-------------|-------|
| Multiple view modes | ✅ Yes | Opportunities has kanban/list/campaign/principal |
| No slide-over | ⚠️ Justify | Activities uses inline editing |
| Custom empty state | ✅ Yes | Preferred over generic |

---

## 3. Create Form Pattern

**Baseline:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`

### Required Elements

```typescript
export const FeatureCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  
  // Schema-derived defaults (CONSTITUTION PRINCIPLE #4)
  const defaultValues = useMemo(
    () => featureCreateSchema.partial().parse({}),
    []
  );
  
  return (
    // 1. CreateBase with redirect
    <CreateBase redirect="show">
      {/* 2. Layout wrapper */}
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          {/* 3. Progress tracking */}
          <FormProgressProvider>
            <FormProgressBar />
            
            {/* 4. Form with schema defaults + onBlur mode */}
            <Form 
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={zodResolver(featureCreateSchema)}
            >
              {/* 5. Error summary */}
              <FormErrorSummary errors={errors} />
              
              {/* 6. Shared inputs component */}
              <FeatureInputs mode="create" />
              
              {/* 7. Form toolbar */}
              <FormToolbar>
                <CancelButton />
                <SaveButton />
              </FormToolbar>
            </Form>
            
            {/* 8. Tutorial */}
            <FeatureFormTutorial />
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
};

export default FeatureCreate;
```

### Key Principles

| Principle | Pattern | Violation |
|-----------|---------|-----------|
| Schema defaults | `schema.partial().parse({})` | `{}` or hardcoded object |
| Form mode | `mode="onBlur"` | `mode="onChange"` (causes re-render storms) |
| Watching | `useWatch()` | `watch()` (causes re-renders) |
| Validation | Zod at API boundary | Form-level validation |

---

## 4. Edit Form Pattern

**Baseline:** `src/atomic-crm/opportunities/OpportunityEdit.tsx`

### Required Elements

```typescript
export const FeatureEdit = () => {
  const queryClient = useQueryClient();
  
  const handleSuccess = useCallback(() => {
    // Cache invalidation
    queryClient.invalidateQueries({ queryKey: ["feature"] });
  }, [queryClient]);
  
  return (
    // 1. EditBase with actions=false, pessimistic mode
    <EditBase 
      actions={false} 
      redirect="show" 
      mutationMode="pessimistic"
      mutationOptions={{ onSuccess: handleSuccess }}
    >
      <FeatureEditForm />
    </EditBase>
  );
};

// Separate component for record context
const FeatureEditForm = () => {
  // 2. Record context access
  const record = useRecordContext<Feature>();
  
  // 3. Guard clause
  if (!record) return null;
  
  // 4. Schema-derived defaults from record
  const defaultValues = useMemo(
    () => featureUpdateSchema.partial().parse(record),
    [record]
  );
  
  return (
    // 5. Form with key for remount on record change
    <Form defaultValues={defaultValues} key={record.id}>
      <Card>
        <CardContent>
          <FeatureInputs mode="edit" />
        </CardContent>
      </Card>
      
      {/* 6. Toolbar with delete, cancel, save */}
      <Toolbar>
        <DeleteButton />
        <CancelButton />
        <SaveButton />
      </Toolbar>
    </Form>
  );
};

export default FeatureEdit;
```

### Violations Found (P1-3) ✅ ALL FIXED 2025-12-21

| Form | Issue | Status |
|------|-------|--------|
| ContactEdit | Missing `key={record.id}` | ✅ Fixed |
| OrganizationEdit | Uses `defaultValues={record}` instead of schema.parse(record) | ✅ Fixed |
| TaskEdit | Uses `Edit` + `SimpleForm` instead of `EditBase` + `Form` | ✅ Fixed |
| ProductEdit | Missing schema.partial().parse(record) | ✅ Fixed |
| SalesEdit | Missing schema.partial().parse(record) | ✅ Fixed |
| OpportunityEdit | Missing schema.partial().parse(record) | ✅ Fixed |

> All 6 Edit forms now use `useMemo(() => schema.partial().parse(record), [record])` with `key={record.id}` for proper remounting.

---

## 5. Data Fetching Pattern

### Standard Pattern: React Admin Hooks

```typescript
// List fetching
const { data, isLoading, error } = useGetList("resource", {
  pagination: { page: 1, perPage: 25 },
  filter: { status: "active" },
  sort: { field: "created_at", order: "DESC" }
});

// Single record
const { data: record } = useGetOne("resource", { id });

// Mutations
const [create] = useCreate();
const [update] = useUpdate();
const [deleteOne] = useDelete();
```

### Anti-Patterns (AVOID)

```typescript
// ❌ Direct useMutation from @tanstack/react-query for CRUD
const mutation = useMutation({ mutationFn: ... });

// ❌ Direct useQuery for standard CRUD
const { data } = useQuery({ queryKey: [...], queryFn: ... });

// ❌ Direct Supabase access in components
const { data } = await supabase.from("table").select();
```

### Allowed Exceptions

| Pattern | Context | Justification |
|---------|---------|---------------|
| `supabase.auth.getUser()` | authProvider.ts | Auth precedes data provider |
| `supabase.storage.*` | unifiedDataProvider.ts | Binary ops differ from table queries |
| Custom RPC calls | Via dataProvider.invoke() | Edge functions |

---

## 6. Error Handling Pattern

### Standard Pattern

```typescript
const handleSave = async () => {
  try {
    await dataProvider.create("resource", { data });
    notify("Created successfully", { type: "success" });
  } catch (error) {
    // Log for debugging
    console.error("Create failed:", error);
    // Notify user
    notify(error.message || "Operation failed", { type: "error" });
  }
};
```

### Anti-Patterns (AVOID)

```typescript
// ❌ Empty catch block
try { ... } catch (e) { }

// ❌ Console.error without notify
try { ... } catch (e) { console.error(e); }

// ❌ Silent failure
try { ... } catch (e) { return null; }
```

### Bulk Operations Exception

```typescript
// ✅ Promise.allSettled is ALLOWED for bulk operations
const results = await Promise.allSettled(items.map(processItem));
const failures = results.filter(r => r.status === "rejected");

if (failures.length > 0) {
  notify(`${items.length - failures.length} succeeded, ${failures.length} failed`, {
    type: "warning"
  });
}
```

---

## 7. Component Naming Conventions

### File Names

| Type | Pattern | Example |
|------|---------|---------|
| List | `[Feature]List.tsx` | `ContactList.tsx` |
| Create | `[Feature]Create.tsx` | `ContactCreate.tsx` |
| Edit | `[Feature]Edit.tsx` | `ContactEdit.tsx` |
| Show | `[Feature]Show.tsx` | `ContactShow.tsx` |
| Inputs | `[Feature]Inputs.tsx` | `ContactInputs.tsx` |
| SlideOver | `[Feature]SlideOver.tsx` | `ContactSlideOver.tsx` |

### Export Names

```typescript
// ✅ Named export matches file name
export const ContactList = () => { ... };

// ✅ Default export for lazy loading
export default ContactList;
```

### Directory Names

```
✅ src/atomic-crm/contacts/     # lowercase plural
✅ src/atomic-crm/opportunities/
❌ src/atomic-crm/Contact/      # Don't use PascalCase
❌ src/atomic-crm/contact/      # Don't use singular
```

---

## 8. Validation Pattern

### API Boundary Validation

```typescript
// src/atomic-crm/validation/[feature].ts

export const featureCreateSchema = z.strictObject({
  // Required fields
  name: z.string().trim().min(1, "Required").max(255),

  // Optional fields with coercion
  amount: z.coerce.number().optional(),
  due_date: z.coerce.date().optional(),

  // Enum constraints
  status: z.enum(["draft", "active", "closed"]),

  // Array with limits
  tags: z.array(z.string().max(50)).max(20),

  // HTML sanitization for rich text
  description: z.string().max(5000).transform(sanitizeHtml).optional(),
});

export const featureUpdateSchema = featureCreateSchema.partial();
```

### JSON.parse Validation (P1-1) ✅ ADDED 2025-12-21

**ALWAYS** use `safeJsonParse()` when parsing untrusted data (localStorage, sessionStorage, URL params):

```typescript
import { safeJsonParse } from "@/atomic-crm/utils/safeJsonParse";

// Define schema for the expected data
const preferencesSchema = z.strictObject({
  columns: z.array(z.string()).max(50),
  savedAt: z.number().int().positive(),
});

// ✅ CORRECT - Uses safeJsonParse with Zod validation
const stored = localStorage.getItem("preferences");
const prefs = safeJsonParse(stored, preferencesSchema) ?? defaultPreferences;

// ❌ WRONG - Raw JSON.parse is vulnerable to type confusion attacks
const prefs = JSON.parse(stored);
```

**Files using this pattern:** 11 locations now secured (see P1-1 fix list)

### Key Rules

| Rule | Pattern | Why |
|------|---------|-----|
| strictObject | `z.strictObject({...})` | Prevents mass assignment |
| Coercion | `z.coerce.date()` | Form inputs are strings |
| Max length | `.max(255)` | DoS prevention |
| Trim | `.trim().min(1)` | Reject whitespace-only |
| Enum allowlist | `z.enum([...])` | Never denylist |
| safeJsonParse | `safeJsonParse(json, schema)` | Defense-in-depth for storage |

---

## 9. Styling Pattern

### Semantic Colors Only

```typescript
// ✅ CORRECT - Semantic tokens
className="text-muted-foreground"
className="bg-primary"
className="text-destructive"
className="border-border"

// ❌ WRONG - Raw colors
className="text-gray-500"
className="bg-green-600"
className="text-red-500"
className="#ff0000"
```

### Touch Targets

```typescript
// ✅ CORRECT - 44px minimum
className="h-11 w-11"  // 44px
className="min-h-11"

// ❌ WRONG - Too small for touch
className="h-8 w-8"    // 32px
className="h-6 w-6"    // 24px
```

---

## 10. Import Organization Pattern

### Order

```typescript
// 1. React core
import { useState, useCallback, useMemo } from "react";

// 2. External libraries
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// 3. React Admin
import { useNotify, useRedirect, useRecordContext } from "react-admin";

// 4. Internal components (absolute imports)
import { Button } from "@/components/ui/button";
import { Form, FormControl } from "@/components/admin/form";

// 5. Feature-local imports (relative)
import { featureSchema } from "./validation";
import { FeatureInputs } from "./FeatureInputs";

// 6. Types (last)
import type { Feature } from "@/types";
```

---

## Pattern Compliance Checklist

Use this checklist for code reviews:

### List Component
- [ ] Uses `useGetIdentity()` with loading state
- [ ] Uses `useSlideOverState()` for slide-over
- [ ] Uses `useListKeyboardNavigation()` for a11y
- [ ] Has `StandardListLayout` wrapper
- [ ] Has `PageTutorialTrigger`

### Create Form
- [ ] Uses `CreateBase` wrapper
- [ ] Uses `schema.partial().parse({})` for defaults
- [ ] Uses `mode="onBlur"` on Form
- [ ] Has `FormProgressProvider` + `FormProgressBar`
- [ ] Has `FormErrorSummary`

### Edit Form
- [ ] Uses `EditBase` with `actions={false}`
- [ ] Uses `mutationMode="pessimistic"`
- [ ] Has `key={record.id}` on Form
- [ ] Uses `schema.partial().parse(record)` for defaults
- [ ] Has cache invalidation on success

### Validation
- [ ] Uses `z.strictObject()` at API boundary
- [ ] All strings have `.max()` constraint
- [ ] Required strings use `.trim().min(1)`
- [ ] Form inputs use `z.coerce` for non-strings
- [ ] localStorage/sessionStorage uses `safeJsonParse()` with schema
- [ ] URL params parsed with Zod validation

---

## Recent Updates

| Date | Section | Change |
|------|---------|--------|
| 2025-12-21 | §4 Edit Form | P1-3: All 6 Edit forms now fixed |
| 2025-12-21 | §8 Validation | P1-1: Added safeJsonParse pattern |
| 2025-12-21 | Checklist | Added localStorage/URL validation items |

---

*Generated by Agent 25 - Forensic Aggregator*
*Source: Agent 10 (Module Structure), Agent 17 (Pattern Drift)*
*Updated: 2025-12-21 with P1-1, P1-2, P1-3 fixes*
