# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
8. **COLORS**: Semantic CSS variables only (--primary, --destructive). Never use hex codes
9. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS (e.g., `20250126000000_migration_name.sql`)

# Parallel Agent Decomposition

**MANDATORY**: For ANY complex task or problem, immediately decompose into parallel-executable subtasks.

## Execution Pattern
1. **Analyze** - Break the problem into 3-7 independent components
2. **Assign** - Create parallel agents, each with a specific research/implementation focus:
   - Agent 1: Database/backend investigation
   - Agent 2: Frontend/UI patterns
   - Agent 3: Similar features/existing patterns
   - Agent 4+: Additional specialized aspects
3. **Synthesize** - Combine findings into cohesive solution

## Trigger Words
When you see: "implement", "research", "analyze", "build", "investigate", "plan", "design"
→ Immediately decompose for parallel execution

## Example Decomposition
Task: "Add new dashboard feature"
Parallel Agents:

Agent 1: Research existing dashboard patterns in /src/atomic-crm/
Agent 2: Analyze required database schema changes
Agent 3: Investigate relevant shadcn/ui components
Agent 4: Review similar features for UX patterns


## Critical Rules
- Never work sequentially when parallel is possible
- Each agent must have clear, independent scope
- Agents write findings to `.docs/plans/[feature]/[aspect].md`
- Main thread synthesizes after parallel completion

## Build & Development Commands

**IMPORTANT**: All build operations use npm scripts only. No Makefile or other build tools.
This project previously used a Makefile but it was removed per Engineering Constitution Rule #2 (SINGLE SOURCE OF TRUTH).

### Development
```bash
npm run dev              # Start development server (port 5173)
npm run build            # Build for production (TypeScript check + Vite build)
npm run preview          # Preview production build locally
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:ci          # Run tests once (for CI)
npm run test:performance # Run performance benchmarks
npm run test:load        # Run load tests
```

**Testing Documentation**: Comprehensive testing strategy documented in `.docs/plans/ui-ux-testing-automation/`:
- `requirements.md` - Testing strategy with critical gaps (RBAC, API errors, cleanup, selectors, a11y)
- `shared.md` - Testing patterns and architecture
- `react-admin-patterns.research.md` - React Admin-specific patterns
- `env-and-auth.research.md` - Environment and authorization testing
- `existing-test-setup.research.md` - Current Vitest configuration

### Code Quality
```bash
npm run lint             # Check linting and formatting
npm run lint:check       # Check ESLint only
npm run lint:apply       # Auto-fix ESLint issues
npm run prettier:check   # Check Prettier formatting
npm run prettier:apply   # Auto-fix Prettier formatting
npm run validate:colors  # Validate semantic color usage
```

### Database & Deployment
```bash
npm run supabase:deploy  # Deploy database migrations and functions
npm run prod:start       # Build and start production server locally
npm run prod:deploy      # Deploy to production (GitHub Pages)
```

### Development Utilities
```bash
npm run seed:data             # Insert test data
npm run seed:data:dry-run     # Preview test data
npm run seed:data:clean       # Clean and regenerate test data
npm run cache:clear           # Clear application caches
npm run cache:clear:dry-run   # Preview cache clear
npm run search:reindex        # Reindex search data
npm run search:reindex:dry-run # Preview reindex
npm run migrate:production    # Execute production migration
npm run migrate:dry-run       # Preview migration changes
npm run migrate:backup        # Backup before migration
npm run migrate:rollback      # Rollback to previous state
npm run migrate:validate      # Validate migration success
npm run migrate:status        # Check migration status
```

### MCP Tool Access
When working with the database, use the Supabase Lite MCP tools:
- `mcp__supabase-lite__list_tables` - List database tables
- `mcp__supabase-lite__execute_sql` - Execute queries (SELECT/INSERT/UPDATE/DELETE)
- `mcp__supabase-lite__apply_migration` - Apply DDL migrations (CREATE/ALTER/DROP)
- `mcp__supabase-lite__generate_typescript_types` - Generate types
- `mcp__supabase-lite__get_logs` - View service logs (api/postgres/auth/storage/realtime)
- `mcp__supabase-lite__get_advisors` - Security and performance recommendations

## Development Status
**NOT PRODUCTION** - Development environment only. All data is test data and can be modified/deleted.

## Architecture Overview

### Core Stack
- **Frontend**: React 19 + React Admin 5 + shadcn/ui + Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Validation**: Zod schemas at API boundaries
- **State**: React Admin store + React Query

### Application Entry Point
- `src/main.tsx` → `src/App.tsx` → `src/atomic-crm/root/CRM.tsx`
- `CRM.tsx` wraps React Admin's `<Admin>` component with configuration
- Resources registered via `<Resource>` components in `CRM.tsx`
- Custom routes for settings, password reset, etc. via `<CustomRoutes>`

### Data Provider Architecture
Unified Supabase data provider at `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`:
- Implements React Admin DataProvider interface
- All CRUD operations go through this single provider
- Zod validation integrated at API boundaries before database calls
- File attachments managed via Supabase Storage
- Consolidates transformation logic (was 4+ layers, now 2 max)
- Error logging and resource-specific transformations built-in

