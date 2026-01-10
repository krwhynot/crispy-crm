---
name: supabase-crm
description: Supabase backend patterns for Crispy CRM - RLS policies, Edge Functions, query optimization, and migration best practices. Focuses on PostgreSQL 17 patterns with soft deletes and multi-tenant architecture.
---

# Supabase CRM Patterns

## Purpose

Backend architecture patterns for Crispy CRM's Supabase integration. Covers Row Level Security, query optimization, Edge Functions, and database migrations specific to the CRM domain model.

## When to Use

Activate this skill when:
- Writing RLS policies for CRM entities
- Optimizing Supabase queries
- Creating or modifying database views
- Working with Edge Functions
- Writing migration files
- Implementing soft delete patterns

---

## Core Architecture Principles

### 1. Soft Deletes Only

**NEVER use hard deletes.** All tables use `deleted_at` timestamp:

```sql
-- Table definition pattern
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... other columns
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. RLS Policy Pattern

All tables must have Row Level Security enabled with soft delete filtering:

```sql
-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- SELECT policy - always filter soft deletes
CREATE POLICY "contacts_select_policy" ON public.contacts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND auth.role() = 'authenticated'
  );

-- INSERT policy
CREATE POLICY "contacts_insert_policy" ON public.contacts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy - prevent updating deleted records
CREATE POLICY "contacts_update_policy" ON public.contacts
  FOR UPDATE
  USING (deleted_at IS NULL AND auth.role() = 'authenticated')
  WITH CHECK (deleted_at IS NULL);

-- DELETE policy - actually performs soft delete
CREATE POLICY "contacts_delete_policy" ON public.contacts
  FOR DELETE
  USING (deleted_at IS NULL AND auth.role() = 'authenticated');
```

### 3. View/Table Duality

Read from **Views** (computed fields), write to **Base Tables**:

```sql
-- Summary view for reads (includes computed fields)
CREATE OR REPLACE VIEW public.contacts_summary AS
SELECT
  c.*,
  o.name AS organization_name,
  COUNT(DISTINCT n.id) AS nb_notes,
  COUNT(DISTINCT t.id) AS nb_tasks
FROM public.contacts c
LEFT JOIN public.organizations o ON c.organization_id = o.id
LEFT JOIN public.notes n ON n.contact_id = c.id AND n.deleted_at IS NULL
LEFT JOIN public.tasks t ON t.contact_id = c.id AND t.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, o.name;

-- Grant access to view
GRANT SELECT ON public.contacts_summary TO authenticated;
```

---

## Query Optimization

### Use Views for List Operations

```typescript
// Good - uses summary view with precomputed counts
const { data } = await supabase
  .from('contacts_summary')
  .select('*')
  .order('last_name', { ascending: true });

// Bad - N+1 queries for counts
const { data } = await supabase
  .from('contacts')
  .select('*, notes(count), tasks(count)');
```

### Pagination Pattern

```typescript
// Efficient pagination with cursor
const { data, count } = await supabase
  .from('contacts_summary')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false });
```

### Index Strategy

Create indexes for common query patterns:

```sql
-- Soft delete filtering (used in every query)
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at
  ON public.contacts (deleted_at)
  WHERE deleted_at IS NULL;

-- Foreign key lookups
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id
  ON public.contacts (organization_id);

-- Text search
CREATE INDEX IF NOT EXISTS idx_contacts_name_search
  ON public.contacts USING gin (
    to_tsvector('english', first_name || ' ' || last_name)
  );
```

---

## Edge Functions

### Standard Pattern

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create authenticated client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Your logic here
    const { data, error } = await supabaseClient
      .from("contacts")
      .select("*")
      .limit(10);

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

### Existing Edge Functions

| Function | Purpose |
|----------|---------|
| `daily-digest` | Sends daily activity summary emails |
| `check-overdue-tasks` | Flags overdue tasks for notification |

---

## Migration Best Practices

### File Naming

```
YYYYMMDDHHMMSS_descriptive_name.sql
20241215120000_add_contacts_soft_delete.sql
```

### Migration Template

```sql
-- =============================================
-- Migration: Add soft delete to contacts
-- Author: [name]
-- Date: 2024-12-15
-- =============================================

-- 1. Add column
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at
ON public.contacts (deleted_at)
WHERE deleted_at IS NULL;

-- 3. Update RLS policies
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
CREATE POLICY "contacts_select_policy" ON public.contacts
  FOR SELECT
  USING (deleted_at IS NULL AND auth.role() = 'authenticated');

-- 4. Update view
CREATE OR REPLACE VIEW public.contacts_summary AS
SELECT * FROM public.contacts WHERE deleted_at IS NULL;

-- 5. Grant permissions
GRANT SELECT ON public.contacts_summary TO authenticated;
```

### Testing Migrations

```bash
# Reset local database and apply all migrations
npx supabase db reset

# Run pgTAP tests
npx supabase test db
```

---

## CRM Domain Specifics

### Principal-Distributor-Operator Model

```
Principal (manufacturer)
    ↓ authorizes
Distributor (buyer)
    ↓ sells to
Operator (restaurant)
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `principals` | Manufacturers MFB represents | name, specialty |
| `distributors` | Buys from principals | name, territory |
| `opportunities` | Deals in pipeline | principal_id, stage |
| `authorizations` | Distributor-Principal links | distributor_id, principal_id |

### Pipeline Stages

```sql
-- Stage enum (ordered)
CREATE TYPE pipeline_stage AS ENUM (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
);
```

---

## Common Pitfalls

### 1. Forgetting Soft Delete in RLS

```sql
-- WRONG - shows deleted records
CREATE POLICY "select_contacts" ON contacts
  FOR SELECT USING (auth.role() = 'authenticated');

-- CORRECT - filters deleted
CREATE POLICY "select_contacts" ON contacts
  FOR SELECT USING (
    deleted_at IS NULL
    AND auth.role() = 'authenticated'
  );
```

### 2. Writing to Views

```typescript
// WRONG - views are read-only
await supabase.from('contacts_summary').insert({...});

// CORRECT - write to base table
await supabase.from('contacts').insert({...});
```

### 3. Missing View Permissions

```sql
-- Always grant access to views
GRANT SELECT ON public.contacts_summary TO authenticated;
GRANT SELECT ON public.contacts_summary TO anon;
```

---

## Related Skills

- **supabase-cli** - For CLI commands and local development
- **data-integrity-guards** - For validation patterns
- **enforcing-principles** - For migration best practices
