# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Engineering Constitution

Core principles to prevent debates & ensure consistency:

1. **NO OVER-ENGINEERING**: No circuit breakers, health monitoring, or backward compatibility. Fail fast.
2. **SINGLE SOURCE OF TRUTH**: One data provider (Supabase), one validation layer (Zod at API boundary)
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
4. **VALIDATION**: Zod schemas at API boundary only (`src/atomic-crm/validation/`)
5. **TYPESCRIPT**: `interface` for objects/classes, `type` for unions/intersections
6. **FORMS**: Always use admin layer (`src/components/admin/`) for validation/errors
7. **COLORS**: Semantic CSS variables only (--primary, --destructive). Never use hex codes
8. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS (e.g., `20250126000000_migration_name.sql`)

## Build & Development Commands

### Essential Commands
```bash
npm run dev           # Start development server (port 5173)
npm run build         # TypeScript check + Vite build
npm run test          # Run Vitest tests
npm run lint:check    # Check ESLint violations
npm run lint:apply    # Fix ESLint violations
npm run prettier:check # Check formatting
npm run prettier:apply # Fix formatting
```

### Database Migration Commands
```bash
npm run migrate:production    # Execute production migration
npm run migrate:status        # Check migration status
npm run migrate:validate      # Validate migration success
npm run seed:data            # Insert test data
npm run seed:data:dry-run    # Preview seed data
```

### MCP Tool Access
When working with the database, use the Supabase MCP tools:
- `mcp__supabase__list_tables` - List database tables
- `mcp__supabase__execute_sql` - Execute queries
- `mcp__supabase__apply_migration` - Apply DDL migrations
- `mcp__supabase__generate_typescript_types` - Generate types

## Development Status
**NOT PRODUCTION** - Development environment only. All data is test data and can be modified/deleted.

## Architecture Overview

### Core Stack
- **Frontend**: React 19 + React Admin 5 + shadcn/ui + Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Validation**: Zod schemas at API boundaries
- **State**: React Admin store + React Query

### Data Provider Architecture
Unified Supabase data provider at `src/atomic-crm/providers/supabase/dataProvider.ts`:
- Implements React Admin DataProvider interface
- All CRUD operations go through this single provider
- Zod validation integrated at API boundaries
- File attachments managed via Supabase Storage

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
- `contacts` - People (JSONB for emails/phones)
- `contact_organizations` - Many-to-many relationships
- `activities` - Engagements and interactions
- RLS: Simple `auth.role() = 'authenticated'`
- Soft deletes via `deleted_at` timestamps

### Validation Layer
Zod schemas in `src/atomic-crm/validation/`:
- `opportunities.ts` - Probability, amount, stage validation
- `organizations.ts` - URL and LinkedIn validation
- `contacts.ts` - Email/phone JSONB validation
- All validation at API boundary only

### Key Patterns
- **Resource Registration**: All resources in `src/atomic-crm/root/CRM.tsx`
- **Kanban Board**: Drag-drop via index field in opportunities
- **Multi-Org Contacts**: Junction table with role/influence tracking
- **Activity Types**: Engagements (standalone) vs Interactions (opportunity-linked)

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_INBOUND_EMAIL=capture@example.com  # Optional
OPPORTUNITY_DEFAULT_STAGE=lead
OPPORTUNITY_PIPELINE_STAGES=lead,qualified,proposal,closed_won,closed_lost
```

### Recent Migration
System migrated from "deals" to "opportunities":
- Fresh schema, no backward compatibility
- All references updated throughout codebase
- Environment variables renamed from `DEAL_*` to `OPPORTUNITY_*`