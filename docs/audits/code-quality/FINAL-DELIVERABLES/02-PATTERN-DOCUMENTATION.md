# Pattern Documentation - Crispy CRM

**Generated:** 2025-12-21
**Source:** 25-Agent Forensic Audit Synthesis
**Purpose:** Document exemplary patterns for team reference and onboarding

---

## Overview

This document captures **verified good patterns** found across the codebase that should be replicated. Patterns are categorized by domain and include concrete file references.

---

## 1. Data Provider Patterns

### ✅ Unified Data Provider (Gold Standard)

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

The single entry point for all database operations. This pattern:
- Centralizes Supabase access
- Provides consistent error handling
- Enables future caching/offline support
- Maintains audit trail capability

```typescript
// CORRECT: All components use dataProvider
const { data } = useGetList('contacts', { pagination, filter });

// WRONG: Direct Supabase access
const { data } = await supabase.from('contacts').select();
```

**Why it matters:** 103+ components correctly use React Admin hooks that route through this provider.

### ✅ Custom Actions via invoke()

**File:** `src/atomic-crm/services/SalesService.ts`

```typescript
// CORRECT: Custom operations through data provider
await dataProvider.invoke('rpc_name', { params });

// WRONG: Direct Supabase RPC
await supabase.rpc('rpc_name', { params });
```

**Agent 24 Verified:** SalesService pattern is compliant with constitution.

---

## 2. Zod Validation Patterns

### ✅ API Boundary Validation

**Files:** `src/atomic-crm/validation/*.ts`

```typescript
// CORRECT: Strict objects at API boundary
export const contactSchema = z.strictObject({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  // All fields have .max() for DoS prevention
});

// WRONG: Loose object allowing extra fields
export const contactSchema = z.object({...});
```

### ✅ Coercion for Form Inputs

**Files:** Various form schemas

```typescript
// CORRECT: Coerce non-string form values
const formSchema = z.object({
  amount: z.coerce.number().min(0),
  date: z.coerce.date(),
  active: z.coerce.boolean(),
});

// WRONG: Expect typed values from forms
const formSchema = z.object({
  amount: z.number(), // Forms send strings!
});
```

### ✅ Enum Allowlists

```typescript
// CORRECT: Allowlist valid values
const statusSchema = z.enum(['active', 'inactive', 'pending']);

// WRONG: Denylist bad values
const statusSchema = z.string().refine(s => !['bad'].includes(s));
```

---

## 3. React Admin Patterns

### ✅ Hook Usage for Data Fetching

**Files:** All feature modules

```typescript
// CORRECT: React Admin hooks
import { useGetList, useGetOne, useUpdate } from 'react-admin';

const { data, isPending } = useGetList('contacts', {
  pagination: { page: 1, perPage: 25 },
  filter: { deleted_at: null },
});

// WRONG: Direct fetch/useEffect
useEffect(() => {
  fetch('/api/contacts').then(...)
}, []);
```

### ✅ List Context Usage

**File:** `src/components/admin/PremiumDatagrid.tsx`

```typescript
// CORRECT: Use list context for filter state
const { filterValues, setFilters, displayedFilters } = useListContext();

// WRONG: Local state for filters
const [filters, setFilters] = useState({});
```

### ✅ Record Context for Current Item

```typescript
// CORRECT: Access current record
const record = useRecordContext<Contact>();

// WRONG: Prop drilling through components
const ContactName = ({ contact }: { contact: Contact }) => ...
```

---

## 4. Form State Patterns

### ✅ Form Mode Configuration

**Files:** All Create/Edit forms

```typescript
// CORRECT: Efficient form mode
const methods = useForm({
  mode: 'onSubmit',  // or 'onBlur'
  // ...
});

// WRONG: Causes re-render storms
const methods = useForm({
  mode: 'onChange',
});
```

### ✅ Isolated Watch Subscriptions

```typescript
// CORRECT: Isolated re-renders
const watchedField = useWatch({ name: 'status' });

// WRONG: Triggers full form re-render
const { watch } = useFormContext();
const watchedField = watch('status');
```

### ✅ Default Values from Schema

```typescript
// CORRECT: Schema-driven defaults
const defaultValues = contactSchema.partial().parse({});

// WRONG: Hardcoded defaults
const defaultValues = { first_name: '', last_name: '' };
```

---

## 5. Component Composition Patterns

### ✅ Error Boundaries at Feature Level

**Files:** `src/atomic-crm/*/index.tsx`

```typescript
// CORRECT: Feature-level error boundary
export const ContactsModule = () => (
  <ErrorBoundary fallback={<ContactsError />}>
    <ContactList />
  </ErrorBoundary>
);
```

### ✅ Loading State Handling

```typescript
// CORRECT: Handle all states
const { data, isPending, error } = useGetList('contacts');

if (isPending) return <LoadingSkeleton />;
if (error) return <ErrorDisplay error={error} />;
if (!data?.length) return <EmptyState />;

return <ContactList data={data} />;
```

### ✅ Semantic Color Usage

**Files:** All UI components

```typescript
// CORRECT: Semantic Tailwind v4 tokens
<div className="text-muted-foreground bg-primary text-destructive" />

// WRONG: Raw color values
<div className="text-gray-500 bg-green-600 text-red-500" />
```

---

## 6. Database Patterns

### ✅ Soft Delete Implementation

**Files:** All tables with `deleted_at`

