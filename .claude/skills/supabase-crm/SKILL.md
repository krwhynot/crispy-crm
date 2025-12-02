---
name: supabase-crm
description: Supabase backend patterns for Crispy-CRM including RLS policies, Edge Functions, service layer architecture, and CRM business logic
---

# Supabase CRM Skill

## Purpose

This skill provides Supabase-specific backend patterns for the Crispy-CRM project, including:
- Service layer architecture with DataProvider abstraction
- Row Level Security (RLS) policies for multi-tenant access
- Edge Functions for complex business operations
- Database migrations and schema management
- Query optimization and performance patterns
- CRM-specific business logic (Organizations, Contacts, Opportunities)

## When to Use This Skill

**Auto-activates when:**
- Editing files in `src/services/`, `supabase/functions/`, or `supabase/migrations/`
- Working with Supabase queries, RLS policies, or Edge Functions
- Implementing business logic for Organizations, Contacts, or Opportunities
- Writing database migrations or TypeScript service classes
- Keywords: "supabase", "database", "query", "RLS", "edge function", "service layer"

**Use manually for:**
- Designing database schema changes
- Creating new service classes
- Implementing complex business rules
- Optimizing database queries
- Setting up RLS policies

## Engineering Constitution Alignment

This skill follows Crispy-CRM's Engineering Constitution:

1. **Validation at API boundaries** - Use Zod schemas for RPC validation
2. **Single composable entry point** - DataProvider abstraction delegating to resource modules
3. **Service layer orchestration** - Business logic in service classes, not components
4. **TypeScript type safety** - Types inferred from Zod schemas
5. **Fail-fast validation** - Validate inputs before database operations

## Quick Reference

### Service Layer Pattern

```typescript
// Service classes extend DataProvider abstraction
export class OrganizationService {
  constructor(private dataProvider: DataProvider) {}

  async createOrganization(input: CreateOrgInput): Promise<Organization> {
    // 1. Validate at boundary
    const validated = CreateOrgSchema.parse(input);
    
    // 2. Apply business rules
    await this.validateHierarchy(validated);
    
    // 3. Use DataProvider (composable entry point)
    const { data } = await this.dataProvider.create('organizations', {
      data: validated
    });
    
    return data;
  }
}
```

### RLS Policy Pattern

```sql
-- Enable RLS on table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can access all organizations (shared team model)
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy: Authenticated users can insert organizations
CREATE POLICY authenticated_insert_organizations ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Edge Function Pattern

```typescript
// Edge Function with validation and error handling
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const RequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  profile: z.object({
    first_name: z.string(),
    last_name: z.string()
  })
});

