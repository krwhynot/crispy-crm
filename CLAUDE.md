# CLAUDE.md

This file provides guidance to Claude Code (AI agent) when working with this repository.

## Project Overview

Atomic CRM - Full-featured, open-source CRM with React, shadcn-admin-kit, and Supabase. Manages contacts, organizations, opportunities, tasks, notes with type-safe frontend and PostgreSQL backend.

**Status:** Pre-launch | **Stack:** React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS 4

## Recent Changes (90 days)

- **Principal Dashboard V2 (2025-11-13)**: Complete redesign of dashboard with 3-column resizable layout (Opportunities | Tasks | Quick Logger). New features: Opportunities hierarchy tree (Principal → Customer → Opp), Tasks panel with 3 grouping modes (Due/Priority/Principal), Quick activity logger, Right slide-over (Details/History/Files), Keyboard shortcuts (/, 1-3, H, Esc), Collapsible filters sidebar. Desktop-first (1440px+), WCAG 2.1 AA compliant, 70%+ test coverage. **Now default at root URL**. Guide: `docs/dashboard-v2-migration.md`, Plan: `docs/plans/2025-11-13-principal-dashboard-v2-PLANNING.md`
- **Cloud-First Development (2025-11-10)**: Migrated from local Docker to Supabase Cloud (aaqnanddcqvfiwhshndl) to eliminate WSL resource constraints. Uses single production project with daily automated backups for safety. RLS policies protect dev data. Dev workflow: `npm run dev` directly (no Docker). Migrations: git-tracked via CI/CD with `--dry-run` validation. Cost-optimized: 0 extra infrastructure. Guide: Below
- **Port Consolidation (2025-11-10)**: Successfully reduced exposed ports from 28 to 3 (API: 54321, DB: 54322, Studio: 54323). Disabled Inbucket & Analytics in `config.toml`. Internal services communicate via Docker bridge network. VSCode shows 11 Docker ports but only 3 are host-exposed. Note: Docker no longer needed for development (see Cloud-First above). Guide: `docs/development/port-consolidation-guide.md`
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

### Cloud-First Development (Single Production Project)

Using Supabase Cloud (aaqnanddcqvfiwhshndl) for all development with daily automated backups.

**Why this approach:**
- ✅ Eliminates WSL Docker resource crashes
- ✅ Zero extra infrastructure costs
- ✅ Daily backups = safe dev environment
- ✅ RLS policies protect sensitive data even in dev
- ✅ Parallel sessions supported

### Quick Commands

```bash
# First time setup (one-time)
npm run db:link            # Link local to cloud project

# Daily development
npm run dev                # Start UI (uses cloud DB in .env)

# Migrations
npx supabase migration new <name>    # Create new migration
npm run db:cloud:push:dry-run        # Validate before pushing
npm run db:cloud:push                # Push to cloud (or let CI/CD handle it)

# Status
npm run db:cloud:status    # Show migration history
npm run db:cloud:diff      # Show pending changes
```

### Seed Data & Reset

**⚠️ ONLY ONE seed file:** `supabase/seed.sql` (test user: admin@test.com / password123, 16 orgs)

**For development data resets:**
```bash
npm run db:local:start     # Optional: run local Docker for isolated testing
npm run db:local:reset     # Reset local DB only (doesn't touch cloud)
npm run dev:local          # Dev against local Docker (optional)
```

**⚠️ NEVER:** `npx supabase db reset --linked` (DELETES CLOUD DATA)

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

## Dashboard V2

**Default:** Principal Dashboard V2 at `http://127.0.0.1:5173/`

**Layout:** 3-column resizable (Opportunities 40% | Tasks 30% | Quick Logger 30%)

**Key Features:**
- **Opportunities Hierarchy** - ARIA tree with Principal → Customer → Opportunity navigation
- **Tasks Panel** - 3 grouping modes (Due Date, Priority, Principal) with "Later" pagination
- **Quick Logger** - Inline activity logging with optional follow-up task creation
- **Right Slide-Over** - Details/History/Files tabs (40vw, 480-720px)
- **Keyboard Shortcuts** - Power user workflows (see below)
- **Collapsible Filters** - Health/Stage/Assignee/Last Touch filtering

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `/` | Focus global search |
| `1` | Scroll to Opportunities |
| `2` | Scroll to Tasks |
| `3` | Scroll to Quick Logger |
| `H` | Open slide-over on History tab (when opportunity selected) |
| `Esc` | Close slide-over |

