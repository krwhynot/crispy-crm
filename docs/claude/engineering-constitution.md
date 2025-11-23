# Engineering Constitution

Core principles to prevent debates and ensure consistency across the Atomic CRM codebase. These rules override default patterns when there's ambiguity.

## 1. NO OVER-ENGINEERING

**Rule:** No circuit breakers, health monitoring, or backward compatibility. Fail fast.

**Rationale:** Pre-launch phase prioritizes velocity over resilience. Complex error handling adds maintenance burden without users to benefit. When failures occur, we want loud, immediate signals—not silent degradation.

**Examples:**
- ✅ `throw new Error('Invalid user ID')`
- ❌ Complex retry logic with exponential backoff
- ✅ Simple validation that crashes on bad input
- ❌ Graceful fallbacks for edge cases

**Anti-Pattern:**
```typescript
// DON'T: Over-engineered error handling
try {
  await fetchData()
} catch (error) {
  if (retries < MAX_RETRIES) {
    await sleep(exponentialBackoff(retries))
    return retry()
  }
  logToMonitoring(error)
  return fallbackData
}

// DO: Fail fast
const data = await fetchData() // Let it throw
```

## 2. SINGLE COMPOSABLE ENTRY POINT

**Rule:** Have a single, composable entry point for data access, but delegate the implementation to resource-specific modules.

**Rationale:** A unified data provider maintains simplicity at the consumption layer, but complex systems need resource-specific logic. The **Composite pattern** solves this: one facade (`unifiedDataProvider`) that delegates to specialized providers per resource. This prevents the "god object" anti-pattern while maintaining a clean API surface. Data truth remains centralized (Supabase), validation truth remains centralized (Zod), but access patterns can be modular.

**Architecture:**
- **Data Source:** Supabase (PostgreSQL) as authoritative truth
- **Validation:** Zod schemas in `src/atomic-crm/validation/` (one schema per resource)
- **Entry Point:** `unifiedDataProvider.ts` - single facade for all data access
- **Delegation:** Resource-specific providers handle specialized logic

**Pattern:**
```typescript
// unifiedDataProvider.ts - Single entry point, delegates to resource modules
const resourceProviders = {
  contacts: contactsProvider,
  opportunities: opportunitiesProvider,
  tasks: tasksProvider,
};

export const dataProvider = {
  getList: (resource, params) =>
    resourceProviders[resource]?.getList(params) ?? defaultProvider.getList(resource, params),
  // ... other methods delegate similarly
};
```

**Anti-Pattern:**
```typescript
// DON'T: Multiple competing entry points
import { contactsApi } from './contactsApi'  // Direct API calls
import { dataProvider } from './dataProvider' // React Admin provider
await contactsApi.updateContact(id, data)    // Which is authoritative?

// DO: Single entry point with delegation
import { dataProvider } from '@/atomic-crm/providers/supabase/unifiedDataProvider'
await dataProvider.update('contacts', { id, data })  // Always use unified provider
// The provider internally delegates to contacts-specific logic
```

**Key Distinction:** "Single source of truth" for *data* (Supabase) and *validation* (Zod) remains unchanged. This principle adds structure for how code *accesses* that truth—through one composable facade.

## 3. BOY SCOUT RULE

**Rule:** Fix inconsistencies when editing files.

**Rationale:** Technical debt accumulates from "I'll fix that later" mindset. If you're already in a file, the marginal cost of fixing nearby issues is low. This compounds into codebase health over time.

**Examples:**
- See unused import? Delete it.
- See inconsistent naming? Refactor it.
- See missing type annotation? Add it.
- See hardcoded value? Extract to constant.

**Scope:** Only fix issues in files you're actively editing. Don't go on tangential refactoring sprees.

## 4. VALIDATION

**Rule:** Zod schemas at API boundary only (`src/atomic-crm/validation/`).

**Rationale:** Validating at the API boundary (where external data enters) prevents invalid data from ever reaching business logic. This eliminates defensive programming throughout the app.

**Location:** `src/atomic-crm/validation/`

**Pattern:**
```typescript
// src/atomic-crm/validation/contacts.ts
export const contactCreateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  // ...
})

// Usage in component
const form = useForm({
  resolver: zodResolver(contactCreateSchema)
})
```

**Anti-Pattern:**
```typescript
// DON'T: Manual validation scattered everywhere
if (!data.email || !data.email.includes('@')) {
  throw new Error('Invalid email')
}
```

## 5. FORM STATE DERIVED FROM TRUTH

**Rule:** React Hook Form `defaultValues` MUST be generated from Zod schema.

**Implementation:**
```typescript
// ✅ Extract defaults from Zod schema
import { opportunityCreateSchema } from '@/atomic-crm/validation/opportunities'

const schemaDefaults = opportunityCreateSchema.partial().parse({})
const defaultValues = {
  ...schemaDefaults,
  user_id: identity.id, // Runtime values merged
}

const form = useForm({
  resolver: zodResolver(opportunityCreateSchema),
  defaultValues,
})
```

