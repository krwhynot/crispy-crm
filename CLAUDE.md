# CLAUDE.md

This file provides guidance to Claude Code (AI agent) when working with this repository.

## Project Overview

Atomic CRM - Full-featured, open-source CRM with React, shadcn-admin-kit, and Supabase. Manages contacts, organizations, opportunities, tasks, notes with type-safe frontend and PostgreSQL backend.

**Status:** Pre-launch | **Stack:** React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS 4

## Recent Changes (90 days)

- **Tasks Module + Weekly Activity Report (2025-11-09)**: Complete Tasks CRUD with principal-grouped list view, full test coverage (43 unit tests + 6 E2E tests), filterRegistry integration. Weekly Activity Report groups activities by rep → principal with CSV export. Known issue: Duplicate validation files (`task.ts` current, `tasks.ts` legacy with 28 tests - cleanup pending). Plan: `docs/plans/2025-11-09-tasks-module-weekly-activity-report.md`
- **Spacing System Phase 1 (2025-11-08)**: Semantic spacing tokens for consistent layouts. CSS custom properties in `src/index.css` for grid, edge padding, vertical rhythm. Applied to Reports Module. Design: `docs/plans/2025-11-08-spacing-layout-system-design.md`
- **Security & Testing Remediation (2025-11-08)**: 4-phase remediation complete - RLS admin-only policies, CSV validation, 65 new tests (95.4% pass rate), WCAG 2.1 AA compliance, Promise.allSettled error handling
- **Principal-Centric Redesign v2.0 (2025-11-05)**: Dashboard → table view, 2 MVP reports (Opportunities by Principal ⭐, Weekly Activity Summary), 30-day Excel replacement goal. Design: `docs/plans/2025-11-05-principal-centric-crm-design.md`
- **Pricing Removal (2025-10-29)**: Products = associations only, no pricing. Migration: `20251028040008_remove_product_pricing_and_uom.sql`
- **Deal → Opportunity (v0.2.0)**: Multi-participant support, activity tracking

## Core Principles

See [Engineering Constitution](docs/claude/engineering-constitution.md) for complete details.

**Critical Rules:**
1. **NO OVER-ENGINEERING**: Fail fast, no circuit breakers
2. **SINGLE SOURCE OF TRUTH**: Supabase + Zod at API boundary
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
   - **TypeScript**: Convert `type Foo = {...}` to `interface Foo {...}` when touching files
   - **ESLint enforces**: `@typescript-eslint/consistent-type-definitions` rule
   - **22 files pending**: Incremental cleanup via Boy Scout Rule (see eslint.config.js)
4. **FORM STATE FROM SCHEMA**: `zodSchema.partial().parse({})` for defaults
5. **SEMANTIC COLORS ONLY**: CSS vars (--primary, --brand-700), never hex
6. **MIGRATIONS**: Use `npx supabase migration new <name>`
7. **TWO-LAYER SECURITY**: Tables need BOTH GRANT + RLS (see below)

## Database Workflows ⚠️

**📖 Complete guide:** [docs/supabase/WORKFLOW.md](docs/supabase/WORKFLOW.md)

### Quick Commands

```bash
# Local Dev
npm run db:local:start    # Start Supabase
npm run db:local:reset    # Reset + seed (supabase/seed.sql)
npm run dev               # Start UI

# Migrations
npx supabase migration new <name>

# Cloud (PRODUCTION)
npm run db:cloud:push     # Deploy migrations
```

### Seed Data

**⚠️ ONLY ONE seed file:** `supabase/seed.sql` (test user: admin@test.com / password123, 16 orgs)
**❌ NEVER:** `npx supabase db reset --linked` (DELETES ALL PRODUCTION DATA)

### 🔒 Two-Layer Security

**CRITICAL:** PostgreSQL needs BOTH:
1. **GRANT** (table access)
2. **RLS policies** (row filtering)

❌ **Common mistake:** RLS without GRANT = "permission denied"

**Pattern for new tables:**
```sql
CREATE TABLE my_table (id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name TEXT);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;
CREATE POLICY select_my_table ON my_table FOR SELECT TO authenticated USING (true);
-- Repeat for INSERT, UPDATE, DELETE
```

