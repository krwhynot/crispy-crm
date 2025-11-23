# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic CRM - Full-featured CRM with React, shadcn/ui, and Supabase. Manages contacts, organizations, opportunities, tasks, notes with type-safe frontend and PostgreSQL backend.

**Status:** Pre-launch | **Stack:** React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS v4

## Commands

### Development
```bash
npm run dev                # Dev server (uses cloud DB from .env)
npm run dev:local          # Reset local DB + seed + dev server (5 min)
npm run build              # Production build
npm run lint:apply         # Auto-fix lint/format issues
npm run validate:colors    # Check semantic color compliance
```

### Testing
```bash
npm test                   # Watch mode
npm run test:ci            # CI mode (single run)
npm run test:coverage      # Coverage report (70% minimum)
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:ui        # Playwright interactive mode
```

### Database
```bash
npx supabase migration new <name>  # Create migration
npm run db:cloud:push:dry-run      # Validate before deploy
npm run db:cloud:push              # Deploy to production
npm run db:cloud:status            # Migration history
npm run db:local:reset             # Reset local only (safe)
```

**⚠️ NEVER:** `npx supabase db reset --linked` (deletes cloud data)

## Core Principles

See [Engineering Constitution](docs/claude/engineering-constitution.md) for complete details.

1. **NO OVER-ENGINEERING**: Fail fast, no circuit breakers
2. **SINGLE SOURCE OF TRUTH**: Supabase + Zod at API boundary
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
   - Convert `type Foo = {...}` to `interface Foo {...}` when touching files
4. **FORM STATE FROM SCHEMA**: `zodSchema.partial().parse({})` for defaults
5. **SEMANTIC COLORS ONLY**: CSS vars (`--primary`, `--brand-700`), never hex
6. **TWO-LAYER SECURITY**: Tables need BOTH GRANT + RLS policies

## Architecture

```
main.tsx → App.tsx → atomic-crm/root/CRM.tsx
                          ↓
              <Resource> components (lazy-loaded)
                          ↓
         unifiedDataProvider.ts ←→ Supabase
```

### Key Locations

| Path | Purpose |
|------|---------|
| `src/atomic-crm/<resource>/` | Resource modules (List/Show/Edit/Create) |
| `src/atomic-crm/validation/` | Zod schemas for each resource |
| `src/atomic-crm/dashboard/v3/` | Default dashboard (PrincipalDashboardV3) |
| `src/components/ui/` | shadcn/ui atoms (Button, Badge, Card, etc.) |
| `src/atomic-crm/providers/supabase/` | Data + Auth providers |
| `supabase/migrations/` | Database migrations |

### Data Flow Pattern

```typescript
// 1. Database: JSONB arrays for multi-value fields
email JSONB DEFAULT '[]'::jsonb

// 2. Zod schema with sub-schema
const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home"]).default("Work"),
});
const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
});

// 3. Form defaults from Zod (not hardcoded)
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: schema.partial().parse({}),  // Zod generates defaults!
});
```

### Dashboard V3 (Default)

**Route:** `/` | **Layout:** 3-column resizable (40% | 30% | 30%)

**Organisms:**
- `PrincipalPipelineTable` - Aggregated pipeline with momentum indicators
- `TasksPanel` - Time-bucketed tasks (Overdue → Today → Tomorrow)
- `QuickLoggerPanel` - Activity logging with optional follow-up tasks

**Database view:** `principal_pipeline_summary` with activity-based momentum

**Auth pattern:** Uses `auth.getUser() + user.id` (not React Admin identity)

## Database Security

**CRITICAL:** PostgreSQL requires BOTH:
1. **GRANT** (table access)
2. **RLS policies** (row filtering)

**Common mistake:** RLS without GRANT = "permission denied"

```sql
-- Pattern for new tables
CREATE TABLE my_table (id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name TEXT);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;
CREATE POLICY select_my_table ON my_table FOR SELECT TO authenticated USING (true);
```

**Security patterns:**
- **Shared (contacts, orgs):** `USING (true)` - Team-wide access
- **Personal (tasks):** `USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))`
- **Admin-only:** `USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true)`

**⚠️ Cloud sync:** `npx supabase db pull` may strip GRANTs - always verify.

## Error Handling

