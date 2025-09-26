## Engineering Constitution Core Principles

Rules preventing debates & ensuring consistency:

1. **Database**: Single unified data provider + optional resilience. Refactor/deprecate custom layers
2. **Errors**: Basic retry + exponential backoff + standard types. No circuit breakers/health monitoring (over-engineering)
3. **Validation**: Zod schemas at API boundary only. No multi-layer
4. **Testing**: Critical logic units + key E2E journeys. Avoid infrastructure over-testing
5. **Migrations**: Timestamp format YYYYMMDDHHMMSS (e.g., `20250125000000_fresh_crm_schema.sql`)
6. **TypeScript**: `interface` for objects/classes, `type` for unions/intersections/utilities
7. **State**: Local for UI-only, React Admin store for resources
8. **Transactions**: Multi-table or business-rule dependencies only
9. **Compatibility**: Never maintain backward compatibility - fail fast
10. **Comments**: Non-obvious business rules/workarounds only. Self-documenting code
11. **Forms**: Always use admin layer (`src/components/admin/`) for validation/errors
12. **Colors**: Semantic CSS variables only (--primary, --destructive). No hex

### Operational Standards

13. **Data Access**: Primary auto-generated provider. Refactor custom layers
14. **Transactions**: Service Layer orchestration for business ops
15. **Tech Debt**: Boy Scout Rule - fix inconsistencies when editing
16. **Architecture**: ESLint rules prevent forbidden imports/violations
17. **Complexity**: New patterns only for documented production issues
18. **Performance**: Measure→optimize queries/indexes→cache. No premature optimization
19. **Feature Flags**: Server-evaluated + ownership/expiry. Remove within one release
20. **API**: Versioned REST + JSON errors + idempotency keys + boundary-validated DTOs
21. **Deployment**: Two-phase migrations + canary + health gates + schema-compatible rollbacks
22. **Observability**: User-centric SLIs/SLOs + distributed tracing + correlation IDs

### Quick Reference

- **NO OVER-ENGINEERING**: No circuit breakers/health monitoring/complex resilience
- **FAIL FAST**: No backward compatibility, surface errors immediately
- **SINGLE RESPONSIBILITY**: One validation/data provider/truth source
- **AUTOMATE**: ESLint→architecture, git hooks→types, CI/CD→standards
- **MEASURE FIRST**: Profile before adding complexity

## ⚠️ Development Status
**NOT LIVE** - Development phase only. All Supabase PostgreSQL data is test data and can be modified/deleted as needed. Use supabase MCP tool to access the database.

## Build & Development Commands

### Database Operations

#### Local Development
- Connect directly to remote Supabase via environment variables
- No local Supabase instance required

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