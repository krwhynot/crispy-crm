# Data Model: Tasks Module

**Created:** 2025-11-05
**Status:** Migration Required
**Complexity:** Low (add 4 columns)

---

## Current Schema

```sql
CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" bigint NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "due_date" date,
    "reminder_date" date,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "priority" public.priority_level DEFAULT 'medium'::public.priority_level,
    "contact_id" bigint,
    "opportunity_id" bigint,
    "sales_id" bigint,  ← NEEDS MIGRATION
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "type" public.task_type DEFAULT 'None'::public.task_type
);
```

**Existing Indexes:**
```sql
CREATE INDEX idx_tasks_contact_id ON tasks USING btree (contact_id);
CREATE INDEX idx_tasks_due_date ON tasks USING btree (due_date) WHERE (completed = false);
CREATE INDEX idx_tasks_opportunity_id ON tasks USING btree (opportunity_id);
CREATE INDEX idx_tasks_reminder_date ON tasks USING btree (reminder_date) WHERE (completed = false);
```

**Existing Foreign Keys:**
```sql
ALTER TABLE tasks
  ADD CONSTRAINT tasks_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_opportunity_id_fkey
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);
```

---

## Required Changes

### Migration 1: Add Multi-Assignment Columns

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_tasks_multi_assignment.sql`

```sql
-- Add new multi-assignment columns
ALTER TABLE tasks
  ADD COLUMN primary_account_manager_id BIGINT,
  ADD COLUMN secondary_account_manager_id BIGINT,
  ADD COLUMN tertiary_account_manager_id BIGINT,
  ADD COLUMN organization_id BIGINT;

-- Migrate existing data from sales_id to primary_account_manager_id
UPDATE tasks
SET primary_account_manager_id = sales_id
WHERE sales_id IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE tasks
  ADD CONSTRAINT tasks_primary_account_manager_id_fkey
    FOREIGN KEY (primary_account_manager_id) REFERENCES sales(id) ON DELETE SET NULL,
  ADD CONSTRAINT tasks_secondary_account_manager_id_fkey
    FOREIGN KEY (secondary_account_manager_id) REFERENCES sales(id) ON DELETE SET NULL,
  ADD CONSTRAINT tasks_tertiary_account_manager_id_fkey
    FOREIGN KEY (tertiary_account_manager_id) REFERENCES sales(id) ON DELETE SET NULL,
  ADD CONSTRAINT tasks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Add check constraint: primary Account Manager is required
ALTER TABLE tasks
  ADD CONSTRAINT tasks_primary_account_manager_required
  CHECK (primary_account_manager_id IS NOT NULL);

-- Add indexes for new columns
CREATE INDEX idx_tasks_primary_account_manager_id
  ON tasks(primary_account_manager_id);

CREATE INDEX idx_tasks_organization_id
  ON tasks(organization_id);

-- Drop old sales_id column (after data migration)
ALTER TABLE tasks DROP COLUMN sales_id;

-- Update RLS policies if they reference sales_id
-- (Check existing policies first)
```

### Migration 2: Update RLS Policies

**Review existing RLS policies:**
```bash
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tasks';
```

**Expected policy pattern (from other modules):**
```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT USAGE ON SEQUENCE tasks_id_seq TO authenticated;

-- Policy: Users can see tasks they're assigned to (any role)
CREATE POLICY select_tasks ON tasks FOR SELECT TO authenticated
USING (
  primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  OR secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  OR tertiary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
);

-- Policy: Users can insert tasks if they're primary Account Manager
CREATE POLICY insert_tasks ON tasks FOR INSERT TO authenticated
WITH CHECK (
  primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
);

-- Policy: Users can update tasks they're assigned to
CREATE POLICY update_tasks ON tasks FOR UPDATE TO authenticated
USING (
  primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  OR secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  OR tertiary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
);