```sql
-- CORRECT: Soft delete with RLS
CREATE POLICY "Hide deleted records"
ON contacts FOR SELECT
USING (deleted_at IS NULL);

-- Soft delete operation
UPDATE contacts SET deleted_at = NOW() WHERE id = $1;
```

### ✅ Junction Tables for M:M

**File:** `contact_organizations` table

```typescript
// CORRECT: Junction table for many-to-many
// Contact can belong to multiple organizations
await dataProvider.create('contact_organizations', {
  data: { contact_id, organization_id, role }
});

// DEPRECATED: Direct foreign key (removed)
// Contact.company_id - DO NOT USE
```

### ✅ RLS Policy Structure

```sql
-- CORRECT: Comprehensive RLS
CREATE POLICY "tenant_isolation" ON contacts
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);
```

---

## 7. TypeScript Patterns

### ✅ Interface for Object Shapes

```typescript
// CORRECT: Interface for data structures
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

// For unions/intersections, use type
type ContactStatus = 'active' | 'inactive';
type ContactWithOrg = Contact & { organization: Organization };
```

### ✅ Strict Null Checks

```typescript
// CORRECT: Handle nullable explicitly
const email = contact.email ?? 'No email';

// CORRECT: Early return for null
if (!record) return null;

// WRONG: Non-null assertion
const email = contact.email!;
```

---

## 8. Testing Patterns

### ✅ Admin Context Wrapper

**File:** `src/tests/utils/render-admin.tsx`

```typescript
// CORRECT: Use test utility
import { renderWithAdminContext } from '@/tests/utils/render-admin';

test('renders contact list', () => {
  renderWithAdminContext(<ContactList />);
  expect(screen.getByRole('table')).toBeInTheDocument();
});

// WRONG: Missing context providers
render(<ContactList />);
```

### ✅ Semantic Selectors (E2E)

```typescript
// CORRECT: Semantic selectors
await page.getByRole('button', { name: 'Save' }).click();
await page.getByLabel('Email').fill('test@example.com');

// WRONG: CSS selectors
await page.locator('.btn-primary').click();
await page.locator('#email-input').fill('test@example.com');
```

---

## 9. Async Operation Patterns

### ✅ Submission State Management

**File:** `src/atomic-crm/activities/QuickLogForm.tsx`

```typescript
// CORRECT: Full async lifecycle
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await dataProvider.create('activities', { data });
    notify('Activity logged', { type: 'success' });
    onClose();
  } catch (error) {
    notify('Failed to log activity', { type: 'error' });
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### ✅ AbortController for Long Operations

**File:** `src/atomic-crm/contacts/ContactImportDialog.tsx`

```typescript
// CORRECT: Abortable operations
const controller = new AbortController();

useEffect(() => {
  return () => controller.abort();
}, []);

await fetch(url, { signal: controller.signal });
```

### ✅ Cleanup in useEffect

```typescript
// CORRECT: Cleanup subscriptions
useEffect(() => {
  const interval = setInterval(refresh, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## 10. Navigation Patterns

### ✅ Unsaved Changes Guard

**File:** `src/atomic-crm/contacts/ContactCreate.tsx`

```typescript
// CORRECT: Warn before losing data
const handleCancel = useCallback(() => {
  if (isDirty) {
    const confirmed = window.confirm(
      'You have unsaved changes. Are you sure you want to leave?'
    );
    if (!confirmed) return;
  }
  redirect('/contacts');
}, [isDirty, redirect]);
```

### ✅ Slide-Over Pattern

**File:** Feature `*SlideOver.tsx` components

```typescript
// CORRECT: URL-driven slide-over
// URL: /contacts?view=123
const [searchParams] = useSearchParams();
const viewId = searchParams.get('view');

return viewId ? <ContactSlideOver id={viewId} /> : null;
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Correct Approach |
|-------------|---------|------------------|
| Direct Supabase imports | Bypasses centralized logic | Use dataProvider |
| `any` type | Loses type safety | Define proper types |
| `onChange` form mode | Re-render storms | Use `onSubmit`/`onBlur` |
| `watch()` | Full form re-renders | Use `useWatch()` |
| Raw color values | Inconsistent design | Semantic tokens |
| CSS selectors in E2E | Brittle tests | Semantic selectors |
| Empty deps array (when wrong) | Stale closures | Include dependencies |
| Non-null assertions | Runtime errors | Null checks |

---

## File References by Pattern

| Pattern | Example Files |
|---------|--------------|
| Data Provider | `unifiedDataProvider.ts` |
| Zod Validation | `validation/contactSchema.ts`, `activitySchema.ts` |
| List Component | `ContactList.tsx`, `OpportunityList.tsx` |
| Create Form | `ContactCreate.tsx`, `OpportunityCreate.tsx` |
| Edit Form | `ContactEdit.tsx`, `OpportunityEdit.tsx` |
| Slide-Over | `ContactSlideOver.tsx`, `OpportunitySlideOver.tsx` |
| Error Boundary | Feature `index.tsx` files |
| Test Utils | `src/tests/utils/render-admin.tsx` |

---

## Compliance Summary

These patterns align with:
- Engineering Constitution (14 principles)
- React Admin best practices
- TypeScript strict mode
- OWASP security guidelines
- WCAG 2.1 AA accessibility

**Adoption Rate:** ~85% of codebase follows these patterns
