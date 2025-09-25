### Core Principles

These rules prevent debates and ensure consistency across the Atomic CRM codebase:

  

1. **Database Access**: Use a single unified data provider with optional resilience features. Systematically refactor/deprecate other custom data layers.

  

2. **Error Handling**: Implement basic retry logic with exponential backoff and standardized error types. No circuit breakers or health monitoring - these are over-engineering for a CRM.

  

3. **Validation**: Single point validation with Zod schemas at the API boundary only. No multi-layer validation.

  

4. **Testing**: Focus on critical business logic unit tests + key user journey E2E tests. Avoid over-testing infrastructure.

  

5. **Migrations**: Use sequential numbering (108_feature_name.sql, 109_another_feature.sql) for explicit ordering.

  

6. **TypeScript**: Use `interface` for objects/classes, `type` for unions/intersections/utilities.

  

7. **State Management**: Local state for UI-only concerns, React Admin store for resource data.

  

8. **Transactions**: Only wrap multi-table operations or operations with business rule dependencies.

  

9. **Backward Compatibility**: Never maintain it - fail fast to catch issues immediately.

  

10. **Comments**: Only for non-obvious business rules or necessary workarounds. Code should be self-documenting.

  

11. **Forms**: Always use the admin form layer (src/components/admin/) for consistent validation and error handling.

  

12. **Colors**: Only use semantic CSS variables (--primary, --destructive, etc.). No hardcoded hex values.

  

### Operational Standards

  

13. **Data Access Strategy**: Prioritize the primary auto-generated data provider. Refactor away custom layers.

  

14. **Transaction Management**: Handle in dedicated Service Layer orchestrating business operations.

  

15. **Technical Debt**: Apply "Boy Scout Rule" - fix inconsistencies in files you edit as part of current work.

  

16. **Architecture Enforcement**: Use automated ESLint rules to prevent forbidden imports and layer violations.

  

17. **Complexity Threshold**: Only introduce new patterns (circuit breakers, queues) for documented, recurring production issues.

  

18. **Performance**: Measure first with tracing, optimize queries/indexes before adding caches. No premature optimization.

  

19. **Feature Flags**: Server-evaluated with ownership/expiry. Remove within one release post-rollout.

  

20. **API Design**: Versioned REST with consistent JSON errors, idempotency keys, DTOs validated at boundary.

  

21. **Deployment**: Two-phase migrations, canary rollouts, automated health gates, schema-compatible rollbacks.

  

22. **Observability**: User-centric SLIs/SLOs, distributed tracing, structured logs with correlation IDs.

  

### Quick Reference

- **DO NOT OVER-ENGINEER** - No circuit breakers, health monitoring, or complex resilience patterns

- **FAIL FAST** - No backward compatibility, surface errors immediately

- **SINGLE RESPONSIBILITY** - One validation point, one data provider, one source of truth

- **AUTOMATE ENFORCEMENT** - ESLint for architecture, git hooks for types, CI/CD for standards

- **MEASURE BEFORE OPTIMIZING** - Always profile before adding complexity

  


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Core Commands
- `npm run dev` - Start development server (Vite with force reload)
- `npm run build` - TypeScript check + production build
- `npm run preview` - Preview production build
- `npm test` - Run Vitest tests

### Code Quality
- `npm run lint:check` - Check ESLint violations
- `npm run lint:apply` - Auto-fix ESLint issues
- `npm run prettier:check` - Check formatting
- `npm run prettier:apply` - Auto-format code
- `npm run validate:colors` - Validate color usage across components

### Database Operations

#### Local Development
- Connect directly to remote Supabase via environment variables

#### MCP Database Tools
When MCP is configured (`.mcp.json` has credentials), use these tools directly:
- `mcp__supabase__list_projects` - List Supabase projects
- `mcp__supabase__apply_migration` - Apply database migrations
- `mcp__supabase__execute_sql` - Execute SQL queries
- `mcp__supabase__deploy_edge_function` - Deploy Edge Functions
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types

#### CI/CD Database Operations
- GitHub Actions uses Supabase CLI in cloud environment
- Commands: `npx supabase link`, `npx supabase db push`, `npx supabase functions deploy`

## Critical Implementation Notes

### Migration Numbering
Migrations use timestamp format (YYYYMMDDHHMMSS) for ordering. Example:
- `20250113132532_fixcontactorganizationplural.sql`
- Always use timestamps, never sequential numbers

