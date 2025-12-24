# Pattern Documentation

**Generated:** 2025-12-24
**Agent:** 25C - Forensic Aggregator (Patterns & Risks)
**Good Patterns Identified:** 15
**Source Reports:** Agents 1, 2, 4, 6, 11, 23

---

## Summary

| Category | Patterns | Best Example |
|----------|----------|--------------|
| Data Layer | 2 | Unified Data Provider |
| Validation | 3 | Zod Boundary Validation |
| Security | 3 | Two-Layer RLS Security |
| React Performance | 3 | React.memo with Custom Comparison |
| Async Operations | 2 | AbortController Pattern |
| Form State | 2 | Schema-Derived Defaults |

---

## Data Layer Patterns

### Pattern: Unified Data Provider
**Source:** Agent 1
**Location:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** All database access flows through a single entry point. Components never import Supabase directly.

**When to Use:** Any database operation (CRUD, RPC calls, storage)

**Architecture:**
```
Component
    ↓ useDataProvider() / useGetList()
unifiedDataProvider
    ↓ wrapMethod() - error logging, metrics
    ↓ validateData() - Zod at API boundary
    ↓ transformData() - field transformations
baseDataProvider (ra-supabase-core)
    ↓
Supabase Client (singleton)
```

**Example:**
```typescript
// ✅ CORRECT: Use React Admin hooks (route through data provider)
import { useGetList, useCreate, useUpdate } from 'react-admin';

const { data: opportunities } = useGetList('opportunities', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: { stage: 'new_lead' },
});

// ✅ CORRECT: Use dataProvider directly for custom operations
import { useDataProvider } from 'react-admin';

const dataProvider = useDataProvider();
const result = await dataProvider.rpc('archive_opportunity_with_relations', {
  opp_id: opportunityId
});

// ❌ NEVER: Import Supabase directly in components
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('opportunities').select(); // VIOLATION
```

**Benefits:**
- Single point for validation, logging, metrics
- Consistent error handling across all data operations
- Easy to add cross-cutting concerns (caching, audit trail)
- Testable via React Admin's mock data provider

**Common Mistakes:**
- Importing Supabase client directly in components
- Bypassing data provider for "quick" queries
- Direct RPC calls without going through `dataProvider.rpc()`

**Exception (Documented):** Auth state in `useCurrentSale.ts:92` - auth is outside data provider scope.

---

### Pattern: Service Layer Decomposition
**Source:** Agent 1
**Location:** `src/atomic-crm/providers/supabase/services/`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Complex data provider operations are decomposed into focused service modules.

**When to Use:** When data provider logic exceeds 100 lines for a single concern.

**Structure:**
```
providers/supabase/
├── unifiedDataProvider.ts     # Main entry point (1,657 lines)
├── services/
│   ├── ValidationService.ts   # Zod validation at boundary
│   ├── TransformService.ts    # Data transformations
│   ├── StorageService.ts      # File operations
│   ├── OpportunitiesService.ts # Opportunity-specific logic
│   ├── ActivitiesService.ts   # Activity log operations
│   ├── JunctionsService.ts    # Junction table operations
│   └── SegmentsService.ts     # Segment get-or-create
├── handlers/                  # Resource-specific handlers
└── wrappers/                  # Cross-cutting wrappers
```

**Benefits:**
- Separation of concerns
- Easier testing of individual services
- Clear ownership of functionality

---

## Validation Patterns

### Pattern: Zod Boundary Validation
**Source:** Agent 2, Agent 11
**Location:** `src/atomic-crm/validation/*.ts`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** All data validation happens at the API boundary (data provider), not in forms.

**When to Use:** All data entering or leaving the system.

**Example:**
```typescript
// ✅ CORRECT: Validation at API boundary (data provider)
// In validation/opportunities.ts
export const opportunitySchema = z.strictObject({
  name: z.string().min(1).max(255),
  principal_organization_id: z.string().uuid(),
  stage: z.enum(['new_lead', 'qualified', 'demo_scheduled', 'closed_won', 'closed_lost']),
  probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.coerce.date().optional(),
});

// In data provider processForDatabase() - validation happens here
async function processForDatabase(resource, data, operation) {
  await validateData(resource, data, operation);  // Zod validation
  const processedData = await transformData(resource, data, operation);
  return processedData;
}

// ❌ WRONG: Validation in form component
const onSubmit = (data) => {
  if (!data.name) throw new Error('Name required'); // Don't do this
  if (data.probability < 0) throw new Error('Invalid'); // Don't do this
};
```

