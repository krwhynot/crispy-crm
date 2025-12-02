# Project Index: Crispy-CRM (Atomic CRM)

**Generated:** 2025-12-02
**Version:** 0.1.0
**Status:** MVP In Progress (57 features TODO)
**Token Estimate:** ~2,500 tokens (94% reduction from full codebase)

---

## Overview

**Crispy-CRM** - Full-featured CRM for MFB (Master Food Brokers), a food distribution brokerage managing relationships between **Principals** (manufacturers), **Distributors**, and **Operators** (restaurants).

**Stack:** React 19 + Vite 7 + TypeScript 5.8 + Supabase + React Admin 5 + Tailwind CSS v4
**PRD Version:** v1.18 (2025-11-28)

---

## Quick Start

```bash
# Development (cloud DB)
npm run dev

# Development (local Docker)
npm run dev:local        # Resets + seeds DB

# Run tests
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)

# Build
npm run build

# Database
npm run db:cloud:push    # Deploy migrations to cloud
npm run db:local:reset   # Reset local only (safe)
```

**Test login:** `admin@test.com / password123`

---

## Project Structure

```
crispy-crm/
├── src/                        # Frontend source (891 files)
│   ├── main.tsx                # Entry point + Sentry init
│   ├── App.tsx                 # Root component (Sentry ErrorBoundary)
│   ├── atomic-crm/             # CRM domain modules
│   │   ├── root/CRM.tsx        # React Admin setup + routes
│   │   ├── dashboard/v3/       # Principal Dashboard (default)
│   │   ├── contacts/           # Contact management
│   │   ├── organizations/      # Organization/Principal management
│   │   ├── opportunities/      # Opportunity pipeline + Kanban
│   │   ├── tasks/              # Task management
│   │   ├── activities/         # Activity logging (13 types)
│   │   ├── products/           # Product catalog
│   │   ├── sales/              # User/Rep management
│   │   ├── notifications/      # In-app notifications
│   │   ├── reports/            # Weekly/Campaign reports
│   │   ├── validation/         # Zod schemas per resource
│   │   ├── providers/supabase/ # Data + Auth providers
│   │   ├── services/           # Business logic services
│   │   └── layout/             # App layout components
│   ├── components/
│   │   ├── ui/                 # shadcn/ui atoms
│   │   └── admin/              # React Admin wrappers
│   └── lib/                    # Utilities (sanitization, i18n)
├── supabase/                   # Backend
│   ├── migrations/             # 151 SQL migrations (32K LOC)
│   ├── functions/              # Edge Functions (Deno)
│   ├── seed.sql                # Dev seed data
│   └── config.toml             # Supabase config
├── tests/
│   ├── e2e/                    # Playwright E2E (54 specs)
│   │   ├── dashboard-v3/       # Dashboard tests
│   │   ├── specs/              # Resource CRUD specs
│   │   └── support/poms/       # Page Object Models
│   └── integration/            # Supabase integration tests
├── docs/                       # Documentation
│   ├── claude/                 # Claude Code instructions
│   ├── architecture/           # ADRs, design docs
│   └── plans/                  # Implementation plans
└── .claude/                    # Claude skills & config
```

---

## Core Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM entry + Sentry monitoring |
| `src/App.tsx` | ErrorBoundary + CRM wrapper |
| `src/atomic-crm/root/CRM.tsx` | React Admin setup, routes, resources |
| `src/atomic-crm/providers/supabase/index.ts` | Data + Auth provider factory |

---

## Resources (React Admin)

| Resource | Path | Description |
|----------|------|-------------|
| opportunities | `atomic-crm/opportunities/` | 7-stage pipeline + Kanban |
| contacts | `atomic-crm/contacts/` | Contact CRUD + CSV import |
| organizations | `atomic-crm/organizations/` | Principal/Distributor/Customer |
| products | `atomic-crm/products/` | Product catalog by principal |
| tasks | `atomic-crm/tasks/` | Task management with deadlines |
| activities | `atomic-crm/activities/` | 13 activity types |
| sales | `atomic-crm/sales/` | User/Rep management |
| notifications | `atomic-crm/notifications/` | In-app notifications |

---

## Business Domain

### Three-Party Model
- **Principal** = Food manufacturer (e.g., McCRUM, Rapid Rasoi)
- **Distributor** = Distribution company (e.g., Sysco, USF, GFS)
- **Customer/Operator** = Restaurant or foodservice business

### Pipeline Stages (7)
`new_lead` → `initial_outreach` → `sample_visit_offered` → `feedback_logged` → `demo_scheduled` → `closed_won` | `closed_lost`

### Activity Types (13)
call, email, sample, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note

---

## Key Components

