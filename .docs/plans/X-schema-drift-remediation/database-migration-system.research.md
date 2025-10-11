# Database Migration System Research

Comprehensive research on Atomic CRM's database migration system, Supabase integration, and type generation workflow for the schema drift remediation plan.

## Overview

The Atomic CRM uses Supabase as its database backend with a timestamp-based migration system. Migrations follow the naming convention `YYYYMMDDHHMMSS_description.sql` and are stored in `/supabase/migrations/`. The system supports both local development via Supabase CLI and remote deployment, with TypeScript types automatically generated from the database schema.

## Migration File Structure

### Naming Convention

**Format**: `YYYYMMDDHHMMSS_description.sql`

**Examples**:
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250127000000_consolidated_fresh_schema.sql`
- `/home/krwhynot/Projects/atomic/supabase/migrations/20251008111500_fix_account_manager_id_type.sql`
- `/home/krwhynot/Projects/atomic/supabase/migrations/20251008060000_simplify_contact_organization_relationship.sql`

**Pattern Requirements**:
- Timestamp: YYYYMMDDHHMMSS (Year-Month-Day-Hour-Minute-Second)
- Separator: Single underscore `_`
- Description: Snake_case, lowercase, descriptive
- Extension: `.sql`

### Migration Directory Structure

```
/home/krwhynot/Projects/atomic/supabase/
├── config.toml                 # Supabase local configuration
├── migrations/                 # All migration files
│   ├── _archived/             # Historical migrations (pre-consolidation)
│   └── *.sql                  # Active migrations
├── functions/                 # Edge functions
├── seed.sql                   # Seed data
└── templates/                 # Email templates
```

### Current Migration State

**Consolidated Base**: `/home/krwhynot/Projects/atomic/supabase/migrations/20250127000000_consolidated_fresh_schema.sql`
- Consolidated from 68 historical migrations
- Date: 2025-01-27
- Represents complete schema baseline
- Includes all tables, views, RLS policies, triggers, and functions

**Recent Migrations** (Post-consolidation):
- `20250127040000_fix_rls_policies_public_to_authenticated.sql` - RLS role fixes
- `20250127041600_grant_table_permissions_to_authenticated_fixed.sql` - Permission grants
- `20250928220851_normalize_contact_email_phone_to_arrays.sql` - JSONB array conversion
- `20250929002034_rename_task_name_to_title_and_add_type_enum.sql` - Task field updates
- `20251008060000_simplify_contact_organization_relationship.sql` - Schema simplification
- `20251008111500_fix_account_manager_id_type.sql` - Type correction (uuid→bigint)

## How Migrations Are Applied

### Local Development (Supabase CLI)

**Primary Command**: `npx supabase db push`

**Configuration**: `/home/krwhynot/Projects/atomic/supabase/config.toml`
```toml
project_id = "atomic-crm-demo"

[db]
port = 54322
major_version = 15

[api]
port = 54321
schemas = ["public", "storage", "graphql_public"]
```

**Workflow**:
1. Developer creates migration file with timestamp naming
2. Migration placed in `/supabase/migrations/`
3. Execute `npx supabase db push` to apply to local DB
4. Supabase CLI tracks applied migrations internally
5. Only unapplied migrations are executed

### Remote Deployment (Production)

**NPM Scripts** (from `/home/krwhynot/Projects/atomic/package.json`):

```json
{
  "supabase:deploy": "npx supabase db push && npx supabase functions deploy",
  "prod:start": "npm run build && npm run supabase:deploy && npx serve -l tcp://127.0.0.1:3000 dist",
  "prod:deploy": "npm run build && npm run supabase:deploy && npm run ghpages:deploy"
}
```

**Deployment Process**:
1. `npm run build` - TypeScript compilation and Vite build
2. `npx supabase db push` - Apply pending migrations to linked remote project
3. `npx supabase functions deploy` - Deploy edge functions
4. Deployment to GitHub Pages (static frontend)

**Remote Initialization** (New Projects):

Script: `/home/krwhynot/Projects/atomic/scripts/supabase-remote-init.mjs`
```javascript
// Steps:
1. Login to Supabase: npx supabase login
2. Create project: npx supabase projects create
3. Link project: npx supabase link --project-ref <ref>
4. Push schema: npx supabase db push --linked --include-roles
5. Generate env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### MCP Tool Integration