**Rationale:**
- **Prevents drift:** UI and validation always agree on what's "default"
- **Single source of truth:** Zod schema defines defaults via `.default()` method
- **Ensures valid initial state:** Forms never start in invalid state

**Defining Defaults in Schema:**
```typescript
// src/atomic-crm/validation/opportunities.ts
export const opportunityCreateSchema = z.object({
  stage: z.string().default('new_lead'), // ✅ Default defined here
  amount: z.number().default(0),
  name: z.string(), // No default = required field
})
```

**Anti-Pattern:**
```typescript
// ❌ DON'T: Hardcode defaults in component
const form = useForm({
  defaultValues: {
    stage: 'new_lead', // Now out of sync with schema!
  }
})

// ❌ DON'T: Use defaultValue prop on inputs
<input defaultValue="new_lead" /> // React Hook Form ignores this!
```

**Reference Implementation:**
- [`OpportunityCreate.tsx`](../../src/atomic-crm/opportunities/OpportunityCreate.tsx)
- [`opportunities.ts`](../../src/atomic-crm/validation/opportunities.ts) validation schema

## 6. TYPESCRIPT

**Rule:** `interface` for objects/classes, `type` for unions/intersections.

**Rationale:** Convention improves readability. Seeing `interface` signals "object shape", seeing `type` signals "union or complex type".

**Examples:**
```typescript
// ✅ Interfaces for object shapes
interface Contact {
  id: string
  first_name: string
  last_name: string
}

// ✅ Types for unions
type ContactStatus = 'active' | 'inactive' | 'archived'

// ✅ Types for intersections
type ContactWithMetadata = Contact & { created_at: string }
```

**When interfaces can extend:**
```typescript
interface BaseEntity {
  id: string
  created_at: string
}

interface Contact extends BaseEntity {
  first_name: string
}
```

## 7. FORMS

**Rule:** Always use admin layer (`src/components/admin/`) for validation/errors.

**Rationale:** React Admin provides built-in validation feedback, error boundaries, and form state management. Using raw form components bypasses these features, leading to inconsistent UX.

**Examples:**
- ✅ `<TextInput>` from react-admin
- ✅ `<SelectInput>` from react-admin
- ❌ `<input>` from HTML
- ❌ Custom form components that don't integrate with React Admin

**Where to find admin components:**
- `src/components/admin/` - Customized React Admin components
- `react-admin` package - Standard components

## 8. COLORS

**Rule:** Semantic CSS variables only (--primary, --brand-700, --destructive). Never use hex codes or direct OKLCH values in components.

**Rationale:**
- **Theme switching:** Semantic variables automatically update for light/dark mode
- **Brand consistency:** Changing --primary updates entire app
- **Design system enforcement:** Prevents random colors sneaking in

**Allowed:**
```css
/* ✅ Semantic tokens */
color: var(--primary);
background: var(--brand-700);
border: 1px solid var(--destructive);
```

**Forbidden:**
```css
/* ❌ Hex codes */
color: #7CB342;

/* ❌ Direct OKLCH */
color: oklch(65% 0.15 125);

/* ❌ Tailwind arbitrary values */
className="bg-[#7CB342]"
```

**Validation:**
```bash
npm run validate:colors
```

**Complete color system:** See [Color System Documentation](../internal-docs/color-theming-architecture.docs.md)

## 9. MIGRATIONS

**Rule:** Timestamp format YYYYMMDDHHMMSS (e.g., `20250126000000_migration_name.sql`).

**Rationale:**
- **Chronological ordering:** Sorts correctly in file systems and `ls` output
- **Conflict prevention:** Timestamp uniqueness prevents merge conflicts
- **Supabase convention:** Matches Supabase CLI's default format

**Example:**
```bash
# ✅ Correct format
20250126143000_add_contact_tags.sql

# ❌ Incorrect formats
001_add_contact_tags.sql           # Sequential numbering
add_contact_tags.sql               # No ordering
2025-01-26-add-contact-tags.sql    # Wrong timestamp format
```

**Creating migrations:**
```bash
npx supabase migration new add_contact_tags
# Generates: supabase/migrations/20250126143000_add_contact_tags.sql
```

---

## Summary

These principles are **non-negotiable** to maintain codebase health:

1. **KISS principle:** Simple solutions over clever ones
2. **Composable access:** Single entry point delegating to resource-specific modules
3. **Progressive improvement:** Leave code better than you found it
4. **Boundary validation:** Validate once at entry points
5. **Schema-driven forms:** Derive UI state from validation schemas
6. **Type clarity:** Interfaces for objects, types for unions
7. **Admin integration:** Use React Admin's form components
8. **Semantic colors:** CSS variables, never raw values
9. **Migration ordering:** Timestamp-based naming

**When in doubt:** Favor simplicity, consistency, and composable access through unified entry points.
