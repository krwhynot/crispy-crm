---
name: supabase-cli
description: Comprehensive Supabase CLI reference for local development, migrations, Edge Functions, type generation, and deployment. Also covers CRM backend patterns including RLS policies, soft deletes, multi-tenant architecture, query optimization, and PostgreSQL 17 patterns. Triggers on supabase, npx supabase, migrations, db push, db pull, db reset, edge functions, supabase start, supabase stop, supabase link, gen types, supabase deploy, local development stack, database branching, secrets management, RLS, row level security, soft deletes, views, summary views, multi-tenant, pipeline stages.
---

# Supabase CLI Cheat Sheet

## Purpose

Quick reference for all Supabase CLI commands used in local development, database migrations, Edge Functions, and deployment workflows.

## When to Use

Activate this skill when:
- Running Supabase CLI commands
- Managing database migrations
- Working with Edge Functions
- Generating TypeScript types
- Deploying to production
- Troubleshooting local development stack
- Writing RLS policies for CRM entities
- Optimizing Supabase queries
- Creating or modifying database views
- Implementing soft delete patterns
- Working with multi-tenant architecture

---

## CRITICAL: Common Mistakes to AVOID

### `supabase db execute` DOES NOT EXIST!

```bash
# WRONG - This command doesn't exist!
supabase db execute --local "SELECT * FROM users;"

# The actual supabase db commands are:
# diff, dump, lint, pull, push, reset, start
```

**To run SQL queries, use Docker + psql instead:**

```bash
# CORRECT - Use Docker to run SQL
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"
```

### Docker `-it` flags fail in non-TTY environments

```bash
# WRONG - Fails with "the input device is not a TTY"
docker exec -it supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"

# CORRECT - Remove -t flag (or both -i and -t)
docker exec supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"
```

### Wrong container name

```bash
# Find your container name first:
docker ps --filter "name=supabase_db"

# Then use the full name (includes project suffix):
docker exec supabase_db_crispy-crm psql -U postgres -c "..."
```

See [WORKFLOWS.md](resources/WORKFLOWS.md) for complete SQL execution guide.

---

## Installation & Authentication

```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (macOS/Linux)
brew install supabase/tap/supabase

# Authenticate (opens browser)
supabase login

# Logout
supabase logout
```

---

## Project Setup

| Command | Description |
|---------|-------------|
| `supabase init` | Initialize project (creates `supabase/config.toml`) |
| `supabase init --with-vscode-settings` | Init with Deno settings for VS Code |
| `supabase link --project-ref <id>` | Link to remote project |

**Get project-id from:** `https://supabase.com/dashboard/project/<project-id>`

---

## Local Development Stack

| Command | Description |
|---------|-------------|
| `supabase start` | Start all local containers (~7GB RAM) |
| `supabase stop` | Stop containers (with backup) |
| `supabase stop --no-backup` | Stop without backup |
| `supabase status` | Show status and URLs |

### Selective Start

```bash
# Exclude services you don't need
supabase start -x studio,imgproxy

# Available: gotrue, realtime, storage-api, imgproxy, kong,
#            mailpit, postgrest, postgres-meta, studio,
#            edge-runtime, logflare, vector, supavisor
```

### Default Local URLs

| Service | URL |
|---------|-----|
| API (PostgREST) | `http://localhost:54321` |
| Studio Dashboard | `http://localhost:54323` |
| Database | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Mailpit (Email) | `http://localhost:54324` |

---

## Database Migrations

### Create Migrations

```bash
# Create empty migration
supabase migration new <name>

# Diff local changes -> migration file
supabase db diff -f <name>

# Diff against remote
supabase db diff --linked -f <name>

# Diff specific schema
supabase db diff --schema public -f <name>
```

### Apply Migrations

| Command | Description |
|---------|-------------|
| `supabase db reset` | Reset + apply all + seed |
| `supabase db reset --no-seed` | Reset without seed.sql |
| `supabase migration up` | Apply pending (local) |
| `supabase migration up --linked` | Apply pending (remote) |

### Sync with Remote

```bash
# Pull from remote -> create migration
supabase db pull

# Pull specific schemas
supabase db pull --schema auth,storage

# Push to remote
supabase db push

# Preview push (dry run)
supabase db push --dry-run
```

### Migration Management

| Command | Description |
|---------|-------------|
| `supabase migration list` | List all migrations |
| `supabase migration repair` | Fix history table |
| `supabase migration squash` | Combine migrations |

---

## Type Generation

```bash
# From local database
supabase gen types typescript --local > src/types/supabase.ts

# From linked remote
supabase gen types typescript --linked > src/types/supabase.ts

# Specific schemas
supabase gen types typescript --local --schema public,auth
```

---

## Edge Functions

### Create & Manage

```bash
supabase functions new <name>     # Create function
supabase functions list           # List all
supabase functions delete <name>  # Delete
```

### Local Development

```bash
supabase functions serve                    # Serve all
supabase functions serve <name>             # Serve one
supabase functions serve --env-file .env    # With env
```

### Deploy