**Use `Promise.allSettled()` for bulk operations:**
```typescript
const results = await Promise.allSettled(
  items.map(item => update("resource", { id: item.id, data: {...} }))
);
const successes = results.filter(r => r.status === "fulfilled").length;
const failures = results.filter(r => r.status === "rejected").length;
```

## CSV Upload Security

Always validate uploads to prevent formula injection:
```typescript
import { validateCsvFile, getSecurePapaParseConfig, sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

const validation = await validateCsvFile(selectedFile);
if (!validation.valid) { /* handle errors */ }

Papa.parse(file, {
  ...getSecurePapaParseConfig(),
  complete: async (results) => { /* sanitize all values */ }
});
```

## Adding Resources

1. Create `src/atomic-crm/<name>/` with List/Show/Edit/Create
2. Export via lazy-loaded `index.ts`:
   ```typescript
   const List = React.lazy(() => import("./List"));
   export default { list: List, show: Show, edit: Edit, create: Create };
   ```
3. Register in `CRM.tsx`: `<Resource name="..." {...module} />`
4. Create migration: `npx supabase migration new add_<name>_table`
5. Add to `filterRegistry.ts` if using filters

## Testing

**Framework:** Vitest + React Testing Library | **Coverage:** 70% minimum

**E2E:** Playwright with MCP integration for AI-assisted test generation

**Known issue:** Local Supabase may become unresponsive during E2E runs. Fix: `npx supabase stop && npx supabase start`

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Entry point, CRM configuration |
| `src/atomic-crm/root/CRM.tsx` | React Admin setup, routes |
| `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Data layer |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Authentication |
| `src/atomic-crm/providers/supabase/filterRegistry.ts` | Prevents stale filter errors |
| `supabase/seed.sql` | Test data (admin@test.com / password123) |

## Documentation

### Essential Reading
- [Engineering Constitution](docs/claude/engineering-constitution.md) - Core principles
- [Supabase Workflow](docs/supabase/WORKFLOW.md) - Database operations
- [Common Tasks](docs/development/common-tasks.md) - Step-by-step guides

### Architecture Reference
- [Design System](docs/architecture/design-system.md) - Colors, spacing, accessibility
- [Component Library](docs/architecture/component-library.md) - UI patterns
- [API Design](docs/architecture/api-design.md) - Data provider patterns
- [Business Rules](docs/architecture/business-rules.md) - Validation schemas

### Learning the Codebase
- [Atomic Learning Model](docs/atomic-learning/README.atomic-learning.md) - Progressive codebase study guide

## Recent Changes (Keep Updated Quarterly)

- **V1/V2 Cleanup (2025-11-22)**: Removed 34 legacy dashboard files, V3 is only version
- **Dashboard V3 (2025-11-18)**: Default dashboard with pipeline table, tasks panel, activity logger
- **Users List Fix (2025-11-16)**: Standardized on `role` enum ('admin', 'manager', 'rep')
- **Cloud-First Dev (2025-11-10)**: Migrated from local Docker to Supabase Cloud
- **Security Remediation (2025-11-08)**: RLS admin-only policies, CSV validation, WCAG 2.1 AA

## Design System Quick Reference

**Colors:** Semantic vars only (`--primary`, `--destructive`, `--brand-700`)
**Touch targets:** 44px minimum (WCAG AA)
**Spacing:** CSS custom properties in `src/index.css`
**Validate:** `npm run validate:colors`

## MCP Tools Available

- `mcp__serena__*` - Semantic code navigation (find_symbol, replace_symbol_body)
- `mcp__supabase-lite__*` - Database queries
- `mcp__zen__*` - AI thinking/debugging
- `mcp__context7__*` - Library documentation lookup
- `mcp__sequential-thinking__*` - Complex reasoning chains

## Slash Commands

See `.claude/commands/` for full list. Key commands:
- `/plan:requirements` - Feature planning
- `/design-system` - Quick design reference
- `/role:supabase-data-explorer` - Database exploration

---

## Quick Context Loading

For efficient session startup, read `PROJECT_INDEX.md` first (~2,500 tokens vs ~58,000 for full codebase).

**Serena MCP memories** available for cross-session context:
- `project_overview`, `code_style_conventions`, `database_security`