**Benefits:**
- Single source of truth for validation rules
- Forms stay simple (just collect data)
- Consistent error messages
- Type safety via inferred types

**Common Mistakes:**
- Adding validation logic in form components
- Duplicating validation rules between form and API
- Using `z.object()` instead of `z.strictObject()` at boundaries

---

### Pattern: Strict Object for Mass Assignment Prevention
**Source:** Agent 2
**Location:** `src/atomic-crm/validation/*.ts`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Use `z.strictObject()` instead of `z.object()` at API boundaries to prevent mass assignment attacks.

**When to Use:** All schemas used at API boundaries.

**Example:**
```typescript
// ✅ CORRECT: strictObject rejects unknown fields
export const userUpdateSchema = z.strictObject({
  name: z.string().max(100),
  email: z.string().email().max(254),
  role: z.enum(['admin', 'manager', 'rep']),
});

// Attempting to pass unknown fields throws error:
userUpdateSchema.parse({
  name: 'John',
  email: 'john@example.com',
  role: 'rep',
  is_admin: true,  // ❌ REJECTED - unknown field
});

// ❌ WRONG: z.object() allows unknown fields through
const unsafeSchema = z.object({...});
unsafeSchema.parse({ ...data, is_admin: true }); // is_admin passes through!

// ⚠️ DANGEROUS: .passthrough() explicitly allows unknown fields
const veryUnsafeSchema = z.object({...}).passthrough(); // NEVER at boundary
```

**Benefits:**
- Prevents attackers from injecting unexpected fields
- Explicit about what fields are allowed
- Compile-time type safety

**Violations Found:** `task.ts:92`, `distributorAuthorizations.ts:149`, `activityDraftSchema.ts:21`

---

### Pattern: Comprehensive String Constraints
**Source:** Agent 2
**Location:** `src/atomic-crm/validation/constants.ts`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** All string fields have `.max()` constraints to prevent DoS attacks via oversized payloads.

**When to Use:** Every string field in every schema.

**Example:**
```typescript
// ✅ CORRECT: Centralized limits with explicit constraints
// In validation/constants.ts
export const VALIDATION_LIMITS = {
  UUID_LENGTH: 36,
  EMAIL_MAX: 254,
  PHONE_MAX: 30,
  URL_MAX: 2000,
  NAME_MAX: 100,
  SHORT_TEXT_MAX: 255,
  MEDIUM_TEXT_MAX: 1000,
  LONG_TEXT_MAX: 5000,
} as const;

// In schema files
import { VALIDATION_LIMITS } from './constants';

export const contactSchema = z.strictObject({
  first_name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  last_name: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX),
  email: z.string().email().max(VALIDATION_LIMITS.EMAIL_MAX),
  notes: z.string().max(VALIDATION_LIMITS.LONG_TEXT_MAX).optional(),
});

// ❌ WRONG: No length limits (DoS vulnerability)
const unsafeSchema = z.object({
  name: z.string(),  // Could be 1GB string
  description: z.string(),  // Could be 1GB string
});
```

**Benefits:**
- Prevents memory exhaustion attacks
- Consistent limits across the codebase
- Easy to adjust limits globally

---

## Security Patterns

### Pattern: Two-Layer Security (RLS + GRANT)
**Source:** Agent 4, Agent 11
**Location:** `supabase/migrations/`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** PostgreSQL security uses both GRANT statements AND Row Level Security policies together.

**When to Use:** Every table in the database.

**Example:**
```sql
-- ✅ CORRECT: Two-layer security
-- Layer 1: GRANT (table-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunities TO authenticated;

-- Layer 2: RLS (row-level access)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all opportunities"
  ON opportunities FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (sales_id = auth.uid());

-- ❌ WRONG: RLS only (causes permission denied errors)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
-- Missing GRANT = "permission denied for table opportunities"

-- ❌ WRONG: GRANT only (no row-level filtering)
GRANT ALL ON opportunities TO authenticated;
-- Missing RLS = users can see all rows including deleted
```

**Benefits:**
- Defense in depth - two independent security layers
- GRANT controls table access, RLS controls row access
- Soft-delete filtering built into RLS policies

**Key Migrations:**
- `20251029070224_grant_authenticated_permissions.sql` - Base GRANT setup
- `20251108172640_document_rls_security_model.sql` - Security model documentation

---