**Component Structure:**
```
src/atomic-crm/dashboard/v2/
├── PrincipalDashboardV2.tsx          # Main layout
├── components/
│   ├── DashboardHeader.tsx
│   ├── FiltersSidebar.tsx
│   ├── OpportunitiesHierarchy.tsx
│   ├── TasksPanel.tsx
│   ├── QuickLogger.tsx
│   └── RightSlideOver.tsx
├── context/
│   └── PrincipalContext.tsx
├── hooks/
│   ├── useFeatureFlag.ts
│   ├── usePrefs.ts
│   └── useResizableColumns.ts
└── utils/
    └── taskGrouping.ts
```

**Database Views:**
- `principal_opportunities` - Pre-aggregated with customer info + health status
- `priority_tasks` - Priority-ranked with principal info
- `activities` - Activity history for opportunity details

**Design System:**
- ✅ Tailwind v4 semantic utilities only (no inline CSS variables)
- ✅ WCAG 2.1 AA compliant (Lighthouse ≥95)
- ✅ 44px minimum touch targets across all interactive elements
- ✅ Desktop-first responsive (1440px+ primary, graceful degradation)

**Testing:**
- Unit tests: 30+ (hooks + utilities, 70%+ coverage)
- E2E tests: 3 suites (activity logging, keyboard nav, accessibility)
- Accessibility: Axe scan (zero violations)

**References:**
- Migration guide: `docs/dashboard-v2-migration.md`
- Implementation plan: `docs/plans/2025-11-13-principal-dashboard-v2.md`
- Planning doc: `docs/plans/2025-11-13-principal-dashboard-v2-PLANNING.md`

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

## Tabbed Forms

**Pattern:** All Create/Edit forms use consistent tabbed interface via `TabbedFormInputs` component.

**Status:** Phase 1 complete (all 6 resources migrated) - 2025-11-10

**Location:** `src/components/admin/tabbed-form/`

**Forms Using Tabs:**
- Organizations (General | Details | Other)
- Sales (General | Permissions)
- Tasks (General | Details)
- Products (General | Relationships | Classification)
- Contacts (Identity | Position | Contact Info | Account)
- Opportunities (General | Classification | Relationships | Details)

**Usage:**
```tsx
const tabs = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'email'],  // Fields for error tracking
    content: <GeneralTab />,
  },
  {
    key: 'details',
    label: 'Details',
    fields: ['phone', 'address'],
    content: <DetailsTab />,
  },
];

<TabbedFormInputs tabs={tabs} defaultTab="general" />
```

**Components:**
- `TabbedFormInputs` - Main container with error tracking
- `TabTriggerWithErrors` - Tab trigger with error badge
- `TabPanel` - Tab content wrapper with semantic styling

**Features:**
- ✓ Automatic error count per tab (from React Hook Form state)
- ✓ Error badges display count only when > 0
- ✓ Semantic color variables (--border-subtle, --bg-secondary)
- ✓ Memoized error calculations for performance
- ✓ Full accessibility (aria-labels, keyboard nav)

**Design System Compliance:**
- Uses semantic colors only
- Padding: `p-6` (24px)
- Border radius: `rounded-lg`
- Touch targets: 44px minimum
- WCAG AA accessibility

[Implementation plan](docs/plans/2025-11-10-tabbed-form-implementation-plan.md) | [Design](docs/plans/2025-11-10-tabbed-form-standardization-design.md)

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

## Tasks Module

**Resource:** `/tasks` - Full CRUD task management with principal grouping

**Features:**
- Tasks grouped by principal (organization via opportunity)
- Filter by principal, due date, status, priority, type
- Inline task completion
- CSV export

**Database Schema:**
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  reminder_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority priority_level DEFAULT 'medium', -- low, medium, high, critical
  type task_type DEFAULT 'None', -- Call, Email, Meeting, Follow-up, etc.
  contact_id BIGINT,
  opportunity_id BIGINT,
  sales_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Validation:** `src/atomic-crm/validation/task.ts`

**Components:**
- List: Principal-grouped view (default)
- Show: Task detail with links
- Edit: Full form
- Create: Quick-add form
- Filter: Multi-field filtering

**Reports:**
- Weekly Activity Summary: `/reports/weekly-activity`
  - Groups: Sales Rep → Principal → Activity Type Counts
  - Flags low-activity principals (< 3/week)
  - CSV export

**Ref:** [Implementation Plan](docs/plans/2025-11-09-tasks-module-weekly-activity-report.md)

## Organization Hierarchies

**Pattern:** Parent-child relationships for multi-branch distributors and restaurant chains.