**Security patterns:**
- **Shared (contacts, orgs):** `USING (true)` - Team-wide read/write access
- **Personal (tasks):** `USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))`
- **Admin-only (UPDATE/DELETE):** `USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true)`
  - Applied to: contacts, organizations, opportunities, contactNotes, opportunityNotes, products
  - Prevents non-admin users from modifying/deleting shared data
  - Reference: `20251108213039_fix_rls_policies_role_based_access.sql`

**⚠️ Cloud sync:** `npx supabase db pull` may strip GRANTs - always verify and restore:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

**Reference migrations:**
- `20251018152315_cloud_schema_fresh.sql` - Initial schema
- `20251018203500_update_rls_for_shared_team_access.sql` - Team access
- `20251108213039_fix_rls_policies_role_based_access.sql` - Admin-only restrictions
- `20251108213216_cleanup_duplicate_rls_policies.sql` - Remove permissive duplicates

### 🛡️ CSV Upload Security

**CRITICAL:** Always validate CSV uploads to prevent formula injection, DoS, binary uploads.

**Pattern for CSV imports:**
```typescript
import { validateCsvFile, getSecurePapaParseConfig, sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

// 1. Validate file before processing
const validation = await validateCsvFile(selectedFile);
if (!validation.valid && validation.errors) {
  setValidationErrors(validation.errors);
  return;
}

// 2. Use secure Papa Parse config
Papa.parse(file, {
  ...getSecurePapaParseConfig(),  // Disables dynamic typing, limits preview
  complete: async (results) => { /* ... */ }
});

// 3. Sanitize all cell values
const transformRowData = (row: any) => ({
  name: sanitizeCsvValue(row.name),
  description: sanitizeCsvValue(row.description),
  // Sanitize ALL string fields
});
```

**What it prevents:**
- Formula injection (`=cmd|'/c calc'!A0` → `'=cmd|'/c calc'!A0`)
- Binary file uploads (JPEG, ZIP magic byte detection)
- Control character injection (`\x00`, `\x01`)
- Oversized files (10MB limit)

**Reference:** `src/atomic-crm/utils/csvUploadValidator.ts`, `src/atomic-crm/utils/__tests__/csvUploadValidator.test.ts` (26 tests)

### ⚠️ Auth Schema Exclusion

`db diff` excludes `auth` schema - manually add auth triggers to migrations.

**Complete docs:** [Supabase Workflow](docs/supabase/WORKFLOW.md), [Production Safety](scripts/db/PRODUCTION-WARNING.md)

## Error Handling Patterns

### Promise.allSettled for Bulk Operations

**CRITICAL:** Use `Promise.allSettled()` instead of `Promise.all()` for bulk operations to handle partial failures gracefully.

**Pattern for bulk updates/creates:**
```typescript
// ❌ BAD: Promise.all() fails completely if one operation fails
const results = await Promise.all(
  items.map(item => update("resource", { id: item.id, data: { status: "active" } }))
);

// ✅ GOOD: Promise.allSettled() handles partial failures
const results = await Promise.allSettled(
  items.map(item => update("resource", { id: item.id, data: { status: "active" } }))
);

// Count successes and failures
const successes = results.filter(r => r.status === "fulfilled").length;
const failures = results.filter(r => r.status === "rejected").length;

// Provide informative user feedback
if (failures === 0) {
  notify(`${successes} items updated`, { type: "success" });
} else if (successes > 0) {
  notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
} else {
  notify("All updates failed", { type: "error" });
}
```

**When to use:**
- Bulk updates/deletes (notifications, contacts, opportunities)
- Parallel fetches that don't depend on each other
- Import operations with multiple records
- Any operation where partial success is acceptable

**Reference implementations:**
- `src/atomic-crm/notifications/NotificationsList.tsx:214` - Bulk mark as read
- `src/atomic-crm/contacts/useContactImport.tsx:160` - Parallel organization/tag fetch
- `src/atomic-crm/contacts/useContactImport.tsx:372` - Bulk record creation

## Essential Commands

**Quick Start:** `npm run dev:local` (reset DB + seed + dev server)