### Pattern: Soft Delete with RLS Filtering
**Source:** Agent 4
**Location:** `supabase/migrations/`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** All entities use soft delete (`deleted_at` timestamp) with RLS policies automatically filtering deleted records.

**Example:**
```sql
-- ✅ CORRECT: Soft delete at RLS level
CREATE POLICY "View non-deleted opportunities"
  ON opportunities FOR SELECT
  USING (deleted_at IS NULL);

-- Application code just uses normal queries
-- Deleted records are automatically hidden
```

```typescript
// ✅ CORRECT: Data provider uses soft delete
// In unifiedDataProvider.ts
delete: async (resource, params) => {
  // Sets deleted_at instead of hard delete
  await supabase
    .from(resource)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);
}
```

**Benefits:**
- Records never truly lost
- Easy undelete functionality
- Audit trail preserved
- RLS handles filtering automatically

---

### Pattern: Cycle Protection Trigger
**Source:** Agent 22 (referenced in master findings)
**Location:** `supabase/migrations/`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Database trigger prevents self-referential cycles in hierarchical data.

**Example:**
```sql
-- ✅ CORRECT: Prevent organization from being its own parent
CREATE OR REPLACE FUNCTION check_organization_parent_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_org_self_reference
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION check_organization_parent_cycle();
```

**Gap Found:** `contacts.manager_id` lacks this protection (see RISK-005)

---

## React Performance Patterns

### Pattern: React.memo with Custom Comparison
**Source:** Agent 6
**Location:** `src/atomic-crm/opportunities/OpportunityColumn.tsx:92`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** List-rendered components use React.memo with custom comparison functions for optimal performance.

**When to Use:** Components rendered in lists (cards, rows, columns).

**Example:**
```tsx
// ✅ CORRECT: Memoized with custom comparison
interface OpportunityColumnProps {
  stage: string;
  opportunities: Opportunity[];
  onDrop: (id: string, stage: string) => void;
}

export const OpportunityColumn = React.memo(
  function OpportunityColumn({ stage, opportunities, onDrop }: OpportunityColumnProps) {
    return (
      <div className="flex flex-col gap-2">
        {opportunities.map(opp => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    );
  },
  // Custom comparison - only re-render if data actually changed
  (prevProps, nextProps) => {
    return (
      prevProps.stage === nextProps.stage &&
      prevProps.opportunities.length === nextProps.opportunities.length &&
      prevProps.opportunities.every((opp, i) =>
        opp.id === nextProps.opportunities[i]?.id &&
        opp.updated_at === nextProps.opportunities[i]?.updated_at
      )
    );
  }
);

// ❌ WRONG: No memoization on list item
export const OpportunityCard = ({ opportunity }) => {
  // Re-renders on every parent render
};
```

**Already Memoized (18 components):**
- `OrganizationTypeBadge`, `PriorityBadge`, `CompletionCheckbox`
- `OpportunityColumn`, `OpportunityCard`, `TaskKanbanColumn`, `TaskKanbanCard`
- `ActivityItem`, `StageBadgeWithHealth`, `NextTaskBadge`

**Missing Memo (15 components):** See P1-PERF-1 through P1-PERF-15 in fix list

---

### Pattern: Context Value Memoization
**Source:** Agent 6
**Location:** `src/atomic-crm/contexts/`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Context provider values are wrapped in useMemo to prevent cascade re-renders.

**Example:**
```tsx
// ✅ CORRECT: Memoized context value
// FormOptionsContext.tsx:45
export const FormOptionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);

  // useMemo prevents new object on every render
  const value = useMemo(() => ({
    principals,
    distributors,
    setPrincipals,
    setDistributors,
  }), [principals, distributors]);

  return (
    <FormOptionsContext.Provider value={value}>
      {children}
    </FormOptionsContext.Provider>
  );
};

// ❌ WRONG: New object every render
export const BadProvider = ({ children }) => {
  const [state, setState] = useState({});

  // This object is recreated every render, causing all consumers to re-render
  return (
    <Context.Provider value={{ state, setState }}>
      {children}
    </Context.Provider>
  );
};
```

**All Context Providers Properly Memoized:**
- `FormOptionsContext.tsx:45`
- `PipelineConfigContext.tsx:55`
- `AppBrandingContext.tsx:45`
- `TutorialProvider.tsx:256`
- `ConfigurationContext.tsx:106`

---

### Pattern: useWatch Instead of watch
**Source:** Agent 6
**Location:** Form components
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Use `useWatch` from react-hook-form for isolated re-renders instead of `watch` which re-renders the entire form.