**Database:**
- `parent_organization_id` field references self
- `organizations_summary` view includes rollup metrics
- Deletion protection trigger prevents removing parents with branches

**Business Rules:**
- Two-level maximum depth (no grandchildren)
- Type restrictions: Only distributor/customer/principal can be parents
- Circular reference prevention
- Sister branches computed automatically (shared parent)

**UI Components:**
- `HierarchyBreadcrumb`: Navigation for child orgs (Organizations > Parent > Current)
- `BranchLocationsSection`: Table of branches for parent orgs with add button
- `ParentOrganizationSection`: Parent link + sister branches (first 3 + "show all") in sidebar
- `ParentOrganizationInput`: Form field for selecting parent (filters to eligible types)

**Validation:** `src/atomic-crm/validation/organizations.ts`
- `PARENT_ELIGIBLE_TYPES` constant (distributor, customer, principal)
- `canBeParent()`, `canHaveParent()` helper functions
- Circular reference prevention on save

**Export via index:** `src/atomic-crm/organizations/index.ts`
```typescript
export { HierarchyBreadcrumb } from "./HierarchyBreadcrumb";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";
export { ParentOrganizationInput } from "./ParentOrganizationInput";
```

**Responsive Design:**
- iPad-first responsive (768px+) with horizontal scroll for tables
- 44x44px minimum touch targets on all buttons
- Filter panel stacks vertically on narrower viewports
- Breadcrumb wraps appropriately without overflow

**Performance:**
- Query efficiency with organizations_summary view
- No N+1 queries for branch fetching
- Smooth scrolling and immediate interactivity
- Minimal API calls per navigation

**Reference:** [Organization Hierarchies Design Plan](docs/plans/2025-11-10-organization-hierarchies-design.md)

## Opportunities Module

**Resource:** `/opportunities` - Full CRUD opportunity management with Kanban board

### Kanban Board Features

**View:** Default view with drag-and-drop stage transitions

**Enhanced Cards:**
- Primary contact name with icon
- Estimated close date
- Priority badge (semantic colors: low/medium/high/critical)
- Days in stage indicator
- Warning badge for stuck opportunities (>14 days)
- Inline actions menu (view, edit, mark won, delete)

**Column Features:**
- Stage metrics in headers (count, avg days, stuck count)
- Quick-add opportunity button (pre-fills stage)
- Collapse/expand individual columns
- Column visibility toggle

**Customization:**
- Preferences persisted to localStorage
- Keys: `opportunity.kanban.collapsed_stages`, `opportunity.kanban.visible_stages`
- "Customize Columns" menu with collapse all/expand all

**Library:** `@hello-pangea/dnd` v18.0.1 (fork of react-beautiful-dnd)

**Validation:** `src/atomic-crm/validation/opportunity.ts`

**Components:**
- List: Kanban board with drag-and-drop (default)
- Show: Opportunity detail with tabs
- Edit: Full form with contact/organization pickers
- Create: Multi-step form
- QuickAdd: Single-field modal from Kanban columns

**Ref:** [Kanban Enhancements Plan](docs/plans/2025-11-10-pipedrive-kanban-enhancements.md)

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

**⚠️ Known Issue:** Local Supabase may become unresponsive during extended E2E test runs. If tests fail with "Failed to fetch" errors, restart Supabase:
```bash
npx supabase stop && npx supabase start
```

### Playwright MCP (AI-Assisted Test Generation)

**Purpose:** Interactive test generation and debugging (complements traditional Playwright)

```bash
# Generate tests via Claude conversation
/test-with-mcp                 # Slash command for test generation

# Manual MCP commands (optional)
npm run mcp:test:ipad          # iPad viewport (768x1024)
npm run mcp:test:desktop       # Desktop viewport (1440x900)
npm run mcp:debug              # Full tracing/video
npm run mcp:view-trace         # View captured traces
```

**Workflow:** MCP exploration → Generate traditional Playwright code → Commit to Git → CI/CD executes

**Use Cases:**
- Generate new tests for features interactively
- Debug failing tests with AI assistance
- Accessibility audits (WCAG 2.1 AA compliance)
- Edge case discovery

**Available MCP Servers** (configured in `.mcp.json`):
- `playwright-ipad` - iPad Pro viewport (768x1024)
- `playwright-desktop` - Desktop viewport (1440x900)
- `playwright-debug` - Full debugging with traces/video

**NOT for:** CI/CD execution (use traditional Playwright tests instead)

[Full MCP guide](docs/development/playwright-mcp-guide.md) | [Traditional testing guide](docs/development/testing-quick-reference.md)

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