**Development:**
```bash
npm run dev                # Dev server
npm test                   # Tests (watch)
npm run lint:apply         # Auto-fix
```

**Database:**
```bash
npx supabase db reset          # Reset local
npm run db:cloud:push          # Deploy (PRODUCTION)
npx supabase migration new <name>
```

[Full commands](docs/development/commands-quick-reference.md)

## Architecture

**Entry:** `main.tsx` → `App.tsx` → `atomic-crm/root/CRM.tsx`

**Resources:** `src/atomic-crm/<resource>/` with List/Show/Edit/Create (lazy-loaded via `index.ts`)

**Data Layer:**
- Provider: `providers/supabase/unifiedDataProvider.ts`
- Auth: `providers/supabase/authProvider.ts`
- DB: Views + Triggers + Edge Functions

**Validation:** `src/atomic-crm/validation/<resource>.ts` - UI-driven Zod schemas

**Filters:** `providers/supabase/filterRegistry.ts` prevents 400 errors from stale filters

**JSONB Arrays Pattern** (email/phone/etc):

```sql
-- 1. Database
email JSONB DEFAULT '[]'::jsonb
```

```typescript
// 2. Zod sub-schema
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home"]).default("Work"),
});
const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
});

// 3. Form (NO defaultValue - comes from Zod)
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={types} />
  </SimpleFormIterator>
</ArrayInput>
```

**Key:** Sub-schemas, `.default()` in Zod (not forms), `zodSchema.partial().parse({})` for init

**Config:** `root/ConfigurationContext.tsx`, customize via `<CRM>` props in `App.tsx`
**Path alias:** `@/*` → `src/*`

[Full architecture](docs/architecture/architecture-essentials.md)

## Color System

**Brand:** MFB "Garden to Table" (earth OKLCH, warm cream)

**Rules:**
- Use semantic vars: `--primary`, `--brand-700`, `--destructive`
- Never hex/direct OKLCH
- Validate: `npm run validate:colors`

[Complete system](docs/internal-docs/color-theming-architecture.docs.md)

## Spacing System

**Semantic Spacing:** CSS custom properties for consistent layouts across iPad/desktop breakpoints.

**Location:** `src/index.css` (lines 72-96) in `@theme` layer

**Tokens:**
- **Grid:** `--spacing-grid-columns-{desktop|ipad}`, `--spacing-gutter-{desktop|ipad}`
- **Edge Padding:** `--spacing-edge-{desktop|ipad|mobile}` (screen borders)
- **Vertical Rhythm:** `--spacing-section` (32px), `--spacing-widget` (24px), `--spacing-content` (16px), `--spacing-compact` (12px)
- **Widget Internals:** `--spacing-widget-padding` (20px), `--spacing-widget-min-height` (280px)

**Breakpoints:** Mobile (375-767px), iPad (768-1024px), Desktop (1440px+)

**Pattern:**
```css
/* ✅ Semantic spacing */
padding: var(--spacing-widget-padding);
gap: var(--spacing-content);
margin-bottom: var(--spacing-section);

/* ❌ Hardcoded pixel values */
padding: 20px;
gap: 16px;
```

**Status:** Phase 1 complete (Reports Module). Incremental rollout to other modules.

[Design docs](docs/plans/2025-11-08-spacing-layout-system-design.md)

## Adding Resources

1. Create `src/atomic-crm/<name>/` with List/Show/Edit/Create
2. Export via `index.ts`:
```typescript
const List = React.lazy(() => import("./List"));
// ... Show, Edit, Create
export default { list: List, show: Show, edit: Edit, create: Create, recordRepresentation: r => r.name };
```
3. Register in `CRM.tsx`: `<Resource name="..." {...module} />`
4. Migration: `npx supabase migration new add_<name>_table`
5. Update `filterRegistry.ts` if needed

[Full guide](docs/development/common-tasks.md)

## Customizing CRM

Props to `<CRM>` in `App.tsx`:
```typescript
<CRM title="My CRM" opportunityStages={[...]} contactGender={[...]} />
```