**Example:**
```tsx
// ✅ CORRECT: Isolated re-render
const SelectedPrincipalDisplay = () => {
  // Only this component re-renders when principal_id changes
  const principalId = useWatch({ name: 'principal_id' });

  return <PrincipalBadge id={principalId} />;
};

// ❌ WRONG: Re-renders entire form
const BadForm = () => {
  const { watch } = useFormContext();
  // Every keystroke in any field re-renders this entire component
  const principalId = watch('principal_id');

  return (
    <div>
      <ExpensiveComponent />
      <PrincipalBadge id={principalId} />
    </div>
  );
};
```

**Violations Found:** `QuickCreatePopover.tsx:126,150`, `TagDialog.tsx:67`

---

## Async Operation Patterns

### Pattern: AbortController for Cleanup
**Source:** Agent 23
**Location:** `src/atomic-crm/opportunities/components/BulkReassignButton.tsx:47-55`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Long-running operations use AbortController for proper cleanup on unmount.

**When to Use:** Bulk operations, multi-step processes, any async operation that might outlive the component.

**Example:**
```tsx
// ✅ EXEMPLARY: Full cancellation support (BulkReassignButton.tsx:47-55)
const BulkReassignButton = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleExecuteReassign = async () => {
    // Create new controller for this operation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    for (const item of selectedItems) {
      // Check for cancellation before each operation
      if (signal.aborted) {
        console.log('Operation cancelled by user');
        break;
      }

      await processItem(item);
    }
  };

  return (
    <Button onClick={handleExecuteReassign}>
      Reassign Selected
    </Button>
  );
};

// ❌ WRONG: No cleanup
const BadComponent = () => {
  useEffect(() => {
    fetchData().then(setData); // No cancellation possible
  }, [id]);
};
```

**Benefits:**
- Prevents state updates on unmounted components
- User can cancel long operations
- Clean resource management

---

### Pattern: State Machine for Multi-Step Operations
**Source:** Agent 23
**Location:** `src/atomic-crm/imports/ContactImportDialog.tsx`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Complex multi-step async operations use explicit state machines.

**Example:**
```tsx
// ✅ CORRECT: Explicit state machine
type ImportStep = 'upload' | 'preview' | 'mapping' | 'importing' | 'complete' | 'error';

const ContactImportDialog = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [progress, setProgress] = useState(0);

  // beforeunload protection during critical steps
  useEffect(() => {
    if (step === 'importing') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Import in progress. Are you sure?';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [step]);

  const handleStartImport = async () => {
    setStep('importing');
    try {
      await importRecords({ onProgress: setProgress });
      setStep('complete');
    } catch (error) {
      setStep('error');
    }
  };
};
```

**Benefits:**
- Clear operation phases
- Easy to add loading/error states
- beforeunload protection for critical phases
- Predictable UI for each state

---

## Form State Patterns

### Pattern: Schema-Derived Form Defaults
**Source:** Agent 11
**Location:** All create/edit forms
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Form initial values are derived from Zod schemas using `.partial().parse({})`.

**When to Use:** All form components.

**Example:**
```tsx
// ✅ CORRECT: Schema-derived defaults (Constitution Principle #5)
// ContactCreate.tsx:36-40
import { contactBaseSchema } from '@/atomic-crm/validation/contacts';

// Generate defaults from schema truth
// Per Constitution #5: FORM STATE DERIVED FROM TRUTH
const defaultValues = contactBaseSchema.partial().parse({});

const ContactCreate = () => {
  return (
    <CreateBase>
      <SimpleForm defaultValues={defaultValues}>
        {/* Fields here */}
      </SimpleForm>
    </CreateBase>
  );
};

// The schema defines defaults:
export const contactBaseSchema = z.strictObject({
  department: z.enum([...]).default('other'),
  phone: z.array(phoneSchema).default([]),
  email: z.array(emailSchema).default([]),
});

// ❌ WRONG: Hardcoded defaults (can drift from schema)
const BadCreate = () => {
  const defaultValues = {
    department: 'other',
    phone: [],
    email: [],
  };
  // If schema changes, this is now wrong
};
```

**Found 35+ Correct Implementations:**
- `ContactCreate.tsx:40`, `ContactEdit.tsx:37`
- `OpportunityCreate.tsx:36`, `OpportunityEdit.tsx:55`
- `OrganizationCreate.tsx:242`
- `SalesCreate.tsx:21`, `SalesEdit.tsx:42`
- `TaskCreate.tsx`, `TaskEdit.tsx:40`
- `ProductCreate.tsx:18`, `ProductEdit.tsx:40`