**Available Tools** (from CLAUDE.md):
- `mcp__supabase-lite__list_tables` - List database tables with RLS status
- `mcp__supabase-lite__execute_sql` - Execute queries (SELECT/INSERT/UPDATE/DELETE)
- `mcp__supabase-lite__apply_migration` - Apply DDL migrations (CREATE/ALTER/DROP)
- `mcp__supabase-lite__generate_typescript_types` - Generate TypeScript types
- `mcp__supabase-lite__get_logs` - View service logs (api/postgres/auth/storage/realtime)
- `mcp__supabase-lite__get_advisors` - Security and performance recommendations

**Usage Pattern**:
```typescript
// Apply migration via MCP
await mcp__supabase-lite__apply_migration({
  name: "fix_schema_drift",
  query: "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role contact_role;"
});

// Verify changes
await mcp__supabase-lite__list_tables({ schemas: ["public"] });
```

### Custom Migration Scripts (Historical)

**Location**: `/home/krwhynot/Projects/atomic/scripts/migrate-production.js`

**Purpose**: Complex multi-phase migrations (now deprecated for simple migrations)
- Backup creation
- Pre-migration validation
- Phase execution with rollback support
- Post-migration verification
- State tracking in `migration_history` table

**Current Status**: Used for major schema overhauls, not routine changes

## Supabase Configuration and Connection

### Client Initialization

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/supabase.ts`
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL` - Project URL (e.g., `https://xxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Anonymous/public API key

**Optional** (for migrations):
- `SUPABASE_SERVICE_KEY` - Service role key (admin operations)

### Local vs Remote Connection

**Local**: Supabase CLI starts local instance
- Database: `postgresql://postgres:postgres@localhost:54322/postgres`
- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`

**Remote**: Environment-specific URLs
- Production: Linked via `.env.production.local`
- Staging: Linked via `.env.staging.local` (if applicable)

## Foreign Key Constraint Patterns

### Standard Pattern

**Format**: Inline constraint definition with referential action

```sql
-- Example from consolidated schema (line 173)
user_id uuid UNIQUE REFERENCES auth.users(id)

-- Example from consolidated schema (line 211)
sales_id bigint REFERENCES sales(id)

-- With explicit ON DELETE action
parent_organization_id bigint REFERENCES organizations(id)
```

### ON DELETE Actions Used

**CASCADE** - Delete dependent rows (rare, used carefully)
```sql
-- Not commonly used in this codebase
```

**SET NULL** - Nullify foreign key on delete (common pattern)
```sql
-- Example: 20251008111500_fix_account_manager_id_type.sql
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_account_manager_id_fkey
FOREIGN KEY (account_manager_id)
REFERENCES sales(id)
ON DELETE SET NULL;
```

**NO ACTION** (default) - Prevent deletion if references exist
```sql
-- Most foreign keys use implicit NO ACTION
contact_id bigint REFERENCES contacts(id)
organization_id bigint REFERENCES organizations(id)
```

### Existing Foreign Key Constraints

**From Database Query** (via `mcp__supabase-lite__execute_sql`):
```
sales.user_id → auth.users(id) [ON DELETE CASCADE]
contacts.sales_id → sales(id) [NO ACTION]
contacts.created_by → sales(id) [NO ACTION]
opportunities.sales_id → sales(id) [NO ACTION]
opportunities.created_by → sales(id) [NO ACTION]
tasks.contact_id → contacts(id) [ON DELETE CASCADE]
tasks.opportunity_id → opportunities(id) [NO ACTION]
tasks.sales_id → sales(id) [NO ACTION]
contactNotes.contact_id → contacts(id) [ON DELETE CASCADE]
opportunityNotes.opportunity_id → opportunities(id) [NO ACTION]
```

### Junction Table Pattern

**Example**: `contact_organizations` table
```sql
CREATE TABLE contact_organizations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    contact_id bigint NOT NULL REFERENCES contacts(id),
    organization_id bigint NOT NULL REFERENCES organizations(id),
    is_primary boolean DEFAULT false,
    -- ... additional fields
    deleted_at timestamptz
);
```

**Key Characteristics**:
- Composite foreign keys to parent tables
- Soft deletes via `deleted_at` timestamp
- Unique constraints to prevent duplicates
- Additional metadata columns (is_primary, roles, dates)

### Type Migration Example

**Problem**: Incorrect type assignment (uuid instead of bigint)

**Migration**: `20251008111500_fix_account_manager_id_type.sql`
```sql
-- Drop existing foreign key constraint
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_account_manager_id_fkey;

