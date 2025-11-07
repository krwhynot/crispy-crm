# TypeScript Types from Database Schema

**Created:** 2025-11-07
**Status:** Planned - Not Yet Implemented
**Priority:** High - Prevents Schema Drift Bugs

---

## Problem Statement

During dashboard widgets implementation, we discovered schema drift issues where widget components used incorrect column names (`assigned_to` instead of `sales_id`, `sales_id` in activities instead of `created_by`). These mismatches caused runtime errors that should have been caught at compile time.

**Root Cause:** Manual TypeScript interfaces don't stay in sync with database schema changes.

---

## Solution: Generate Types from Supabase Schema

Use the Supabase CLI to automatically generate TypeScript types directly from the production database schema, ensuring compile-time type safety across the entire data layer.

### Benefits

1. **Compile-Time Safety**: Type mismatches become TypeScript errors instead of runtime API failures
2. **Autocomplete**: IDEs provide accurate field suggestions based on actual schema
3. **Self-Documenting**: Types serve as documentation for available fields and their types
4. **Schema Evolution**: Running the generator after migrations ensures types stay current

---

## Implementation Steps

### 1. Generate Base Types

```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.types.ts
```

This creates a complete type definition file mapping all Supabase tables, views, and RPC functions.

### 2. Update Widget Components

**Before (Manual Interface):**
```typescript
// src/atomic-crm/dashboard/MyTasksThisWeek.tsx

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  assigned_to: number; // ❌ Wrong column name!
  opportunity_id?: number;
}

const { data: tasks } = useGetList<Task>('tasks', {
  filter: {
    assigned_to: identity?.id, // ❌ Runtime error
    completed: false,
  }
});
```

**After (Generated Types):**
```typescript
// src/atomic-crm/dashboard/MyTasksThisWeek.tsx

import { Database } from "@/types/database.types";

type Task = Database['public']['Tables']['tasks']['Row'];

const { data: tasks } = useGetList<Task>('tasks', {
  filter: {
    sales_id: identity?.id, // ✅ TypeScript enforces correct field
    // assigned_to: identity?.id, // ✅ Compile error if uncommented
    completed: false,
  }
});
```

### 3. Add Type Generation to Workflow

Add a script to `package.json`:

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.types.ts",
    "types:check": "tsc --noEmit"
  }
}
```

**Workflow:**
1. After running migrations: `npm run types:generate`
2. Before committing: `npm run types:check`
3. CI/CD: Add `npm run types:check` to test pipeline

---

## Migration Strategy

### Phase 1: Widget Components (Quick Win)

Convert all 3 dashboard widgets to use generated types:
- ✅ `MyTasksThisWeek.tsx` - Remove manual `Task` interface
- ✅ `RecentActivityFeed.tsx` - Remove manual `Activity` interface
- ✅ `UpcomingEventsByPrincipal.tsx` - Remove manual interfaces

**Estimated Time:** 30 minutes

### Phase 2: All Resource Components

Systematically convert all resource modules:
- `src/atomic-crm/contacts/` - Use `Database['public']['Tables']['contacts']['Row']`
- `src/atomic-crm/organizations/` - Use generated org types
- `src/atomic-crm/opportunities/` - Use generated opportunity types
- `src/atomic-crm/tasks/` - Use generated task types
- `src/atomic-crm/activities/` - Use generated activity types

**Estimated Time:** 2-3 hours

### Phase 3: Validation Schemas

Update Zod validation schemas to derive from generated types:

```typescript
// src/atomic-crm/validation/tasks.ts

import { Database } from "@/types/database.types";
import { z } from "zod";

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Zod schema aligned with database schema
export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().date().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  sales_id: z.number().int(),
  opportunity_id: z.number().int().optional(),
}) satisfies z.ZodType<Partial<TaskInsert>>;
```

**Estimated Time:** 3-4 hours

---

## Testing Strategy

### 1. Verify Type Safety

Create a test file that intentionally uses wrong field names:

```typescript
// src/types/__tests__/database-types.test.ts

import { Database } from "@/types/database.types";

type Task = Database['public']['Tables']['tasks']['Row'];

const task: Task = {
  id: 1,
  title: "Test",
  assigned_to: 123, // ❌ Should cause compile error
  sales_id: 123,    // ✅ Should be valid
};
```

Run `npm run types:check` - should fail on line with `assigned_to`.

### 2. Runtime Verification

After converting components, run E2E tests to confirm no runtime errors:

```bash
npm run test:e2e -- dashboard-widgets.spec.ts
```

All tests should pass with no console errors about invalid filter fields.

---

## Edge Cases & Considerations

### 1. JSONB Fields

Generated types for JSONB fields default to `Json` type (from Supabase):

```typescript
type Contact = Database['public']['Tables']['contacts']['Row'];
// contact.email: Json  (not ideal - should be EmailAndType[])
```

**Solution:** Create custom type overlays:

```typescript
// src/types/custom-types.ts

import { Database } from "./database.types";

export interface EmailAndType {
  email: string;
  type: "Work" | "Home";
}

export type Contact = Omit<Database['public']['Tables']['contacts']['Row'], 'email'> & {
  email: EmailAndType[];
};
```

### 2. Views vs Tables

Dashboard widgets use `dashboard_principal_summary` view, not a table:

```typescript
type PrincipalSummary = Database['public']['Views']['dashboard_principal_summary']['Row'];
```

Verify generated types include all views.

### 3. Enum Types

Database enums should be exported as TypeScript union types:

```typescript
// Generated automatically
type Priority = Database['public']['Enums']['priority_level']; // 'high' | 'medium' | 'low'
type TaskType = Database['public']['Enums']['task_type'];
type ActivityType = Database['public']['Enums']['activity_type'];
```

Use these instead of hardcoding string literals.

---

## Success Criteria

✅ **Zero Manual Interfaces**: All data types come from generated file
✅ **Compile-Time Validation**: Wrong field names cause TypeScript errors
✅ **No Filter Warnings**: `filterRegistry.ts` matches actual database columns
✅ **E2E Tests Pass**: No runtime schema mismatch errors
✅ **Developer Experience**: Autocomplete works for all database fields

---

## Related Files

- `src/types/database.types.ts` - Generated types file (to be created)
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx` - Example conversion target
- `src/atomic-crm/providers/supabase/filterRegistry.ts` - Should derive from types
- `src/atomic-crm/validation/tasks.ts` - Validation schemas to align

---

## Next Steps

1. **Generate Initial Types**: Run Supabase CLI to create `database.types.ts`
2. **Convert Dashboard Widgets**: Quick proof-of-concept (Phase 1)
3. **Verify Improvement**: Check that mismatches cause compile errors
4. **Rollout to All Resources**: Systematic conversion (Phase 2-3)
5. **Update Documentation**: Add types generation to development workflow docs

---

**Implementation Priority:** High
**Estimated Total Time:** 6-8 hours
**Risk Level:** Low (purely additive, doesn't break existing code)
**Impact:** High (eliminates entire class of schema drift bugs)

---

**Recommendation from Zen AI Review (2025-11-07):**
> "This is the most impactful technical improvement you can make. It hardens your application against a common and frustrating class of bugs."