[Full guide](docs/development/common-tasks.md#customizing-the-crm)

## Testing

**Framework:** Vitest + React Testing Library | **Coverage:** 70% min

```bash
npm test                 # Watch mode
npm run test:coverage    # Coverage report
npm run test:ci          # Run once (for CI)
```

**Locations:** `src/**/*.test.{ts,tsx}`

### E2E Testing (Playwright)

**Framework:** Playwright | **Location:** `tests/e2e/`, `tests/fixtures/`

```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Visible browser mode
```

**Test Strategy:** Critical user journeys (auth, CRUD operations, reports, data import/export)

**Configuration:** `playwright.config.ts`

[Full guide](docs/development/testing-quick-reference.md)

## GitHub Actions Workflows

**Location:** `.github/workflows/`

**Active Workflows:**
- **ci.yml** - Runs on push/PR: Lint, unit tests (70% coverage minimum), type-check, build
- **security.yml** - Weekly security scans: Gitleaks (secret detection) + npm audit (high/critical vulnerabilities)
- **supabase-deploy.yml** - Database deployment pipeline:
  1. **Validate** - Run pre-migration validation framework
  2. **Dry Run** - Test migrations against production schema
  3. **Deploy** - Manual approval required (`workflow_dispatch`)

**Key Details:**
- All workflows use **Node 22** for consistency
- Production deployments require manual trigger via GitHub UI
- Deployment includes automatic validation, dry-run verification, and post-deployment checks
- Security scans run weekly (Monday 9 AM UTC) + on every push

**⚠️ Production Safety:** Supabase deployments are manual-only to prevent accidental schema changes. Backup step is documented but requires implementation of `migrate:backup` script.

## Slash Commands

**Planning:** `/plan:requirements`, `/plan:parallel`, `/role:planner`
**Execution:** `/execute:implement-plan`, `/design-system`
**Analysis:** `/report:constitution-audit`, `/report:refactor`, `/research:troubleshooting`
**Database:** `/role:supabase-data-explorer`

See `.claude/commands/` for complete list.

## MCP Tools

**Database:** `mcp__supabase-lite__*` (SQL, tables, cloud query)
**AI:** `mcp__zen__*` (thinking), `mcp__perplexity-ask__*` (search), `mcp__memory__*` (context)
**IDE:** `mcp__ide__getDiagnostics`, `mcp__ide__executeCode`

## Project Planning

Plans in `docs/plans/` track design, status, QA readiness. **Phase:** Pre-launch (Phase 1 complete).

**Current Design:** [Principal-Centric CRM v2.0](docs/plans/2025-11-05-principal-centric-crm-design.md) - 30-day Excel replacement goal, 2 MVP reports (Opportunities by Principal ⭐, Weekly Activity Summary), table-based dashboard.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Entry - customize CRM |
| `src/atomic-crm/root/CRM.tsx` | Root component |
| `providers/supabase/unifiedDataProvider.ts` | Data layer |
| `providers/supabase/authProvider.ts` | Auth |
| `supabase/migrations/` | Schema versions |
| `src/atomic-crm/validation/` | Zod schemas |

## Documentation

**Start here:**
- [Engineering Constitution](docs/claude/engineering-constitution.md) ⭐ Principles
- [Architecture Essentials](docs/architecture/architecture-essentials.md) - Design
- [Common Tasks](docs/development/common-tasks.md) - Guides

**Foundational Architecture (Source of Truth):**
- [Design System](docs/architecture/design-system.md) ⭐ Colors, spacing, typography, accessibility
- [Database Schema](docs/architecture/database-schema.md) ⭐ Tables, relationships, RLS, migrations
- [Component Library](docs/architecture/component-library.md) - All UI components and patterns
- [API Design](docs/architecture/api-design.md) - Data provider, validation, error handling
- [Business Rules](docs/architecture/business-rules.md) - Validation schemas, constraints, workflows

**Database:**
- [Supabase Workflow](docs/supabase/WORKFLOW.md) ⭐ Local + cloud
- [Production Safety](scripts/db/PRODUCTION-WARNING.md) ⚠️ Critical

**References:**
- [Commands](docs/development/commands-quick-reference.md)
- [Testing](docs/development/testing-quick-reference.md)
- [Colors](docs/internal-docs/color-theming-architecture.docs.md)
- [README](README.md)