-- Change column type from UUID to bigint
ALTER TABLE opportunities
ALTER COLUMN account_manager_id TYPE bigint USING NULL;

-- Add foreign key constraint to sales.id
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_account_manager_id_fkey
FOREIGN KEY (account_manager_id)
REFERENCES sales(id)
ON DELETE SET NULL;

-- Document the relationship
COMMENT ON COLUMN opportunities.account_manager_id IS 'Foreign key to sales.id (bigint)';
```

## RLS Policies and Schema Changes

### RLS Policy Standard

**Engineering Constitution Rule**: Simple `auth.role() = 'authenticated'` check

**Standard Pattern** (from `20250927000000_standardize_all_rls_policies.sql`):
```sql
-- Read policy
CREATE POLICY "Enable read for authenticated users on {table}"
    ON {table} FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

-- Insert policy
CREATE POLICY "Enable insert for authenticated users on {table}"
    ON {table} FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

-- Update policy
CREATE POLICY "Enable update for authenticated users on {table}"
    ON {table} FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Delete policy
CREATE POLICY "Enable delete for authenticated users on {table}"
    ON {table} FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');
```

### RLS Policy Lifecycle

**1. Enable RLS**:
```sql
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
```

**2. Create Policies** (4 per table):
- SELECT policy (read)
- INSERT policy (create)
- UPDATE policy (modify)
- DELETE policy (remove)

**3. Grant Table Permissions**:
```sql
GRANT ALL ON {table_name} TO authenticated;
```

### Views and RLS

**Security Invoker vs Definer**:

**Security Definer** (used for summary views):
```sql
CREATE OR REPLACE VIEW public.contacts_summary
WITH (security_invoker = false) AS
SELECT ...
```

**Grants Required**:
```sql
GRANT SELECT ON contacts_summary TO authenticated, anon;
```

**Example**: `/home/krwhynot/Projects/atomic/supabase/migrations/20250926214030_fix_security_definer_views.sql`
- Changed views from `security_invoker = true` to `false`
- Ensures views execute with view owner's permissions
- Allows React Admin to query views without complex RLS

### RLS Common Issues Fixed

**Issue 1**: Using `public` role with `auth.uid() IS NOT NULL`
```sql
-- WRONG (impossible condition)
CREATE POLICY ... TO public
USING (auth.uid() IS NOT NULL);

-- CORRECT
CREATE POLICY ... TO authenticated
USING (auth.role() = 'authenticated');
```

**Migration**: `20250127040000_fix_rls_policies_public_to_authenticated.sql`

**Issue 2**: Missing table permissions
```sql
-- After creating policies, grant permissions
GRANT ALL ON TABLE {table_name} TO authenticated;
```

**Migration**: `20250127041600_grant_table_permissions_to_authenticated_fixed.sql`

## Type Generation Process

### Manual Generation Command

**Command**: `npx supabase gen types typescript --local > src/types/database.generated.ts`

**Flags**:
- `--local` - Generate from local Supabase instance
- `--linked` - Generate from linked remote project

### Generated Type File

**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`

**Structure**:
```typescript
// Generated TypeScript types for Supabase database
// Generated at: 2025-10-09T02:46:17.796Z

export interface Database {
  public: {
    Tables: {
      {table_name}: {
        Row: { /* All columns with actual types */ }
        Insert: { /* Optional fields for INSERT */ }
        Update: { /* All fields optional for UPDATE */ }
      }
    }
  }
}
```

