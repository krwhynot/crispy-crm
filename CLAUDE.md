# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crispy CRM (Atomic CRM) is a full-stack CRM application built with React 19, TypeScript, React Admin, and Supabase. It's a pre-launch product optimized for desktop (1440px+) with iPad tablet support.

## Commands

### Development
```bash
npm run dev                 # Start Vite dev server
npm run dev:local           # Start local Supabase + reset DB + Vite
npm run dev:cloud           # Connect to cloud Supabase
```

### Build & Deploy
```bash
npm run build               # TypeScript check + Vite production build
npm run prod:deploy         # Build + deploy DB + deploy Edge Functions
```

### Testing
```bash
npm run test                # Unit tests (Vitest watch mode)
npm run test:coverage       # Coverage report (70% threshold)
npm run test:e2e            # E2E tests (Playwright)
npm run test:e2e:ui         # E2E interactive UI mode
```

### Code Quality
```bash
npm run lint                # ESLint + Prettier check
npm run lint:apply          # Auto-fix lint issues
npm run typecheck           # TypeScript type checking
```

### Database
```bash
npm run db:local:start      # Start local Supabase Docker
npm run db:local:reset      # Reset local database
npm run db:cloud:push       # Push migrations to cloud
```

## Architecture

### Data Provider Pattern (Critical)
All database access goes through a single composable entry point:
- **`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`** - The ONLY data access layer
- Never import Supabase directly in components; always use the data provider
- Zod validation happens at the API boundary in this provider, not in forms

### Feature Organization
Each feature in `src/atomic-crm/` follows this pattern:
```
feature/
├── index.tsx           # Entry point with error boundaries
├── FeatureList.tsx     # List view
├── FeatureCreate.tsx   # Create form
├── FeatureEdit.tsx     # Edit form
└── FeatureSlideOver.tsx # Side panel detail view
```

### Key Directories
- `src/atomic-crm/` - Main CRM features (contacts, organizations, opportunities, etc.)
- `src/components/admin/` - React Admin form wrapper components
- `src/atomic-crm/validation/` - Zod schemas for each resource
- `supabase/migrations/` - Database migrations
- `supabase/functions/` - Edge Functions (Deno)

## Engineering Principles (Pre-Launch Phase)

### 1. Fail Fast - No Over-Engineering
- NO retry logic, circuit breakers, or graceful fallbacks
- Let errors throw and investigate immediately
- Velocity over resilience during pre-launch

### 2. Single Source of Truth
- All data access through `unifiedDataProvider`
- All validation through Zod schemas at API boundary
- Form state derived from Zod: `zodSchema.partial().parse({})`

### 3. TypeScript Conventions
- Use `interface` for object shapes
- Use `type` for unions and intersections

### 4. Deprecated Patterns (Never Use)
- `Contact.company_id` → Use `contact_organizations` junction table
- `Opportunity.archived_at` → Use `deleted_at` for soft deletes
- Direct Supabase imports in components → Use data provider
- Form-level validation → Zod at API boundary only

## Design System

### Tailwind v4 Semantic Colors Only
```tsx
// CORRECT - Semantic utilities
className="text-muted-foreground bg-primary text-destructive"

// WRONG - Legacy colors
className="text-gray-500 bg-green-600 text-red-500"
```

### Touch Targets
All interactive elements must be minimum 44x44px (`h-11 w-11`) on all screen sizes.

### Layout Patterns
1. **List Shell**: Filter sidebar + `PremiumDatagrid` table
2. **Slide-Over**: Right panel (40vw) for view/edit with URL sync (`?view=123`)
3. **Create Forms**: Full-page with tabbed sections

## Testing

### Unit Tests (Vitest)
- Use `renderWithAdminContext()` from `src/tests/utils/render-admin.tsx`
- Supabase is globally mocked in `src/tests/setup.ts`
- Tests colocated with source in `__tests__/` directories

### E2E Tests (Playwright)
- Page Object Models in `tests/e2e/support/poms/`
- Use semantic selectors: `getByRole()`, `getByLabel()`, `getByText()`
- Never use CSS selectors
- Auth state saved to `tests/e2e/.auth/user.json`

## Database (Supabase)

- PostgreSQL 17 with Row-Level Security (RLS)
- Soft deletes via `deleted_at` timestamps
- Multi-tenant isolation per organization
- Edge Functions for async operations (daily-digest, check-overdue-tasks)