-- Policy: Users can delete tasks they're primary on
CREATE POLICY delete_tasks ON tasks FOR DELETE TO authenticated
USING (
  primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
);
```

---

## Final Schema (After Migration)

```sql
CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "title" text NOT NULL,
    "description" text,
    "due_date" date,
    "reminder_date" date,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "priority" public.priority_level DEFAULT 'medium'::public.priority_level,

    -- Multi-assignment (NEW)
    "primary_account_manager_id" bigint NOT NULL REFERENCES sales(id) ON DELETE SET NULL,
    "secondary_account_manager_id" bigint REFERENCES sales(id) ON DELETE SET NULL,
    "tertiary_account_manager_id" bigint REFERENCES sales(id) ON DELETE SET NULL,

    -- Entity associations
    "contact_id" bigint REFERENCES contacts(id) ON DELETE SET NULL,
    "opportunity_id" bigint REFERENCES opportunities(id) ON DELETE SET NULL,
    "organization_id" bigint REFERENCES organizations(id) ON DELETE SET NULL,  -- NEW

    -- Metadata
    "type" public.task_type DEFAULT 'None'::public.task_type,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_primary_account_manager_id ON tasks(primary_account_manager_id);
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX idx_tasks_opportunity_id ON tasks(opportunity_id);
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE (completed = false);
CREATE INDEX idx_tasks_reminder_date ON tasks(reminder_date) WHERE (completed = false);

-- Constraints
ALTER TABLE tasks
  ADD CONSTRAINT tasks_primary_account_manager_required
  CHECK (primary_account_manager_id IS NOT NULL);
```

---

## Data Types

### task_type Enum
```sql
CREATE TYPE task_type AS ENUM (
  'Call',
  'Email',
  'Meeting',
  'Follow-up',
  'Proposal',
  'Discovery',
  'Administrative',
  'None'
);
```

### priority_level Enum (exists but unused in MVP)
```sql
CREATE TYPE priority_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);
```

---

## Validation Schema Updates

**File:** `src/atomic-crm/validation/tasks.ts`

**Required updates:**
```typescript
// Update taskCreateSchema
export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().optional(),  // ISO date string

  // Multi-assignment (NEW)
  primary_account_manager_id: z.number().int().positive(),
  secondary_account_manager_id: z.number().int().positive().optional(),
  tertiary_account_manager_id: z.number().int().positive().optional(),

  // Entity associations
  contact_id: z.number().int().positive().optional(),
  opportunity_id: z.number().int().positive().optional(),
  organization_id: z.number().int().positive().optional(),  // NEW

  // Type
  type: z.enum([
    'Call', 'Email', 'Meeting', 'Follow-up',
    'Proposal', 'Discovery', 'Administrative', 'None'
  ]).default('None'),

  completed: z.boolean().default(false),
  reminder_date: z.string().optional(),
});

// Update taskUpdateSchema (partial for PATCH)
export const taskUpdateSchema = taskCreateSchema.partial();
```

---

## Query Patterns

### Get Tasks for Current User
```typescript
// List view default filter
const { data } = useGetList('tasks', {
  filter: {
    primary_account_manager_id: currentSalesId,
    completed: false,
  },
  sort: { field: 'due_date', order: 'ASC' },
  pagination: { page: 1, perPage: 25 },
});
```

### Get Tasks for Principal
```typescript
// Dashboard integration
const { data } = useGetList('tasks', {
  filter: {
    opportunity_id: { $in: opportunityIdsForPrincipal },
  },
});
```

### Get Task with Relations
```typescript
// Show view - join with related entities
const { data } = useGetOne('tasks', { id: taskId });
// unifiedDataProvider should automatically join:
// - sales (primary/secondary/tertiary Account Managers)
// - contacts, opportunities, organizations
```

---

## Migration Rollback Plan

**If migration fails:**
```sql
-- Rollback: Restore sales_id column
ALTER TABLE tasks ADD COLUMN sales_id BIGINT;

UPDATE tasks
SET sales_id = primary_account_manager_id
WHERE primary_account_manager_id IS NOT NULL;

ALTER TABLE tasks
  DROP COLUMN primary_account_manager_id,
  DROP COLUMN secondary_account_manager_id,
  DROP COLUMN tertiary_account_manager_id,
  DROP COLUMN organization_id;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_sales_id_fkey
  FOREIGN KEY (sales_id) REFERENCES sales(id);
```

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing task data migrated (sales_id → primary_account_manager_id)
- [ ] Foreign key constraints working
- [ ] RLS policies allow assigned users to see tasks
- [ ] RLS policies prevent unauthorized access
- [ ] Indexes improve query performance (EXPLAIN ANALYZE)
- [ ] Zod validation accepts new schema
- [ ] React Admin forms work with new columns

---

## Related Files

- **Migration:** Create `supabase/migrations/YYYYMMDDHHMMSS_add_tasks_multi_assignment.sql`
- **Validation:** Update `src/atomic-crm/validation/tasks.ts`
- **Current Schema:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql:1945`
