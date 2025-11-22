# Project Overview

## Purpose
**Atomic CRM** - A full-featured Customer Relationship Management system for managing contacts, organizations, opportunities, tasks, notes, and activities. Built for sales teams with pipeline tracking and dashboard analytics.

## Status
- **Stage:** Pre-launch
- **Primary Platform:** Web (iPad-optimized responsive design)

## Tech Stack

### Frontend
- **React 19** with TypeScript (~5.8)
- **Vite 7** for build tooling
- **React Admin 5** as the admin framework
- **Tailwind CSS v4** with OKLCH-based color system
- **shadcn/ui** components (Radix UI primitives)
- **Zod 4** for schema validation
- **React Hook Form** with Zod resolver
- **TanStack Query** for server state
- **Recharts/Chart.js** for data visualization

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime)
- Cloud-first development with local Docker option

### Testing
- **Vitest** for unit/integration tests (70% coverage minimum)
- **Playwright** for E2E testing
- **React Testing Library** for component tests
- **Storybook** for component documentation

## Architecture

```
main.tsx → App.tsx → atomic-crm/root/CRM.tsx
                          ↓
              <Resource> components (lazy-loaded)
                          ↓
         unifiedDataProvider.ts ←→ Supabase
```

### Key Directories
| Path | Purpose |
|------|---------|
| `src/atomic-crm/<resource>/` | Resource modules (List/Show/Edit/Create) |
| `src/atomic-crm/validation/` | Zod schemas for each resource |
| `src/atomic-crm/dashboard/v3/` | Default dashboard |
| `src/components/ui/` | shadcn/ui atoms |
| `src/atomic-crm/providers/supabase/` | Data + Auth providers |
| `supabase/migrations/` | Database migrations |

### Resources
- contacts, organizations, opportunities
- tasks, activities, notes
- sales (users), products, tags
- reports, settings

## Data Patterns
- **JSONB arrays** for multi-value fields (emails, phones)
- **Zod schemas** define validation and form defaults
- **RLS policies** + GRANTs for database security