**Type Mapping Examples**:
```typescript
// PostgreSQL → TypeScript
bigint → number
uuid → string
timestamptz → string
jsonb → any
text[] → any[]
boolean → boolean | null (if nullable)
```

### Type Generation Workflow

**Trigger Points**:
1. After applying new migrations locally
2. Before committing schema changes
3. During build process (manual step)
4. After pulling schema changes from remote

**Process**:
```bash
# 1. Apply migrations
npx supabase db push

# 2. Generate types
npx supabase gen types typescript --local > src/types/database.generated.ts

# 3. Verify types compile
npm run build

# 4. Commit both migration and types
git add supabase/migrations/*.sql src/types/database.generated.ts
git commit -m "migration: add new fields with type updates"
```

### MCP Type Generation

**Tool**: `mcp__supabase-lite__generate_typescript_types`

**Usage**:
```typescript
// Generate types via MCP (returns TypeScript code as string)
const types = await mcp__supabase-lite__generate_typescript_types();

// Write to file
fs.writeFileSync('src/types/database.generated.ts', types);
```

**Advantage**: No need for local Supabase CLI, works with remote instance

### Type Usage in Code

**Import**:
```typescript
import { Database } from '@/types/database.generated';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];
```

**Supabase Client Typing**:
```typescript
const supabase = createClient<Database>(url, key);

// Auto-complete and type safety
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .single();
// data is typed as Contact | null
```

## Migration Examples

### Example 1: Add Column with Default

```sql
-- 20251008150000_make_industry_id_nullable.sql
ALTER TABLE organizations
ALTER COLUMN industry_id DROP NOT NULL;

COMMENT ON COLUMN organizations.industry_id IS 'Nullable foreign key to industries table';
```

### Example 2: Create Junction Table Function

**File**: `20251007120000_create_sync_contact_organizations_function.sql`

```sql
CREATE OR REPLACE FUNCTION sync_contact_organizations(
    p_contact_id bigint,
    p_organizations jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_record record;
BEGIN
    -- Delete existing associations
    DELETE FROM contact_organizations WHERE contact_id = p_contact_id;

    -- Insert new associations from JSONB payload
    FOR org_record IN
        SELECT
            (elem->>'organization_id')::bigint as organization_id,
            COALESCE((elem->>'is_primary')::boolean, false) as is_primary
        FROM jsonb_array_elements(p_organizations) AS elem
    LOOP
        INSERT INTO contact_organizations (...)
        VALUES (...);
    END LOOP;
END;
$$;

COMMENT ON FUNCTION sync_contact_organizations IS 'Syncs contact-organization relationships via delete-then-insert pattern';
```

### Example 3: Schema Simplification

**File**: `20251008060000_simplify_contact_organization_relationship.sql`

**Problem**: Many-to-many complexity unnecessary

**Solution**: Add direct foreign key
```sql
-- Step 1: Add column
ALTER TABLE contacts
ADD COLUMN organization_id bigint REFERENCES organizations(id) ON DELETE SET NULL;

-- Step 2: Create index
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);

-- Step 3: Migrate data
UPDATE contacts c
SET organization_id = (
  SELECT co.organization_id
  FROM contact_organizations co
  WHERE co.contact_id = c.id AND co.deleted_at IS NULL
  ORDER BY co.is_primary DESC, co.id ASC
  LIMIT 1
);

-- Step 4: Add unique constraint to prevent future many-to-many
CREATE UNIQUE INDEX idx_contact_organizations_unique_contact
ON contact_organizations(contact_id)
WHERE deleted_at IS NULL;

-- Step 5: Document deprecation
COMMENT ON TABLE contact_organizations IS 'DEPRECATED: Use contacts.organization_id for new contacts';
```

## Deployment Commands Reference

### Development Commands

```bash
# Start local Supabase
npx supabase start

# Apply migrations locally
npx supabase db push

# Generate types
npx supabase gen types typescript --local > src/types/database.generated.ts

# View local database
npx supabase db diff      # Show schema changes
npx supabase status       # Show running services
```

