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

### Supabase CLI Connection Issues

#### IPv6 Not Supported (WSL2)
**Symptoms:** `dial tcp [2600:...]:5432: connect: network is unreachable`

**Cause:** WSL2 uses NAT networking which doesn't pass through IPv6 by default. Supabase direct DB connections require IPv6.

**Solutions:**
1. **Use pooler URL explicitly** (recommended for IPv4-only networks):
   ```bash
   npx supabase db push --db-url "postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
   ```

2. **Enable IPv6 mirroring in WSL2** (Windows 11 22H2+):
   Create `C:\Users\<Username>\.wslconfig`:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
   Then restart: `wsl --shutdown`

#### IP Temporarily Banned
**Symptoms:** `failed SASL auth (unexpected EOF)` or connection hangs

**Cause:** Repeated failed auth attempts trigger temporary network ban.

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → Database
2. Scroll to **Network Bans** section
3. Find and remove your IP (check with `curl ifconfig.me`)

#### Password Authentication Failed
**Symptoms:** `password authentication failed for user "postgres"`

**Cause:** Database password not set or incorrect.

**Solution:**
1. Reset password in Dashboard → Project Settings → Database → Reset database password
2. Link with password:
   ```bash
   npx supabase link --project-ref PROJECT_REF --password "YOUR_PASSWORD"
   ```

#### Migration History Mismatch
**Symptoms:** `remote migration versions not found in local migrations directory`

**Cause:** Migrations applied directly to cloud (via Dashboard SQL Editor) without syncing locally.

**Solution:**
```bash
# Mark remote-only as reverted
npx supabase migration repair --status reverted TIMESTAMP1 TIMESTAMP2 ... --db-url "..."

# Mark local-only as applied
npx supabase migration repair --status applied TIMESTAMP1 TIMESTAMP2 ... --db-url "..."
```

#### Invalid UTF-8 in Migration Files
**Symptoms:** `invalid byte sequence for encoding "UTF8": 0x92`

**Cause:** Migration file contains Windows smart quotes or other non-ASCII characters.

**Solution:**
```bash
# Find the bad file
file supabase/migrations/*.sql | grep -v ASCII

# Find the characters
cat -v <file> | grep "M-"

# Fix (replace 0x92 with arrow)
sed -i 's/\x92/->/g' supabase/migrations/<file>.sql
```

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

- Skill Version: 1.0
- Last Updated: 2025-11-13
- Crispy-CRM Target: MVP (Phase 1-3)