### Environment Variables
- **OPPORTUNITY_* variables**: Configure sales pipeline (renamed from DEAL_*)
- See `.env.example` for all configuration options

## Architecture Overview

This is Atomic CRM, a full-stack React CRM application built on these key architectural decisions:

### Data Provider Architecture
The application uses the Supabase Provider: Production-ready PostgreSQL backend with RLS policies that implements the React Admin DataProvider interface.

### Core Application Structure

The CRM component (`src/atomic-crm/root/CRM.tsx`) serves as the application root, accepting configuration for:
- Custom deal stages and pipelines
- Company sectors and contact metadata
- Theme configuration (light/dark modes)
- Authentication providers (Google, Azure, Keycloak, Auth0)

### Feature Module Organization

Each business entity follows a consistent module structure:
```
src/atomic-crm/[feature]/
├── index.ts           # Resource configuration for React Admin
├── [Feature]List.tsx  # List view with filters
├── [Feature]Show.tsx  # Detail view
├── [Feature]Edit.tsx  # Edit form
├── [Feature]Create.tsx # Create form
└── [Feature]Inputs.tsx # Shared form inputs
```

### Component Architecture

The UI layer uses a three-tier component system:
1. **Base Components** (`src/components/ui/`): shadcn/ui primitives
2. **Admin Components** (`src/components/admin/`): React Admin integrated components
3. **Feature Components** (`src/atomic-crm/`): Business logic components

### Database Schema

Key tables in Supabase:
- `companies` - Organization records with sectors
- `contacts` - People with email/phone as JSONB for flexibility (migration v0.2.0)
- `opportunities` - Sales pipeline (renamed from `deals` in v0.2.0)
- `tasks` - Activity tracking with reminders
- `contactNotes`/`opportunityNotes` - Communication history
- `tags` - Flexible categorization with semantic color tokens
- `contactOrganizations` - Many-to-many relationship (contacts ↔ organizations)

All tables include RLS policies for multi-tenant security.

**Important**: Legacy `deals` endpoints remain for backward compatibility but should not be used in new code.

### Provider Pattern

The application uses React Admin's provider system:
- **AuthProvider**: Handles authentication flow with Supabase Auth or mock auth
- **DataProvider**: Abstracts data operations (CRUD, filtering, pagination)
- **I18nProvider**: Internationalization support (currently English)

### State Management

- React Admin's store for resource state and UI preferences
- React Query for server state caching and synchronization
- Local storage for user preferences and session persistence

### Color System Migration

The project is transitioning to a new Tailwind v4 color system:
- Color usage is tracked in `COLOR_USAGE_LIST.md`
- Migration plans documented in `.docs/plans/color-system-migration/`
- Tag colors migrated to semantic color tokens

## Important Patterns

### Resource Configuration
Resources are registered in the CRM component with their CRUD components. React Admin automatically generates routes and navigation based on these registrations.

### Form Handling
Forms use React Hook Form via React Admin's Form components. Validation uses Zod schemas with custom validators for business rules.

### Data Fetching
Data operations work with Supabase: Async operations with real PostgreSQL queries

### Authentication Flow
The app supports multiple auth methods through Supabase Auth, with custom pages for:
- Sign up with email verification
- Password reset flow
- SSO integration (Google, Azure, etc.)

## Environment Configuration

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key
- `VITE_INBOUND_EMAIL` - Optional email capture address

## Testing Strategy

Tests use Vitest with React Testing Library. Test files follow the `*.test.ts(x)` or `*.spec.ts(x)` naming convention and are co-located with source files.

### Seed Data Management
- `npm run seed:data` - Insert test data
- `npm run seed:data:dry-run` - Preview without inserting
- `npm run seed:data:clean` - Clean and regenerate

## Active Refactoring Patterns

Based on Core Principle #15 (Boy Scout Rule), when editing files:

1. **Data Provider Consolidation**: Replace custom data access with unified provider
2. **Color System**: Replace hex values with semantic CSS variables
3. **Form Components**: Migrate to admin form layer (`src/components/admin/`)
4. **Validation**: Move to single-point Zod validation at API boundary
5. **TypeScript**: Use `interface` for objects, `type` for unions/utilities

## Known Limitations

1. **No Local Supabase**: Use remote Supabase project for development
2. **MCP vs CLI**: Local development uses MCP tools, CI/CD uses Supabase CLI
3. **Migration Rollback**: Limited to 48-hour window in production
4. **Edge Functions**: Test directly on development project