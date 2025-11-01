# CLAUDE.md

This file provides guidance to Claude Code (AI agent) when working with this repository.

## Project Overview

Atomic CRM is a full-featured, open-source CRM built with React, shadcn-admin-kit, and Supabase. The application manages contacts, organizations, opportunities (formerly deals), tasks, and notes with a modern, type-safe frontend and a PostgreSQL backend.

**Status:** Pre-launch phase (not live)

**Stack:** React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS 4

## Recent Architectural Changes

> **Note:** This section documents changes from the last 90 days. Older changes are archived in git history.

### Pricing Removal (2025-10-29)

**Decision**: Removed all pricing functionality from products and opportunities to simplify the data model to product association tracking only.

**What was removed:**
- Products table: `list_price`, `currency_code`, `unit_of_measure` columns
- Opportunity-products junction: `quantity`, `unit_price`, `discount_percent` columns
- All pricing-related UI components and validation schemas
- Duplicate product functionality (was non-functional/disabled)

**Current product model:**
- **Products**: Catalog items with name, SKU, category, description, status
- **Opportunity-products**: Simple association tracking with optional notes

**Rationale**: Pricing is highly dynamic and varies per customer, distributor, and context. Storing static pricing in the product catalog created complexity without adding value. Price negotiation and quotes are better handled outside the product catalog.

**Migration**: See `supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql`

## Core Principles

See [Engineering Constitution](docs/claude/engineering-constitution.md) for complete details.

**Critical Rules:**
1. **NO OVER-ENGINEERING**: Fail fast, no circuit breakers
2. **SINGLE SOURCE OF TRUTH**: Supabase + Zod at API boundary
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
4. **FORM STATE FROM SCHEMA**: Use `zodSchema.partial().parse({})` for defaults
5. **SEMANTIC COLORS ONLY**: CSS variables (--primary, --brand-700), never hex codes
6. **MIGRATIONS**: Always use `npx supabase migration new <name>` to generate correctly timestamped files
7. **TWO-LAYER SECURITY**: All tables need BOTH GRANT permissions AND RLS policies (see Database Security section)

## Database Workflows ⚠️ CRITICAL

**📖 See [docs/supabase/WORKFLOW.md](docs/supabase/WORKFLOW.md) for the complete database workflow guide.**

### Quick Reference

```bash
# Local Development
npm run db:local:start    # Start local Supabase
npm run db:local:reset    # Reset & seed database (runs supabase/seed.sql automatically)
npm run dev               # Start UI (uses local DB)

# Creating Migrations
npx supabase migration new <name>  # Create migration file

# Cloud Deployment
npm run db:cloud:push     # Deploy migrations to cloud
```

### Seed Data - Single Source of Truth

**⚠️ CRITICAL:** There is ONLY ONE seed file: `supabase/seed.sql`

- Runs automatically after migrations during `npm run db:local:reset`
- Seeds test user (admin@test.com / password123) and 16 principal organizations
- **DO NOT** create separate seed scripts or commands
- **DO NOT** use external CSV imports for core seed data
- Add new seed data directly to `supabase/seed.sql`

**❌ NEVER RUN ON PRODUCTION:**
```bash
npx supabase db reset --linked  # DELETES ALL DATA INCLUDING USERS!
```

### 🔒 Database Security - Two-Layer Model

**⚠️ CRITICAL:** PostgreSQL security requires BOTH table permissions AND RLS policies.

**Two-Layer Security Architecture:**

1. **Layer 1: Table Permissions (GRANT)** - Controls which roles can access tables
2. **Layer 2: Row Level Security (RLS)** - Filters which rows users can see/modify

**❌ Common Mistake:** Adding RLS policies without GRANT permissions results in "permission denied" errors. RLS can only *restrict* access, not *grant* it.

**✅ Correct Pattern for New Tables:**
```sql
-- Step 1: Create table
CREATE TABLE my_table (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Step 3: GRANT base permissions to authenticated role (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;

-- Step 4: Create RLS policies for row filtering (Layer 2)
CREATE POLICY authenticated_select_my_table ON my_table
  FOR SELECT TO authenticated
  USING (true);  -- Shared access for team

CREATE POLICY authenticated_insert_my_table ON my_table
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_update_my_table ON my_table
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY authenticated_delete_my_table ON my_table
  FOR DELETE TO authenticated
  USING (true);
```

**Security Patterns in This Project:**

- **Shared Resources** (contacts, organizations, opportunities): `USING (true)` - all team members can access
- **Personal Resources** (tasks): `USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))` - only creator can access

**⚠️ Cloud Schema Sync Warning:**

When pulling cloud schema with `npx supabase db pull`, the generated migration may contain:
- `REVOKE ... FROM authenticated` statements that strip permissions
- Missing `GRANT` statements to restore them

**Always verify migrations include GRANT statements** or add them manually:
```sql
-- Restore permissions after schema sync
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

**Reference Migrations:**
- Table permissions: `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- RLS policies: `supabase/migrations/20251018203500_update_rls_for_shared_team_access.sql`
- Permission grants: `supabase/migrations/20251029070224_grant_authenticated_permissions.sql`