### Production Commands

```bash
# Link to remote project
npx supabase link --project-ref <project-ref>

# Apply migrations to remote
npx supabase db push --linked

# Generate types from remote
npx supabase gen types typescript --linked > src/types/database.generated.ts

# Full deployment
npm run prod:deploy  # Build + Deploy DB + Deploy Frontend
```

### NPM Script Summary

**Database**:
- `npm run supabase:deploy` - Deploy migrations and functions
- `npm run supabase:remote:init` - Initialize new remote project

**Development**:
- `npm run dev` - Start Vite dev server (assumes Supabase running)
- `npm run build` - TypeScript check + Vite build

**Production**:
- `npm run prod:start` - Build + Deploy + Serve locally
- `npm run prod:deploy` - Build + Deploy + GitHub Pages

**Validation**:
- `npm run test` - Run Vitest tests
- `npm run lint` - ESLint + Prettier checks

## Migration History Tracking

### migration_history Table

**Schema** (from consolidated_fresh_schema.sql, lines 595-606):
```sql
CREATE TABLE public.migration_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phase_number text NOT NULL,
    phase_name text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz,
    completed_at timestamptz,
    error_message text,
    rollback_sql text,
    rows_affected bigint,
    created_at timestamptz DEFAULT now()
);
```

**Usage**: Custom tracking for complex multi-phase migrations

**Example Record**:
```sql
INSERT INTO migration_history (
    phase_number,
    phase_name,
    status,
    completed_at,
    rows_affected
) VALUES (
    '20250127000000',
    'consolidated_fresh_schema',
    'completed',
    now(),
    0
);
```

### Supabase Built-in Tracking

Supabase CLI maintains migration state in:
- `supabase_migrations.schema_migrations` table
- Tracks: `version`, `name`, `executed_at`
- Automatically managed by `supabase db push`

## Key Findings for Schema Drift Remediation

### 1. Migration Naming Must Be Precise

- **Critical**: Timestamp determines execution order
- **Issue**: Past migrations had naming inconsistencies
- **Solution**: Always use `YYYYMMDDHHMMSS_description.sql` format

### 2. Foreign Key Constraints Are Inline

- **Pattern**: Constraints defined with column (not separate ALTER statements)
- **Benefit**: Single source of truth in table definition
- **Exception**: Type changes require DROP + re-ADD pattern

### 3. RLS Policies Are Standardized

- **Rule**: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- **Check**: `auth.role() = 'authenticated'` only
- **Grant**: Always `GRANT ALL ON table TO authenticated`

### 4. Views Require Special Handling

- **Use**: `security_invoker = false` for summary views
- **Grant**: Explicit `GRANT SELECT TO authenticated, anon`
- **Reason**: React Admin needs simplified permissions

### 5. Type Generation Is Manual

- **Trigger**: After every schema change
- **Command**: `npx supabase gen types typescript --local`
- **Target**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`
- **Validation**: Must compile with `npm run build`

### 6. Soft Deletes Are Universal

- **Pattern**: `deleted_at timestamptz` column on all major tables
- **Queries**: Always filter `WHERE deleted_at IS NULL`
- **Views**: Include soft delete filter in view definitions

### 7. JSONB Fields Require Special Care

- **Fields**: `contacts.email`, `contacts.phone`, `opportunities.contact_ids`
- **Format**: JSONB arrays `[{"email":"x@y.com"}]`
- **Indexes**: GIN indexes for JSONB fields
- **Operators**: `@>` (contains) for array queries

### 8. Migration Rollback Strategy

- **Simple Migrations**: Manual reverse SQL
- **Complex Migrations**: `migration_history.rollback_sql` column
- **Best Practice**: Test migrations on staging first
- **Last Resort**: Restore from backup (see `scripts/migration-backup.js`)

## Relevant Documentation

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Supabase Migrations: https://supabase.com/docs/guides/cli/local-development#database-migrations
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- TypeScript Types: https://supabase.com/docs/guides/api/generating-types
- MCP Supabase Lite: Available as built-in tool (see CLAUDE.md)