### Component Architecture
Three-tier system:
1. **Base** (`src/components/ui/`): shadcn/ui primitives
2. **Admin** (`src/components/admin/`): React Admin integration layer
3. **Feature** (`src/atomic-crm/`): Business logic components

### Feature Module Pattern
Each entity follows consistent structure:
```
src/atomic-crm/[feature]/
├── index.ts            # Resource config for React Admin
├── [Feature]List.tsx   # List view with filters
├── [Feature]Show.tsx   # Detail view
├── [Feature]Edit.tsx   # Edit form
├── [Feature]Create.tsx # Create form
└── [Feature]Inputs.tsx # Shared form inputs
```

### Database Schema
Opportunities-based CRM with key tables:
- `opportunities` - Sales pipeline (multi-stakeholder support)
- `companies` - Organizations with hierarchies
- `contacts` - People with JSONB arrays for emails/phones (e.g., `[{"email":"x@y.com"}]`)
- `contact_organizations` - Many-to-many relationships with primary flag, decision maker status, and relationship dates
- `activities` - Engagements and interactions
- `tasks` - Action items with type enum (call, email, meeting, todo, follow_up)
- `contact_notes` / `opportunity_notes` - Entity-specific notes
- `tags` - Flexible tagging system
- RLS: Simple `auth.role() = 'authenticated'` on all tables
- Soft deletes via `deleted_at` timestamps
- Views: `contacts_summary` (denormalized contact data with company names)

### Validation Layer
Zod schemas in `src/atomic-crm/validation/` (API boundary only):
- `opportunities.ts` - Probability, amount, stage validation
- `organizations.ts` - URL and LinkedIn validation
- `contacts.ts` - Email/phone JSONB array validation
- `tasks.ts` - Type enum and status validation
- `notes.ts` - Contact/opportunity note validation
- `tags.ts` - Tag creation and update validation
- `products.ts` - Product validation
All validation integrated into `unifiedDataProvider.ts` before database operations

### Key Patterns
- **Resource Registration**: All resources in `src/atomic-crm/root/CRM.tsx`
- **Kanban Board**: Stage-based visualization using index field for opportunity ordering within columns
- **Multi-Org Contacts**: Junction table `contact_organizations` with primary flag, decision maker status, and relationship tracking
- **Junction Table Sync**: Contacts/organizations synced via `sync_contact_organizations` RPC (similar to opportunities/products pattern)
- **Activity Types**: Engagements (standalone) vs Interactions (opportunity-linked)
- **Filter System**: Multi-select filters with JSONB array fields in `src/atomic-crm/filters/`
- **Avatar Storage**: Supabase Storage buckets for avatars/logos, handled by `avatar.utils.ts`
- **Configuration**: Global app config via `ConfigurationProvider` in `CRM.tsx`

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
OPPORTUNITY_DEFAULT_STAGE=lead
OPPORTUNITY_PIPELINE_STAGES=lead,qualified,proposal,closed_won,closed_lost
```

### Recent Migration
System migrated from "deals" to "opportunities":
- Fresh schema, no backward compatibility
- All references updated throughout codebase
- Environment variables renamed from `DEAL_*` to `OPPORTUNITY_*`

## Memory Management Protocol

### Automatic Memory Storage
Claude MUST use the Memory MCP tools to automatically store knowledge when:

1. **Architectural Decisions** - Technology choices, pattern decisions, structural changes
   - Entity type: `architectural-decision`
   - Include: rationale, date, affected components, alternatives considered

2. **Bug Fixes** - After fixing any bug
   - Entity type: `bug-fix`
   - Include: symptoms, root cause, solution, affected files

3. **New Features** - When implementing features
   - Entity type: `feature`
   - Include: requirements, implementation approach, key files, dependencies

4. **Database Changes** - Migrations, schema modifications
   - Entity type: `database-change`
   - Include: migration name, reason, affected tables, breaking changes

5. **Performance Optimizations** - Query improvements, caching, code optimizations
   - Entity type: `optimization`
   - Include: bottleneck identified, solution, metrics improvement

6. **API Changes** - Endpoint additions/modifications, contract changes
   - Entity type: `api-change`
   - Include: endpoint, change type, reason, affected clients

7. **Engineering Constitution Violations Fixed** - When fixing code that violates principles
   - Entity type: `constitution-fix`
   - Include: violation type, location, fix applied

### Automatic Memory Recall
Before starting ANY task, Claude MUST:
1. Use `mcp__memory__search_nodes` to find related entities
2. Use `mcp__memory__open_nodes` to load relevant context
3. Reference prior decisions in responses (e.g., "Per our 2025-01-28 decision...")
4. Check for related bug-fixes to avoid regressions
5. Ensure consistency with established patterns

### Memory Operations
- **After completing work**: Create entities and relations for key decisions
- **Before answering questions**: Search memory for relevant context
- **When encountering inconsistencies**: Check memory for established patterns
- **Confirm memory saved**: Display "✓ Memory updated: [entity names]" after storage

### Memory Format Requirements
- **Observations**: Always include date (YYYY-MM-DD) as first observation
- **Relations**: Use active voice (e.g., "implements", "depends_on", "fixes")
- **Tags**: Add relevant tags to observations for searchability
- **File Paths**: Use absolute paths in observations when referencing code