### ⚠️ Auth Schema Exclusion Warning

Supabase's `db diff` and `db dump` commands **exclude the `auth` schema by design**:
- Triggers on `auth.users` will NOT be captured
- Functions used by auth triggers must be manually added to migrations
- Always verify auth-related objects after running `db diff`

**Example: Missing auth trigger**
```sql
-- Must manually add to migration if you create auth triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_sales_from_user();
```

### Complete Database Documentation

**Single Source of Truth:**
- [Supabase Workflow Guide](docs/supabase/WORKFLOW.md) ⭐ **THE ONLY GUIDE YOU NEED**
- [Production Safety Guide](scripts/db/PRODUCTION-WARNING.md) ⚠️ **Must read before production changes**
- [Migration Business Rules](docs/database/migration-business-rules.md)

## Essential Commands

**Quick Start (One Command):**
```bash
npm run dev:local              # Reset DB + seed + start dev server (complete setup)
```

**Development (Most-Used):**
```bash
npm run dev                    # Start dev server only
npm test                       # Run tests (watch mode)
npm run lint:apply             # Auto-fix linting
```

**Database:**
```bash
npx supabase db reset          # Reset local DB (runs seed.sql automatically)
npm run db:cloud:push          # Deploy migrations (PRODUCTION - use with care)
npx supabase migration new <name>  # Create timestamped migration file
```

**Complete Command Reference:** [Commands Quick Reference](docs/claude/commands-quick-reference.md)

## Architecture Essentials

**Entry Flow:** `main.tsx` → `App.tsx` → `atomic-crm/root/CRM.tsx`

**Module Pattern:**
- Each resource: `src/atomic-crm/<resource>/` with List/Show/Edit/Create
- Lazy-loaded exports via `index.ts`
- React Admin + react-hook-form + Zod validation

**Data Layer:**
- Provider: `providers/supabase/unifiedDataProvider.ts`
- Auth: `providers/supabase/authProvider.ts`
- Database: Views (aggregated data) + Triggers (auth sync) + Edge Functions

**Validation Layer:**
- Location: `src/atomic-crm/validation/<resource>.ts`
- Pattern: "UI as source of truth" - only validate fields with UI inputs
- Base schemas + derived schemas (insert/update variants)
- JSONB arrays: Use sub-schemas (e.g., `emailAndTypeSchema`, `phoneNumberAndTypeSchema`)

**Filter Validation:**
- Registry: `providers/supabase/filterRegistry.ts` defines valid filterable fields per resource
- Prevents 400 errors from stale cached filters referencing non-existent columns
- Update when schema changes affect filterable columns
- Used by: ValidationService (API layer) + useFilterCleanup hook (UI layer)

**JSONB Array Handling Pattern:**

PostgreSQL JSONB arrays require a three-layer approach: database structure, validation schemas, and form components.

**1. Database Structure:**
```sql
-- Store arrays of objects with value + type fields
email JSONB DEFAULT '[]'::jsonb,  -- [{"email": "user@example.com", "type": "Work"}]
phone JSONB DEFAULT '[]'::jsonb   -- [{"number": "555-1234", "type": "Home"}]
```

**2. Validation Layer (Zod sub-schemas):**
```typescript
// src/atomic-crm/validation/contacts.ts
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// In resource schema:
const contactBaseSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),  // Empty array default
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  // ... other fields
});
```

**3. Form Components (React Admin):**
```typescript
<ArrayInput source="email" label="Email addresses">
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="email" placeholder="Email (valid email required)" />
    <SelectInput source="type" choices={personalInfoTypes} />
    {/* NO defaultValue prop - defaults come from Zod schema (Constitution #5) */}
  </SimpleFormIterator>
</ArrayInput>
```