### Dashboard V3 (`dashboard/v3/`)
- `PrincipalDashboardV3.tsx` - 2-column CSS Grid (40% | 60%) + FAB
- `PrincipalPipelineTable.tsx` - Aggregated pipeline with momentum
- `TasksPanel.tsx` - Time-bucketed tasks (Overdue → Today → Tomorrow)
- `LogActivityFAB.tsx` - Floating action button
- `QuickLogForm.tsx` - Activity logging with draft persistence

### Data Layer (`providers/supabase/`)
- `unifiedDataProvider.ts` - Monolithic provider (1090 LOC, default)
- `composedDataProvider.ts` - Handler-based (feature-flagged)
- `authProvider.ts` - Supabase Auth integration
- `filterRegistry.ts` - Prevent stale filter errors

### Validation (`validation/`)
- Zod schemas for all resources
- Pattern: `schema.partial().parse({})` for form defaults
- JSONB array patterns for multi-value fields

---

## Database

**Platform:** Supabase (PostgreSQL)
**Migrations:** 151 files (32K LOC)
**Security:** RLS policies + GRANT statements

### Key Views
- `contacts_summary` - Contact list aggregation
- `organizations_summary` - Org list aggregation
- `opportunities_summary` - Opportunity aggregation
- `principal_pipeline_summary` - Dashboard V3 data

### Security Pattern
```sql
-- Both GRANT and RLS required
GRANT SELECT, INSERT, UPDATE, DELETE ON table TO authenticated;
ALTER TABLE table ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy ON table FOR SELECT TO authenticated USING (true);
```

---

## Testing

| Type | Files | Command | Coverage |
|------|-------|---------|----------|
| Unit | 190 | `npm test` | 70% min |
| E2E | 54 | `npm run test:e2e` | - |
| Integration | 6 | `tests/integration/` | - |

### Page Object Models
```
tests/e2e/support/poms/
├── DashboardPage.ts
├── ContactsListPage.ts
├── OpportunitiesListPage.ts
├── TasksListPage.ts
└── ...
```

---

## Tech Stack

### Frontend
- React 19 + TypeScript 5.8
- Vite 7 (build)
- React Admin 5 (admin framework)
- Tailwind CSS v4 (OKLCH colors)
- shadcn/ui (Radix primitives)
- Zod 4 (validation)
- TanStack Query (server state)
- Sentry (error monitoring)

### Backend
- Supabase (PostgreSQL + Auth + Realtime)
- Edge Functions (Deno)

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-admin | ^5.10.0 | Admin framework |
| @supabase/supabase-js | ^2.75.1 | Database client |
| zod | ^4.1.12 | Schema validation |
| tailwindcss | ^4.1.11 | CSS framework |
| @sentry/react | ^10.27.0 | Error monitoring |
| @hello-pangea/dnd | ^18.0.1 | Drag and drop |

---

## npm Scripts Reference

### Development
```bash
npm run dev              # Cloud DB dev server
npm run dev:local        # Local Supabase + reset + seed
npm run build            # Production build
```

### Testing
```bash
npm test                 # Vitest watch mode
npm run test:ci          # Single run
npm run test:e2e         # Playwright
npm run test:e2e:ui      # Playwright UI mode
```

### Database
```bash
npm run db:local:reset   # Reset local only (safe)
npm run db:cloud:push    # Deploy to production
npm run db:cloud:status  # Migration history
npx supabase migration new <name>  # Create migration
```

### Quality
```bash
npm run lint:apply       # Fix lint issues
npm run validate:colors  # Check semantic colors
```

---

## Essential Documentation

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Claude Code project instructions |
| `docs/PRD.md` | Product requirements |
| `docs/claude/engineering-constitution.md` | Core principles |
| `docs/supabase/WORKFLOW.md` | Database operations |
| `docs/architecture/design-system.md` | UI patterns |
| `docs/development/common-tasks.md` | Step-by-step guides |

---

## Recent Changes (2025-11/12)

- **PRD v1.18 (2025-11-28)**: Activities Feature Matrix audit - 13 types, timeline CRUD
- **Pipeline (2025-11-28)**: Reduced from 8 to 7 stages (removed `awaiting_response`)
- **V3 Dashboard (2025-11-18)**: Default dashboard with pipeline table, tasks panel
- **V1/V2 Cleanup (2025-11-22)**: Removed 34 legacy dashboard files
- **Security (2025-11-08)**: RLS admin-only policies, CSV validation, WCAG 2.1 AA

---

## MCP Tools Available

- `mcp__sequential-thinking__*` - Complex reasoning chains
- `mcp__Ref__*` - Documentation lookup
- `mcp__ide__*` - VS Code integration

---

*This index provides 94% token reduction for AI context loading.*
*Full codebase: ~58K tokens. This index: ~2.5K tokens.*