---

### Pattern: Unsaved Changes Warning
**Source:** Agent 23
**Location:** `src/atomic-crm/opportunities/OpportunityCreateWizard.tsx`
**Rating:** ⭐⭐⭐⭐⭐

**Description:** Forms track dirty state and warn users before losing unsaved changes.

**Example:**
```tsx
// ✅ CORRECT: Unsaved changes detection
import { useInAppUnsavedChanges } from '@/hooks/useInAppUnsavedChanges';

const OpportunityCreateWizard = () => {
  const { isDirty, setIsDirty, UnsavedChangesDialog } = useInAppUnsavedChanges();

  const handleFieldChange = () => {
    setIsDirty(true);
  };

  return (
    <>
      <Form onChange={handleFieldChange}>
        {/* Form fields */}
      </Form>
      <UnsavedChangesDialog />
    </>
  );
};
```

**Implemented In:**
- `OpportunityCreateWizard.tsx`
- `PersonalSection.tsx`
- `CreateFormFooter.tsx`

**Gap:** All slide-over edit forms lack this protection (see RISK in assessment)

---

## Anti-Patterns to Avoid

### Anti-Pattern: Direct Supabase Import
```typescript
// ❌ NEVER DO THIS
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('opportunities').select();
```
**Fix:** Use `useGetList`, `useDataProvider`, or other React Admin hooks.

### Anti-Pattern: .passthrough() at API Boundary
```typescript
// ❌ SECURITY VULNERABILITY
export const schema = z.object({...}).passthrough();
```
**Fix:** Use `z.strictObject()` instead.

### Anti-Pattern: watch() for Single Field
```typescript
// ❌ PERFORMANCE ISSUE
const value = watch('fieldName'); // Re-renders entire form
```
**Fix:** Use `useWatch({ name: 'fieldName' })`.

### Anti-Pattern: perPage: 10000
```typescript
// ❌ DoS RISK
useGetList('opportunities', { pagination: { perPage: 10000 }});
```
**Fix:** Use reasonable limits (25-100) with pagination.

### Anti-Pattern: Silent Catch Block
```typescript
// ❌ VIOLATES FAIL-FAST
catch (error) {
  console.error(error);
  // Error disappears here
}
```
**Fix:** Rethrow after logging, or notify user explicitly.

### Anti-Pattern: Hardcoded Colors
```tsx
// ❌ VIOLATES DESIGN SYSTEM
<div className="text-gray-500 bg-red-100">
```
**Fix:** Use semantic tokens: `text-muted-foreground`, `bg-destructive/10`.

### Anti-Pattern: Hardcoded Form Defaults
```tsx
// ❌ CAN DRIFT FROM SCHEMA
const defaultValues = { stage: 'new_lead', priority: 'medium' };
```
**Fix:** Use `schema.partial().parse({})`.

---

## Technology Choice Patterns (Excellent - Keep)

| Category | Choice | Why |
|----------|--------|-----|
| Date handling | `date-fns` | Tree-shakable, ~30KB vs moment's 300KB |
| Utilities | `es-toolkit` | Modern lodash alternative, tree-shakable |
| Icons | `lucide-react` | Individual imports, tree-shakable |
| Forms | `react-hook-form` + `zod` | Best-in-class performance |
| State | `@tanstack/react-query` | Excellent caching, deduplication |
| UI primitives | `@radix-ui` | Accessible, unstyled, composable |
| Charts | `chart.js` | Cherry-picked registration |

**No Library Duplication Found** - Clean dependency management.

---

## Adoption Checklist

When creating new components or features, verify:

- [ ] Data access goes through data provider
- [ ] Zod schema uses `z.strictObject()` with `.max()` on strings
- [ ] Form defaults use `schema.partial().parse({})`
- [ ] List items wrapped in `React.memo()`
- [ ] Context values wrapped in `useMemo()`
- [ ] Long operations have AbortController cleanup
- [ ] Edit forms have unsaved changes warning
- [ ] Colors use semantic tokens only
- [ ] No silent catch blocks (rethrow or notify)
- [ ] Form mode is `onBlur` or `onSubmit`, never `onChange`

---

*Pattern documentation compiled by Agent 25C - Forensic Aggregator*
*Generated: 2025-12-24*
*Source: Audit reports from Agents 1, 2, 4, 6, 11, 23*
