# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic CRM is a full-featured, open-source CRM built with React, shadcn-admin-kit, and Supabase. The application manages contacts, organizations, opportunities (formerly deals), tasks, and notes with a modern, type-safe frontend and a PostgreSQL backend.

NOTE: WE ARE NOT LIVE AND IN PRELAUNCH PHASE

**Stack**: React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind CSS 4

## Engineering Constitution

Core principles to prevent debates & ensure consistency:

1. **NO OVER-ENGINEERING**: No circuit breakers, health monitoring, or backward compatibility. Fail fast.
2. **SINGLE SOURCE OF TRUTH**: One data provider (Supabase), one validation layer (Zod at API boundary)
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
4. **VALIDATION**: Zod schemas at API boundary only (`src/atomic-crm/validation/`)
5. **FORM STATE DERIVED FROM TRUTH**: React Hook Form `defaultValues` MUST be generated from Zod schema
   - **Implementation**: Use `zodSchema.partial().parse({})` to extract only fields with `.default()` values
   - **Define defaults in Zod schema** using `.default()` method for fields with business logic defaults
   - **Merge schema defaults with runtime values** (e.g., `{ ...schema.partial().parse({}), user_id: identity.id }`)
   - **Rationale**: Prevents drift between UI and validation, ensures forms initialize in valid state
   - **Anti-Pattern**: Never use `defaultValue` prop on input components - React Hook Form controlled inputs ignore it
   - **Reference Implementation**: See `OpportunityCreate.tsx` and `opportunities.ts` validation schema
6. **TYPESCRIPT**: `interface` for objects/classes, `type` for unions/intersections
7. **FORMS**: Always use admin layer (`src/components/admin/`) for validation/errors
8. **COLORS**: Semantic CSS variables only (--primary, --brand-700, --destructive). Never use hex codes or direct OKLCH values in components.
9. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS (e.g., `20250126000000_migration_name.sql`)

## Essential Commands

### Development Workflow
```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # TypeScript check + production build
npm run preview          # Preview production build
npm test                 # Run tests in watch mode
npm run test:ci          # Run tests once (for CI)
npm run lint             # Check linting + formatting
npm run lint:apply       # Auto-fix ESLint issues
npm run prettier:apply   # Auto-fix formatting
```

### Database & Supabase
```bash
# Local Supabase (Docker-based)
npm run supabase:local:start   # Start local Supabase
npm run supabase:local:stop    # Stop local Supabase
npm run supabase:local:status  # Check status
npx supabase db reset          # Reset local DB + run migrations

# Cloud/Production Supabase ⚠️ IMPORTANT
npm run db:cloud:push          # SAFE: Push migrations with confirmations
npm run db:cloud:diff          # Show pending changes (read-only)
npm run db:cloud:status        # Show migration status
npm run supabase:deploy        # Push migrations + deploy edge functions
npx supabase migration new <name>  # Create new migration

# ❌ NEVER RUN ON PRODUCTION
# npx supabase db reset --linked  # DELETES ALL DATA INCLUDING USERS!

# Access points
# - Studio: http://localhost:54323
# - REST API: http://localhost:54321
# - Email testing: http://localhost:54324
```

**⚠️ CRITICAL: Production Database Safety**
- See `scripts/db/PRODUCTION-WARNING.md` for complete safety guide
- ALWAYS use `npm run db:cloud:push` for production migrations
- NEVER use `npx supabase db reset --linked` - it deletes all data including auth.users

### Development Scripts
```bash
npm run seed:data              # Insert test data
npm run seed:data:clean        # Clean + regenerate test data
npm run cache:clear            # Clear application caches
npm run search:reindex         # Reindex search data
npm run migrate:production     # Execute production migration
npm run validate:colors        # Validate semantic color usage
```

## Architecture Overview

### Frontend Structure

**Entry Points:**
- `src/main.tsx` � `src/App.tsx` � `src/atomic-crm/root/CRM.tsx`
- The `<CRM>` component is the root that configures the entire application
- All customization happens via props to `<CRM>` in `src/App.tsx`