```bash
supabase functions deploy <name>            # Deploy one
supabase functions deploy                   # Deploy all
supabase functions deploy --no-verify-jwt   # No JWT check
```

---

## Secrets Management

```bash
supabase secrets set KEY=value          # Set secret
supabase secrets set --env-file .env    # From file
supabase secrets list                   # List all
supabase secrets unset KEY              # Remove
```

---

## Database Inspection

```bash
supabase inspect db db-stats            # Database stats
supabase inspect db table-stats         # Table sizes
supabase inspect db index-stats         # Index usage
supabase inspect db bloat               # Find bloat
supabase inspect db long-running-queries # Slow queries
supabase inspect db locks               # Lock info
```

---

## Storage

```bash
supabase storage ls ss:///bucket/path       # List files
supabase storage cp ./file ss:///bucket/    # Upload
supabase storage cp ss:///bucket/file ./    # Download
supabase storage rm ss:///bucket/file       # Delete
```

---

## Common Workflows

### Fresh Local Start

```bash
supabase init
supabase start
# Make changes in Studio (localhost:54323)
supabase db diff -f my_changes
supabase db reset  # Verify migrations
```

### Deploy to Production

```bash
supabase link --project-ref <id>
supabase db push              # Push migrations
supabase functions deploy     # Deploy functions
```

### Regenerate Types After Schema Change

```bash
supabase db reset
supabase gen types typescript --local > src/types/supabase.ts
```

---

## Troubleshooting

```bash
supabase status                      # Check health
supabase stop --no-backup && supabase start  # Full reset
supabase start --ignore-health-check # Force start
```

---

## Reference Files

For detailed information, see:
- [COMMANDS_REFERENCE.md](resources/COMMANDS_REFERENCE.md) - Complete command documentation with all flags
- [CONFIG_REFERENCE.md](resources/CONFIG_REFERENCE.md) - config.toml configuration options
- [WORKFLOWS.md](resources/WORKFLOWS.md) - Step-by-step workflow guides + mistake prevention
- [TROUBLESHOOTING.md](resources/TROUBLESHOOTING.md) - Common errors and solutions
- [CI_CD_PATTERNS.md](resources/CI_CD_PATTERNS.md) - GitHub Actions workflows for migrations/deployment
- [MCP_INTEGRATION.md](resources/MCP_INTEGRATION.md) - Using MCP tools alongside CLI

---

## Hook Protection

This skill includes a **PreToolUse hook** that BLOCKS invalid commands:
- `supabase db execute` -> Use Docker + psql
- `supabase run/sql/query` -> Don't exist
- `docker exec -it` in non-TTY -> Remove `-t` flag

The hook auto-detects your project ID from `supabase/config.toml` for correct container name suggestions.

---

## CRM Domain Patterns

### Purpose

Backend architecture patterns for Crispy CRM's Supabase integration. Covers Row Level Security, query optimization, Edge Functions, and database migrations specific to the CRM domain model.

---

### Core Architecture Principles

#### 1. Soft Deletes Only

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

#### 2. RLS Policy Pattern

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

#### 3. View/Table Duality

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

### Query Optimization

#### Use Views for List Operations

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

#### Pagination Pattern

```typescript
// Efficient pagination with cursor
const { data, count } = await supabase
  .from('contacts_summary')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false });
```

#### Index Strategy

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

### CRM Edge Functions

#### Standard Pattern

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

#### Existing Edge Functions

| Function | Purpose |
|----------|---------|
| `daily-digest` | Sends daily activity summary emails |
| `check-overdue-tasks` | Flags overdue tasks for notification |

---

### Migration Best Practices

#### File Naming

```
YYYYMMDDHHMMSS_descriptive_name.sql
20241215120000_add_contacts_soft_delete.sql
```

#### Migration Template

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

#### Testing Migrations

```bash
# Reset local database and apply all migrations
npx supabase db reset

# Run pgTAP tests
npx supabase test db
```

---

### CRM Domain Specifics

#### Principal-Distributor-Operator Model

```
Principal (manufacturer)
    | authorizes
Distributor (buyer)
    | sells to
Operator (restaurant)
```

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `principals` | Manufacturers MFB represents | name, specialty |
| `distributors` | Buys from principals | name, territory |
| `opportunities` | Deals in pipeline | principal_id, stage |
| `authorizations` | Distributor-Principal links | distributor_id, principal_id |

#### Pipeline Stages

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

### Common Pitfalls

#### 1. Forgetting Soft Delete in RLS

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

#### 2. Writing to Views

```typescript
// WRONG - views are read-only
await supabase.from('contacts_summary').insert({...});

// CORRECT - write to base table
await supabase.from('contacts').insert({...});
```

#### 3. Missing View Permissions

```sql
-- Always grant access to views
GRANT SELECT ON public.contacts_summary TO authenticated;
GRANT SELECT ON public.contacts_summary TO anon;
```

---

### Related Skills

- **data-integrity-guards** - For validation patterns
- **enforcing-principles** - For migration best practices

---

**Skill Type:** Guardrail (blocks invalid commands) + Domain Reference (CRM patterns)
