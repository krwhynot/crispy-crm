# Project Index: Atomic CRM

**Generated:** 2025-11-22
**Version:** 0.1.0
**Status:** Pre-launch

---

## Quick Start

```bash
# Development (cloud DB)
npm run dev

# Development (local Docker)
npm run dev:local

# Run tests
npm test                # Unit tests (Vitest)
npm run test:e2e        # E2E tests (Playwright)

# Build
npm run build

# Database
npm run db:cloud:push   # Deploy migrations to cloud
```

---

## Project Structure

```
crispy-crm/
├── src/                        # Frontend source (683 files)
│   ├── App.tsx                 # Entry point
│   ├── main.tsx                # React root
│   ├── atomic-crm/             # CRM domain modules
│   │   ├── root/               # App shell (CRM.tsx, ConfigurationContext)
│   │   ├── dashboard/v3/       # Principal Dashboard (default)
│   │   ├── contacts/           # Contact management
│   │   ├── organizations/      # Organization/Principal management
│   │   ├── opportunities/      # Opportunity pipeline + Kanban
│   │   ├── tasks/              # Task management
│   │   ├── activities/         # Activity logging
│   │   ├── products/           # Product catalog
│   │   ├── sales/              # User/Rep management
│   │   ├── reports/            # Weekly/Campaign reports
│   │   ├── validation/         # Zod schemas per resource
│   │   ├── providers/supabase/ # Data + Auth providers
│   │   └── layout/             # App layout components
│   ├── components/
│   │   ├── ui/                 # shadcn/ui atoms
│   │   ├── admin/              # React Admin wrappers
│   │   └── layouts/            # Layout shells
│   └── lib/                    # Utilities
├── supabase/                   # Backend
│   ├── migrations/             # 102 SQL migrations
│   ├── functions/              # Edge Functions
│   ├── seed.sql                # Dev seed data
│   └── config.toml             # Supabase config
├── tests/
│   ├── e2e/                    # Playwright E2E (64 files)
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
| `src/main.tsx` | React DOM entry |
| `src/App.tsx` | Providers + CRM wrapper |
| `src/atomic-crm/root/CRM.tsx` | React Admin setup, routes, resources |
| `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` | Default dashboard |

---

## Resources (React Admin)

| Resource | Path | Description |
|----------|------|-------------|
| contacts | `src/atomic-crm/contacts/` | Contact CRUD with slide-over |
| organizations | `src/atomic-crm/organizations/` | Principals + subsidiaries |
| opportunities | `src/atomic-crm/opportunities/` | Pipeline + Kanban board |
| tasks | `src/atomic-crm/tasks/` | Task management |
| activities | `src/atomic-crm/activities/` | Activity logging |
| products | `src/atomic-crm/products/` | Product catalog |
| sales | `src/atomic-crm/sales/` | User management |

---

## Key Components

### Dashboard V3
- `PrincipalDashboardV3.tsx` - 3-column layout
- `PrincipalPipelineTable.tsx` - Aggregated pipeline view
- `TasksPanel.tsx` - Time-bucketed tasks
- `QuickLoggerPanel.tsx` - Activity quick logging

### Data Layer
- `unifiedDataProvider.ts` - Supabase data provider
- `authProvider.ts` - Supabase auth
- `filterRegistry.ts` - Prevent stale filter errors

### Validation
- `src/atomic-crm/validation/` - Zod schemas
- Pattern: `resource.schema.ts` exports `createSchema`, `updateSchema`

---

## Database

**Platform:** Supabase (PostgreSQL)
**Migrations:** 102 files in `supabase/migrations/`
**Security:** RLS policies + GRANT statements

### Key Views
- `contacts_summary` - Contact list aggregation
- `organizations_summary` - Org list aggregation
- `opportunities_summary` - Opportunity aggregation
- `principal_pipeline_summary` - Dashboard V3 data

### Key Tables
- `contacts`, `organizations`, `opportunities`
- `tasks`, `activities`, `products`
- `sales` (users), `tags`, `notifications`

---

## Testing

| Type | Tool | Command | Coverage |
|------|------|---------|----------|
| Unit | Vitest | `npm test` | 70% min |
| E2E | Playwright | `npm run test:e2e` | - |
| Integration | Vitest | `tests/integration/` | - |

### E2E Page Objects
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

### Backend
- Supabase (PostgreSQL + Auth + Realtime)
- Edge Functions (Deno)

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `vite.config.ts` | Vite bundler config |
| `tsconfig.json` | TypeScript config |
| `tailwind.config.ts` | Tailwind v4 theme |
| `playwright.config.ts` | E2E test config |
| `vitest.config.ts` | Unit test config |
| `supabase/config.toml` | Supabase local config |
| `.env` / `.env.local` / `.env.cloud` | Environment vars |
| `CLAUDE.md` | Claude Code instructions |

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
npm run db:local:reset   # Reset local only
npm run db:cloud:push    # Deploy to production
npm run db:cloud:status  # Migration history
```

### Quality
```bash
npm run lint:apply       # Fix lint issues
npm run validate:colors  # Check semantic colors
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Claude Code project instructions |
| `docs/claude/engineering-constitution.md` | Core principles |
| `docs/architecture/` | ADRs, design decisions |
| `docs/development/common-tasks.md` | How-to guides |
| `docs/dashboard/PRINCIPAL-DASHBOARD-COMPLETE-GUIDE.md` | Dashboard architecture |

---

## Recent Changes (2025-11)

- **V3 Dashboard** - 3-column principal-centric dashboard (default)
- **V1/V2 Cleanup** - Removed 34 legacy dashboard files
- **Security Hardening** - RLS policies, CSV validation
- **Cloud-First Dev** - Migrated from local Docker to Supabase Cloud

---

## Serena MCP Memories

Available memories for cross-session context:
- `project_overview` - Tech stack, architecture
- `code_style_conventions` - Coding standards
- `task_completion_checklist` - Workflow checklist
- `database_security` - RLS/GRANT patterns
- `session_2025-11-22_v1v2_cleanup` - V1/V2 cleanup record

---

*Index generated by Claude Code. ~3KB compressed for efficient context loading.*