**Key Patterns:**
- **Sub-schemas**: Create reusable schemas for array items (`emailAndTypeSchema`)
- **Enum types**: Use `z.enum()` for type dropdowns
- **Default values**: Set in Zod schema (`.default("Work")`), NOT in form components
- **Empty arrays**: Initialize with `.default([])` in schema
- **Form state**: Use `zodSchema.partial().parse({})` for initialization (Constitution #4)

**Example: Adding a new JSONB array field**
```typescript
// 1. Database migration
ALTER TABLE contacts ADD COLUMN addresses JSONB DEFAULT '[]'::jsonb;

// 2. Validation schema
export const addressAndTypeSchema = z.object({
  street: z.string(),
  city: z.string(),
  type: z.enum(["Home", "Work", "Other"]).default("Home"),
});

const contactSchema = z.object({
  addresses: z.array(addressAndTypeSchema).default([]),
});

// 3. Form component
<ArrayInput source="addresses">
  <SimpleFormIterator>
    <TextInput source="street" />
    <TextInput source="city" />
    <SelectInput source="type" choices={addressTypes} />
  </SimpleFormIterator>
</ArrayInput>
```

**Configuration:** `root/ConfigurationContext.tsx` - customize via `<CRM>` props in `App.tsx`

**Path Alias:** `@/*` maps to `src/*`

**Complete Architecture:** [Architecture Essentials](docs/claude/architecture-essentials.md)

## Color System

**Brand:** MFB "Garden to Table" Theme (earth-tone OKLCH, warm cream #FEFEF9)
- Primary Brand: Lime Green (--brand-500)
- Primary Actions: Clay Orange (--accent-clay-600)
- Background: Warm cream oklch(99% 0.015 85)

**Rules:**
- Use semantic variables ONLY: `--primary`, `--brand-700`, `--destructive`
- Never use hex codes or direct OKLCH in components
- Validate: `npm run validate:colors`

**Complete Color System:** [Color Theming Architecture](docs/internal-docs/color-theming-architecture.docs.md)

## Common Development Tasks

### Adding a New Resource

1. Create module in `src/atomic-crm/<resource-name>/`
2. Create List/Show/Edit/Create (lazy-loaded)
3. Export via `index.ts` with `recordRepresentation`
4. Register in `CRM.tsx`: `<Resource name="..." {...resourceModule} />`
5. Create migration: `npx supabase migration new add_<resource>_table`
6. Update data provider filters if needed in `filterRegistry.ts`

**Resource Module Pattern (`index.ts`):**
```typescript
import * as React from "react";

const ResourceList = React.lazy(() => import("./ResourceList"));
const ResourceShow = React.lazy(() => import("./ResourceShow"));
const ResourceEdit = React.lazy(() => import("./ResourceEdit"));
const ResourceCreate = React.lazy(() => import("./ResourceCreate"));

export default {
  list: ResourceList,
  show: ResourceShow,
  edit: ResourceEdit,
  create: ResourceCreate,
  recordRepresentation: (record) => record.name, // or formatName(record.first_name, record.last_name)
};
```

**Complete Guide:** [Common Tasks](docs/claude/common-tasks.md)

### Customizing the CRM

All customization happens via props to `<CRM>` in `src/App.tsx`:

```typescript
<CRM
  title="My Custom CRM"
  opportunityStages={[
    { value: 'lead', label: 'New Lead' },
    { value: 'qualified', label: 'Qualified' }
  ]}
  contactGender={[{ value: 'male', label: 'He/Him' }]}
/>
```

**Complete Guide:** [Common Tasks](docs/claude/common-tasks.md#customizing-the-crm)

## Testing

**Framework:** Vitest + React Testing Library
**Coverage:** 70% minimum (statements, branches, functions, lines)

```bash
npm test                 # Watch mode
npm run test:coverage    # Generate report
npm run test:e2e         # Playwright E2E
```

**Test Locations:**
- Unit/integration: `src/**/*.test.{ts,tsx}`
- E2E: `tests/e2e/`
- Fixtures: `tests/fixtures/`

**Complete Testing Guide:** [Testing Quick Reference](docs/claude/testing-quick-reference.md)

## Key File Locations

| File | Purpose |
|------|---------|
| [src/App.tsx](src/App.tsx) | Entry point - customize CRM |
| [src/atomic-crm/root/CRM.tsx](src/atomic-crm/root/CRM.tsx) | Root component |
| [providers/supabase/unifiedDataProvider.ts](src/atomic-crm/providers/supabase/unifiedDataProvider.ts) | Data layer |
| [providers/supabase/authProvider.ts](src/atomic-crm/providers/supabase/authProvider.ts) | Auth logic |
| [supabase/migrations/](supabase/migrations/) | Schema versions |
| [vite.config.ts](vite.config.ts) | Build config |
| [src/atomic-crm/validation/](src/atomic-crm/validation/) | Zod schemas |

## Documentation Map

**Claude Code (AI) Guidance:**
- [Engineering Constitution](docs/claude/engineering-constitution.md) - Core principles with examples
- [Commands Quick Reference](docs/claude/commands-quick-reference.md) - All CLI commands
- [Architecture Essentials](docs/claude/architecture-essentials.md) - System design patterns
- [Common Tasks](docs/claude/common-tasks.md) - Step-by-step guides
- [Testing Quick Reference](docs/claude/testing-quick-reference.md) - Testing patterns

**Database Workflows (Priority):**
- [Supabase Workflow Overview](docs/supabase/supabase_workflow_overview.md) ⭐ Complete local + cloud guide
- [Production Safety Guide](scripts/db/PRODUCTION-WARNING.md) ⚠️ Must read
- [Migration Business Rules](docs/database/migration-business-rules.md)
- [Commands Reference](docs/supabase/supabase_commands_reference.md)
- [Troubleshooting](docs/supabase/supabase_troubleshooting.md)

**Human-Focused Documentation:**
- [README.md](README.md) - Features, installation, quick start
- [User Documentation](doc/user/) - End-user guides
- [Developer Documentation](doc/developer/) - Customization, deployment
- [Testing Documentation](.docs/testing/) - Complete testing strategy