**Module Organization (`src/atomic-crm/`):**
- **contacts/** - Contact management (List/Show/Edit/Create views)
- **organizations/** - Company/organization management
- **opportunities/** - Sales pipeline (formerly "deals", migrated in v0.2.0)
- **products/** - Product catalog
- **sales/** - Sales rep management
- **tasks/** - Task tracking
- **dashboard/** - Analytics and charts
- **layout/** - App shell, navigation, sidebar
- **providers/supabase/** - Data layer (dataProvider, authProvider)
- **components/** - Shared UI components
- **hooks/** - Custom React hooks
- **validation/** - Zod schemas for forms

**Key Patterns:**
- Each resource module exports lazy-loaded components via `index.ts`
- Resources use React Admin's List/Show/Edit/Create pattern
- All components use TypeScript for type safety
- Forms use `react-hook-form` + Zod validation
- UI components from `@/components/ui` (shadcn-based)

### Data Layer (Supabase Integration)

**Data Provider:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- Custom React Admin data provider built on `ra-supabase-core`
- Handles filtering, pagination, sorting, relationships
- Filter registry for complex queries: `filterRegistry.ts`

**Auth Provider:** `src/atomic-crm/providers/supabase/authProvider.ts`
- Manages authentication via Supabase Auth
- Supports Google, Azure, Keycloak, Auth0 integrations

**Database Architecture:**
- **Views** - Database views aggregate data (e.g., `contacts_summary` includes task counts)
- **Triggers** - Auto-sync user data from `auth.users` to `sales` table
- **Edge Functions** (`supabase/functions/`) - User management, email webhooks
- **Migrations** (`supabase/migrations/`) - Schema versioning

### Configuration System

**ConfigurationContext** (`src/atomic-crm/root/ConfigurationContext.tsx`):
- Centralized app configuration via React Context
- Controls: contact gender options, opportunity stages/categories, note statuses, task types, logos, themes
- Customize in `src/App.tsx` by passing props to `<CRM>`

Example customization:
```tsx
<CRM
  title="My Custom CRM"
  opportunityStages={[
    { value: 'lead', label: 'New Lead' },
    { value: 'qualified', label: 'Qualified' }
  ]}
  contactGender={[{ value: 'male', label: 'He' }]}
/>
```

### Important Architectural Decisions

1. **Database Views Over Client-Side Joins**: Complex queries use PostgreSQL views (defined in migrations) to reduce HTTP overhead and simplify frontend code.

2. **Lazy Loading**: All resource components are lazy-loaded to optimize initial bundle size. See chunk splitting in `vite.config.ts:120-185`.

3. **No User Deletion**: Users can only be disabled (via Supabase ban feature) to prevent data loss.

4. **Edge Functions for User Management**: Supabase lacks public user CRUD endpoints, so `supabase/functions/users` handles user creation/updates with permission checks.

5. **Triggers for Auth Sync**: Database trigger syncs `auth.users` � `sales` table for fields like `first_name`, `last_name`.

6. **Path Alias**: `@/*` maps to `src/*` (see `tsconfig.json:12`, `vite.config.ts:216`)

## Migration Notes (v0.2.0)

**Deal � Opportunity Rename:**
- All `deals` entities renamed to `opportunities`
- Environment variables: `DEAL_*` � `OPPORTUNITY_*`
- Props: `dealStages` � `opportunityStages`, `dealCategories` � `opportunityCategories`
- Database schema enhanced with participants, activity tracking, interaction history
- Many-to-many contacts � organizations

**Backward Compatibility:** Legacy deal endpoints remain functional during transition.

## Testing

**Framework:** Vitest + React Testing Library
**Coverage Requirement:** 70% across all metrics (statements, branches, functions, lines)

```bash
npm test                 # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:ui          # Launch Vitest UI
npm run test:e2e         # Run Playwright E2E tests
npm run test:performance # Performance benchmarks
```

**Test Location:**
- Unit/integration: `src/**/*.test.{ts,tsx}`
- E2E: `tests/e2e/`
- Fixtures: `tests/fixtures/`

**Testing Docs:**
- `.docs/testing/TESTING.md` - Overview
- `.docs/testing/WRITING_TESTS.md` - Patterns and examples
- `.docs/testing/FLAKY_TEST_POLICY.md` - Handling unreliable tests

## Environment Variables

**Required for Development:**
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>
```