Deno.serve(async (req) => {
  try {
    // 1. Parse and validate input
    const body = await req.json();
    const validated = RequestSchema.parse(body);
    
    // 2. Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 3. Execute business logic
    const result = await createSalesUser(supabase, validated);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    // 4. Consistent error handling
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Migration Pattern

```sql
-- Migration: Add new table with full setup
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_<entity>_table.sql

-- =====================================================
-- Table Definition
-- =====================================================

CREATE TABLE IF NOT EXISTS <entity> (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Business fields
  name TEXT NOT NULL,
  -- ... other fields
  
  -- Constraints
  CONSTRAINT <entity>_name_not_empty CHECK (name <> '')
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_<entity>_name ON <entity>(name);
CREATE INDEX idx_<entity>_created_at ON <entity>(created_at DESC);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE <entity> ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_select_<entity> ON <entity>
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_<entity>_updated_at
  BEFORE UPDATE ON <entity>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Resource Files

### Core Patterns
- [Service Layer Architecture](resources/service-layer.md) - DataProvider abstraction and business logic
- [Validation Patterns](resources/validation-patterns.md) - Zod schemas and CRM-specific validation
- [Error Handling](resources/error-handling.md) - Custom error hierarchy and Supabase error mapping

### Supabase-Specific
- [RLS Policies](resources/rls-policies.md) - Row Level Security patterns for shared team access
- [Edge Functions](resources/edge-functions.md) - Deno.serve patterns and service role operations
- [Query Optimization](resources/query-optimization.md) - Indexing, pagination, and view optimization

### CRM Business Logic
- [Organizations](resources/organizations.md) - Hierarchy validation, rollup metrics, and deletion protection

### Future Resources (Coming Soon)
- Contacts - Multi-organization relationships and JSONB arrays
- Opportunities - Stage workflows and product management
- Activities - Interaction tracking and reporting
- Migrations - Schema evolution and best practices
- Real-time Subscriptions - Live data updates
- Storage Patterns - File uploads and management
- Testing - Service layer and database testing

## Key Conventions

### File Naming
- Service classes: `<entity>.service.ts` (e.g., `organizations.service.ts`)
- Edge Functions: `supabase/functions/<function-name>/index.ts`
- Migrations: `supabase/migrations/YYYYMMDDHHMMSS_<description>.sql`
- RPC schemas: `src/validation/rpc.ts`

### TypeScript Patterns
```typescript
// Always use DataProvider, never direct Supabase client
// ✅ GOOD
const { data } = await this.dataProvider.create('organizations', { data });

// ❌ BAD - bypasses composable entry point
const { data } = await supabase.from('organizations').insert(data);
```

### SQL Patterns
```sql
-- Always include audit fields
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMPTZ,

-- Always use soft delete (deleted_at IS NULL in queries)
-- Never use WHERE deleted_at IS NULL in policies (performance)
```

### Validation Patterns
```typescript
// Define schema once, infer types
const CreateOrgSchema = z.object({
  name: z.string().min(1),
  org_type: z.enum(['restaurant', 'distributor', 'supplier'])
});

type CreateOrgInput = z.infer<typeof CreateOrgSchema>;

// Use in service
const validated = CreateOrgSchema.parse(input);
```

## Common Operations

### Creating a New Service

```typescript
import type { DataProvider } from 'ra-core';
import { z } from 'zod';

// 1. Define validation schemas
const CreateSchema = z.object({
  // fields
});

const UpdateSchema = CreateSchema.partial();

// 2. Define types from schemas
type CreateInput = z.infer<typeof CreateSchema>;
type UpdateInput = z.infer<typeof UpdateSchema>;

// 3. Create service class
export class EntityService {
  constructor(private dataProvider: DataProvider) {}

  async create(input: CreateInput): Promise<Entity> {
    const validated = CreateSchema.parse(input);
    // Business logic
    const { data } = await this.dataProvider.create('entities', { data: validated });
    return data;
  }

  async update(id: string, input: UpdateInput): Promise<Entity> {
    const validated = UpdateSchema.parse(input);
    // Business logic
    const { data } = await this.dataProvider.update('entities', { id, data: validated });
    return data;
  }
}
```

### Creating an Edge Function

```bash
# 1. Create function directory
supabase functions new my-function

# 2. Implement in supabase/functions/my-function/index.ts
# (See Edge Functions resource for template)

# 3. Deploy
supabase functions deploy my-function
```

### Creating a Migration

```bash
# 1. Create migration file
supabase migration new add_entity_table

# 2. Write SQL in generated file
# (See Migrations resource for template)

# 3. Apply migration
supabase db push
```

## Performance Considerations

### Indexes
- Always index foreign keys
- Index columns used in WHERE clauses
- Use composite indexes for multi-column queries
- Index DESC for ORDER BY DESC queries

### RLS Performance
- Avoid `deleted_at IS NULL` in policies (use in queries instead)
- Use indexes on columns referenced in policies
- Keep policies simple (complex logic in Edge Functions)

### Query Optimization
- Use `.select()` to specify only needed columns
- Batch operations when possible
- Use `.maybeSingle()` instead of `.single()` for optional queries
- Leverage Postgres EXPLAIN ANALYZE for slow queries

## Troubleshooting

### Supabase CLI Connection Issues (WSL2)

#### PRIMARY SOLUTION: Password-Based Authentication

**Why this is required for WSL2:**
The Supabase CLI's default passwordless auth uses an internal `cli_login_postgres` role via the connection pooler (Supavisor). In WSL2, connection hangs/timeouts are counted as failed auth attempts, triggering Fail2ban after just **2 failed attempts** (30-minute ban). Password-based auth uses a more stable authentication path.

**Setup (one-time):**

1. **Add to `.env` file** (already gitignored):
   ```bash
   # Supabase CLI password auth (prevents IP bans from passwordless auth failures)
   SUPABASE_DB_PASSWORD=your-database-password
   ```

2. **Source before running CLI commands:**
   ```bash
   source .env && npx supabase db push
   source .env && npx supabase migration list --linked
   ```

3. **Or export in your shell session:**
   ```bash
   export SUPABASE_DB_PASSWORD='your-database-password'
   npx supabase db push
   ```

**The CLI automatically reads `SUPABASE_DB_PASSWORD` from environment.**

---

#### Check/Remove IP Bans (When Timeouts Occur)

**Symptoms:** Connection hangs at "Initialising login role..." or "Connecting to remote database..."

**Check for bans:**
```bash
npx supabase network-bans get --project-ref aaqnanddcqvfiwhshndl --experimental
```

**Remove ban:**
```bash
npx supabase network-bans remove --db-unban-ip <IP_ADDRESS> --project-ref aaqnanddcqvfiwhshndl --experimental
```

**Ban triggers:**
- 2 failed password attempts → 30-minute ban (Fail2ban)
- WSL2 connection timeouts count as failed attempts
- Supavisor credential caching bugs cause false failures

---

#### Alternative: MCP Tool (Bypasses CLI Issues)

When CLI is unavailable, use the Supabase MCP tool which uses REST API:
```
mcp__supabase__apply_migration  # For DDL operations
mcp__supabase__execute_sql      # For queries
mcp__supabase__list_tables      # Check schema
```

---

#### Migration History Mismatch

**Symptoms:** `remote migration versions not found in local migrations directory`

**Cause:** Migrations applied directly to cloud (via MCP or Dashboard) without syncing locally.

**Solution:**
```bash
# Mark remote-only as reverted (removes from remote history)
source .env && npx supabase migration repair --status reverted TIMESTAMP1 TIMESTAMP2 --linked

# Mark local-only as applied (adds to remote history without running SQL)
source .env && npx supabase migration repair --status applied TIMESTAMP1 TIMESTAMP2 --linked
```

---

#### IPv6 Not Supported Error

**Symptoms:** `dial tcp [2600:...]:5432: connect: network is unreachable`

**This is normal for WSL2** - it uses NAT networking without IPv6. The password-based auth (above) works around this by using the pooler which supports IPv4.

---

#### Password Not Set

**Symptoms:** `password authentication failed for user "postgres"`

**Solution:**
1. Go to Dashboard → Project Settings → Database → Reset database password
2. Update your `.env` file with the new password
3. Re-link: `npx supabase link --project-ref aaqnanddcqvfiwhshndl`

### RLS Policy Not Working
1. Check if RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. Verify policy applies to correct role (`TO authenticated`)
3. Test policy in SQL editor with: `SET ROLE authenticated; SELECT ...`
4. Check for missing indexes on policy columns

### Edge Function Failing
1. Check Deno logs: `supabase functions logs my-function`
2. Verify environment variables are set
3. Test locally: `supabase functions serve my-function`
4. Check CORS headers if calling from browser

### Service Layer Error
1. Verify DataProvider is initialized correctly
2. Check Zod validation errors
3. Review error logs from console.error statements
4. Ensure database schema matches TypeScript types

## Related Skills

- **crispy-design-system** - UI components that consume service layer
- **skill-developer** - Creating new skills for specific features

## Version

- Skill Version: 1.2
- Last Updated: 2025-11-29
- Crispy-CRM Target: MVP (Phase 1-3)

### Changelog
- **1.2** (2025-11-29): Added project-specific pooler URL (`aws-1-us-east-2`), "Tenant not found" troubleshooting, URL format breakdown
- **1.1** (2025-11-29): Added CLI Troubleshooting section for IPv6/WSL2, IP bans, migration repair, UTF-8 issues
- **1.0** (2025-11-13): Initial skill with service layer, RLS, Edge Functions, and migration patterns
