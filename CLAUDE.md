# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

These rules prevent debates and ensure consistency across the Atomic CRM codebase:

1. **Database Access**: Use a single unified data provider with optional resilience features. Systematically refactor/deprecate other custom data layers.

2. **Error Handling**: Implement basic retry logic with exponential backoff and standardized error types. No circuit breakers or health monitoring - these are over-engineering for a CRM.

3. **Validation**: Single point validation with Zod schemas at the API boundary only. No multi-layer validation.

4. **Testing**: Focus on critical business logic unit tests + key user journey E2E tests. Avoid over-testing infrastructure.

5. **Migrations**: Use timestamp format (YYYYMMDDHHMMSS) for ordering. Example: `20250125000000_fresh_crm_schema.sql`

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
- `npm run validate:colors` - Validate semantic color usage

### Database Operations

#### Local Development
- Connect directly to remote Supabase via environment variables
- No local Supabase instance required

#### MCP Database Tools
When MCP is configured (`.mcp.json` has credentials), use these tools directly:
- `mcp__supabase__list_projects` - List Supabase projects
- `mcp__supabase__apply_migration` - Apply database migrations
- `mcp__supabase__execute_sql` - Execute SQL queries
- `mcp__supabase__deploy_edge_function` - Deploy Edge Functions
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types

#### Seed Data Management
- `npm run seed:data` - Insert test data
- `npm run seed:data:dry-run` - Preview without inserting
- `npm run seed:data:clean` - Clean and regenerate

## Architecture Overview

Atomic CRM is a full-stack React CRM application built on these key architectural decisions:

### Data Provider Architecture

The application uses a unified Supabase data provider (`src/atomic-crm/providers/supabase/dataProvider.ts`) that:
- Implements the React Admin DataProvider interface
- Handles all CRUD operations against PostgreSQL with RLS policies
- Integrates Zod validation at API boundaries
- Manages file attachments via Supabase Storage
- No backward compatibility layers - clean opportunities-first design

### Validation Architecture

Zod schemas provide single-point validation at API boundaries (`src/atomic-crm/validation/`):
- `opportunities.ts` - Opportunity validation with business rules (probability 0-100)
- `organizations.ts` - Company validation with URL and LinkedIn validators
- `contacts.ts` - Contact validation with JSONB email/phone support
- `tasks.ts` - Task validation with reminder date logic
- `tags.ts` - Tag validation with semantic color enforcement
- `notes.ts` - Note validation with attachment support

Each schema exports both the Zod schema and validation functions for React Admin integration.

### Database Schema

Fresh opportunities-based schema with 24 core tables:
- `opportunities` - Sales pipeline (NOT deals) with multi-principal support
- `opportunityNotes` - Communication history (NOT dealNotes)
- `companies` - Organizations with hierarchical relationships
- `contacts` - People with JSONB email/phone for flexibility
- `products` - Full catalog with pricing tiers and inventory
- `activities` - Engagement vs interaction tracking
- `contact_organizations` - Many-to-many contact↔company relationships
- `opportunity_participants` - Multi-stakeholder opportunities

Key features:
- 85+ performance indexes including GIN for full-text search
- 20+ functions for business logic and validation
- Simple RLS: `FOR ALL USING (auth.role() = 'authenticated')`
- Soft deletes via `deleted_at` timestamps
- Search vectors updated via triggers

### Component Architecture

Three-tier UI component system:
1. **Base Components** (`src/components/ui/`): shadcn/ui primitives
2. **Admin Components** (`src/components/admin/`): React Admin integrated components
3. **Feature Components** (`src/atomic-crm/`): Business logic components

### Feature Module Organization

Each entity follows a consistent structure:
```
src/atomic-crm/[feature]/
├── index.ts           # Resource configuration for React Admin
├── [Feature]List.tsx  # List view with filters
├── [Feature]Show.tsx  # Detail view
├── [Feature]Edit.tsx  # Edit form
├── [Feature]Create.tsx # Create form
└── [Feature]Inputs.tsx # Shared form inputs
```

### Provider Pattern

React Admin's provider system:
- **AuthProvider**: Supabase Auth with Google, Azure, Keycloak, Auth0
- **DataProvider**: Unified Supabase provider with Zod validation
- **I18nProvider**: Internationalization (currently English only)

### State Management

- React Admin store for resource state and UI preferences
- React Query for server state caching
- Local storage for user preferences

## Important Patterns

### Resource Registration
Resources are registered in `src/atomic-crm/root/CRM.tsx` with lazy-loaded components. React Admin generates routes and navigation automatically.

### Form Handling
Forms use React Hook Form via React Admin's Form components. Validation happens through Zod schemas at the data provider level.

### Kanban Board
Opportunities use complex drag-drop reordering via index field. See `src/atomic-crm/opportunities/OpportunityListContent.tsx`.

### Multi-Organization Contacts
Contacts can belong to multiple organizations via `contact_organizations` junction table with role and influence tracking.

### Activity System
Distinction between:
- **Engagements**: Activities without opportunity context
- **Interactions**: Activities linked to specific opportunities

## Environment Configuration

Required variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key
- `VITE_INBOUND_EMAIL` - Optional email capture
- `OPPORTUNITY_*` variables - Pipeline configuration (NOT DEAL_*)

## Migration Notes

The system has been completely migrated from "deals" to "opportunities":
- Database has fresh schema with no backward compatibility
- All code references updated to opportunities
- Legacy deals module completely removed
- Validation layer implemented with Zod
- TypeScript types generated from fresh schema

## Active Refactoring Patterns

When editing files (Boy Scout Rule):
1. **Data Provider**: Consolidate to unified provider
2. **Validation**: Ensure Zod schemas at API boundary
3. **Colors**: Use semantic CSS variables only
4. **Forms**: Use admin form layer components
5. **TypeScript**: `interface` for objects, `type` for unions

## Known Limitations

1. **No Local Supabase**: Use remote project for development
2. **MCP vs CLI**: Local uses MCP tools, CI/CD uses Supabase CLI
3. **Migration Rollback**: Limited to 48-hour window
4. **Edge Functions**: Test directly on development project
5. **Type Generation**: MCP response size limits may require Supabase CLI