**Required for Production:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

**Optional:**
```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # For MCP tools
DATABASE_URL=<postgres_connection_string>     # For migrations
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,qualified,won,lost
```

See `.env.example` for full list.

## Code Quality & Conventions

1. **Type Safety**: All code uses TypeScript strict mode. Avoid `any`.
2. **Path Imports**: Use `@/` alias for imports (e.g., `import { Button } from "@/components/ui/button"`)
3. **Lazy Loading**: Resource components MUST be lazy-loaded (see `src/atomic-crm/contacts/index.ts:4-7`)
4. **Form Validation**: Use Zod schemas in `src/atomic-crm/validation/`
5. **Semantic Colors**: Run `npm run validate:colors` to ensure Tailwind color usage follows semantic token system
6. **Linting**: Auto-fix before committing: `npm run lint:apply && npm run prettier:apply`

## Common Development Tasks

### Adding a New Resource
1. Create module in `src/atomic-crm/<resource-name>/`
2. Create List/Show/Edit/Create components (lazy-loaded)
3. Export via `index.ts` with `recordRepresentation`
4. Register in `src/atomic-crm/root/CRM.tsx`: `<Resource name="resource-name" {...resourceModule} />`
5. Add database migration: `npx supabase migration new add_<resource>_table`
6. Update data provider filters if needed in `filterRegistry.ts`

### Creating Database Migrations
```bash
# Local-first approach (recommended)
npx supabase migration new <migration_name>
# Edit supabase/migrations/<timestamp>_<migration_name>.sql
npx supabase migration up           # Apply locally
npx supabase db push                # Push to remote

# Remote-first approach
# Make changes in Supabase Dashboard, then:
npx supabase db diff | npx supabase migration new <migration_name>
npx supabase migration up
```

**Important:** If you modify contact/organization schema, update CSV import logic in `src/contacts/useContactImport.tsx` and sample files.

### Customizing the CRM

All customization happens via props to the `<CRM>` component in `src/App.tsx`. Available props:
- `contactGender: ContactGender[]`
- `opportunityStages: OpportunityStage[]`
- `opportunityCategories: string[]`
- `noteStatuses: NoteStatus[]`
- `taskTypes: string[]`
- `title: string`
- `lightModeLogo: string`
- `darkModeLogo: string`
- `disableTelemetry: boolean`
- `dataProvider: DataProvider` (override default)
- `authProvider: AuthProvider` (override default)

See `doc/developer/customizing.md` for detailed examples.

## Build & Deployment

**Production Build:**
```bash
npm run build            # Outputs to dist/
npm run prod:start       # Build + deploy DB + serve locally
npm run prod:deploy      # Build + deploy DB + deploy to GitHub Pages
```

**Optimization Features:**
- Manual chunk splitting (see `vite.config.ts:123-185`)
- Tree-shaking with Terser (drops console.log in production)
- Source maps disabled in production (7.7MB savings)
- Pre-bundled dependencies via `optimizeDeps` (see `vite.config.ts:10-62`)

**Deployment Targets:**
- GitHub Pages (configured in `scripts/ghpages-deploy.mjs`)
- Vercel (base path set to `/` in `vite.config.ts:220`)

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Entry point - customize CRM here |
| `src/atomic-crm/root/CRM.tsx` | Root component - app configuration |
| `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Data layer logic |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Authentication logic |
| `supabase/migrations/` | Database schema versions |
| `supabase/functions/` | Edge functions (user mgmt, email webhooks) |
| `vite.config.ts` | Build config, chunk splitting, aliases |
| `.env.example` | Environment variable template |
| `doc/developer/architecture-choices.md` | Why certain patterns exist |

## Documentation

User docs: `doc/user/`
Developer docs: `doc/developer/`
Testing docs: `.docs/testing/`

## Support

- Report issues: https://github.com/marmelab/atomic-crm/issues
- License: MIT (courtesy of Marmelab)
