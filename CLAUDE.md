# CLAUDE.md

This file provides guidance to Claude Code (AI agent) when working with this repository.

## Project Overview

Atomic CRM is a full-featured, open-source CRM built with React, shadcn-admin-kit, and Supabase. The application manages contacts, organizations, opportunities (formerly deals), tasks, and notes with a modern, type-safe frontend and a PostgreSQL backend.

**Status:** Pre-launch phase (not live)

**Stack:** React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS 4

## Core Principles

See [Engineering Constitution](docs/claude/engineering-constitution.md) for complete details.

**Critical Rules:**
1. **NO OVER-ENGINEERING**: Fail fast, no circuit breakers
2. **SINGLE SOURCE OF TRUTH**: Supabase + Zod at API boundary
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
4. **FORM STATE FROM SCHEMA**: Use `zodSchema.partial().parse({})` for defaults
5. **SEMANTIC COLORS ONLY**: CSS variables (--primary, --brand-700), never hex codes
6. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS

## Database Workflows ⚠️ CRITICAL

### Local Development

```bash
npm run supabase:local:start   # Start Docker containers
npx supabase db reset          # Reset local DB (SAFE - local only)
npm run dev                    # Start dev server
```

**Access Points:**
- Studio: http://localhost:54323
- REST API: http://localhost:54321
- Email testing: http://localhost:54324

### Cloud/Production Deployment ⚠️

```bash
npm run db:cloud:push          # SAFE: Shows diff + requires confirmation
npx supabase db push           # SAFE: Only applies new migrations
npm run db:cloud:diff          # SAFE: Preview changes (read-only)
```

**❌ NEVER RUN ON PRODUCTION:**
```bash
npx supabase db reset --linked  # DELETES ALL DATA INCLUDING USERS!
```

### Creating Migrations

**Recommended: Migration-First Approach**

```bash
# 1. Create migration file
npx supabase migration new <descriptive_name>

# 2. Edit: supabase/migrations/YYYYMMDDHHMMSS_<name>.sql
# Add your SQL changes

# 3. Test locally
npx supabase db reset

# 4. Verify app works
npm run dev

# 5. Deploy to production
npm run db:cloud:push
```

**Example Migration:**
```sql
-- supabase/migrations/20250126143000_add_projects_table.sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

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

**Comprehensive Guides:**
- [Supabase Workflow Overview](docs/supabase/supabase_workflow_overview.md) ⭐ **Complete local + cloud guide**
- [Production Safety Guide](scripts/db/PRODUCTION-WARNING.md) ⚠️ **Must read before production changes**
- [Migration Business Rules](docs/database/migration-business-rules.md)
- [Supabase Commands Reference](docs/supabase/supabase_commands_reference.md)
- [Troubleshooting Guide](docs/supabase/supabase_troubleshooting.md)

## Essential Commands

**Top 5 Most-Used:**
```bash
npm run dev                    # Start dev server
npm test                       # Run tests (watch mode)
npx supabase db reset          # Reset local DB
npm run db:cloud:push          # Deploy migrations (PRODUCTION)
npm run lint:apply             # Auto-fix linting
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

## Support

- Report issues: https://github.com/marmelab/atomic-crm/issues
- License: MIT (courtesy of Marmelab)
