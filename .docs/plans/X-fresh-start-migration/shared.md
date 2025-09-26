# Fresh Start Migration: Shared Architecture Document

This migration creates a clean Atomic CRM database schema with correct "opportunities" naming from inception, removing all legacy "deals" code and backward compatibility layers. The approach leverages an empty database to avoid data transformation complexity while implementing proper Zod validation at API boundaries.

## Relevant Files

### Database Schema & Migrations
- `/supabase/migrations/20250125000000_fresh_crm_schema.sql`: **CURRENT** comprehensive fresh schema (2,800+ lines)
- `/docs/deprecated-migrations/`: Archived old timestamped migrations from legacy system
- `/docs/merged/migrations/`: Comprehensive staged migrations used as source for fresh schema
- `/scripts/mcp-migrate.js`: Migration execution script using MCP tools
- `/scripts/mcp-migrate-create.js`: Migration creation helper
- `/scripts/mcp-migrate-status.js`: Migration status checker

### Opportunities Module (Target State)
- `/src/atomic-crm/opportunities/`: Complete module with CRUD operations (22 files)
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board with drag-and-drop
- `/src/atomic-crm/opportunities/opportunity.ts`: Type definitions with multi-org support
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form validation patterns (now using Zod)

### Deals Legacy Code (Deleted)
- `/src/atomic-crm/deals/`: Entire legacy module (17 files, 35KB total) - DELETED
- `/src/atomic-crm/providers/commons/backwardCompatibility.ts`: 377-line compatibility layer - DELETED
- `/src/atomic-crm/dashboard/DealsPipeline.tsx`: Deprecated dashboard component - RENAMED
- `/src/atomic-crm/dashboard/DealsChart.tsx`: Legacy revenue chart - RENAMED

### Data Provider Architecture
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Production data provider with lifecycle callbacks
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified provider with Zod validation integration
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration
- `/src/atomic-crm/root/CRM.tsx`: Main application entry with resource registration

### Validation Infrastructure (Zod Schemas)
- `/src/atomic-crm/validation/`: **PRIMARY** Zod schema directory with all entity validation
- `/src/atomic-crm/validation/opportunities.ts`: Opportunity validation (probability 0-100)
- `/src/atomic-crm/validation/organizations.ts`: Company validation with URL validators
- `/src/atomic-crm/validation/contacts.ts`: Contact validation with JSONB support
- `/src/atomic-crm/validation/tasks.ts`: Task validation with reminder logic
- `/src/atomic-crm/validation/tags.ts`: Tag validation with semantic colors
- `/src/atomic-crm/validation/notes.ts`: Note validation with attachments
- `/src/components/admin/`: Admin form layer for consistent validation and error handling

### Development Tools & Scripts
- MCP Database Commands: `mcp__supabase__apply_migration`, `mcp__supabase__execute_sql`, `mcp__supabase__generate_typescript_types`
- Seed Data: `npm run seed:data`, `npm run seed:data:dry-run`, `npm run seed:data:clean`

## Database Schema Overview

### ENUM Types (12 total)
- `organization_type`: customer, principal, distributor, prospect, vendor, partner, unknown
- `contact_role`: decision_maker, influencer, buyer, end_user, gatekeeper, champion, technical, executive
- `opportunity_stage`: lead, qualified, needs_analysis, proposal, negotiation, closed_won, closed_lost, nurturing
- `opportunity_status`: active, on_hold, nurturing, lost, won
- `interaction_type`: call, email, meeting, demo, proposal, negotiation, follow_up, support, training, onboarding, other
- `activity_type`: engagement, interaction
- `priority_level`: low, medium, high, critical
- `product_category`: 19 categories (beverages, dairy, frozen, etc.)
- `storage_temperature`: frozen, refrigerated, cool, room_temperature, no_requirement
- `product_status`: active, discontinued, seasonal, out_of_stock, limited_availability, new
- `unit_of_measure`: 16 units (each, case, pallet, pound, kilogram, etc.)
- `pricing_model_type`: fixed, tiered, volume, subscription, dynamic

### Core Tables (24 total)
1. `sales`: User management linked to auth.users
2. `companies`: Organizations with type, priority, hierarchy support
3. `contacts`: People with JSONB email/phone, role, influence metrics
4. `opportunities`: Sales pipeline (NOT deals) with stages and probability
5. `opportunityNotes`: Communication history (NOT dealNotes)
6. `tags`: Flexible categorization with semantic colors
7. `tasks`: Activity tracking with reminders
8. `contactNotes`: Contact communication history
9. `contact_organizations`: Many-to-many contact↔company relationships
10. `contact_preferred_principals`: Contact advocacy tracking
11. `opportunity_participants`: Multi-principal opportunity support
12. `activities`: Engagement vs interaction tracking
13. `interaction_participants`: Activity participant tracking
14. `products`: Comprehensive product catalog
15. `product_category_hierarchy`: Category tree structure
16. `product_pricing_tiers`: Volume-based pricing
17. `product_distributor_authorizations`: Distributor access control
18. `product_inventory`: Stock tracking with reorder points
19. `product_pricing_models`: Flexible pricing strategies
20. `product_features`: Product feature highlights
21. `opportunity_products`: Opportunity line items
22. `migration_history`: Migration tracking

### Views (18 total)
- `opportunities_summary`: Optimized opportunity queries with win rates
- `companies_summary`: Companies with relationship counts
- `contacts_summary`: Contact details with organization relationships
- `opportunities_with_participants`: Denormalized participant data
- `contact_influence_profile`: Contact decision authority analysis
- `principal_advocacy_dashboard`: Principal performance metrics
- `engagement_analytics`: Engagement metrics by month
- `interaction_analytics`: Opportunity interaction tracking
- `contact_engagement_summary`: Contact activity summary
- `product_catalog`: Products with pricing and availability
- `product_performance`: Product sales analytics
- `opportunities_legacy`: Backward compatibility view (DB only)

### Database Functions (20+ total)
Key business logic enforced at database level:
- `update_search_tsv()`: Maintains full-text search vectors
- `calculate_opportunity_probability()`: Auto-calculates probability based on stage
- `validate_principal_organization()`: Ensures principal integrity
- `sync_primary_organization()`: Syncs contact primary organization
- `validate_opportunity_participants()`: Enforces participant business rules
- `validate_activity_consistency()`: Ensures activity data integrity
- `validate_pricing_tiers()`: Prevents pricing overlap
- `handle_new_user()` / `handle_update_user()`: Auth integration
- `get_contact_organizations()`: Contact relationship queries
- `create_opportunity_with_participants()`: Complex opportunity creation
- `log_engagement()` / `log_interaction()`: Activity logging
- `calculate_product_price()`: Dynamic pricing calculation
- `check_product_availability()`: Inventory and seasonality checks

### Triggers (11 total)
- 4 search vector update triggers
- Opportunity probability calculation trigger
- Principal organization validation trigger
- Primary organization sync trigger
- Opportunity participant validation trigger
- Activity consistency validation trigger
- Pricing tier validation trigger
- 2 auth user lifecycle triggers

### Indexes (85+ total)
- 50+ performance indexes on foreign keys
- 4 GIN indexes for full-text search
- Multiple composite indexes for common queries
- Partial indexes for soft deletes and filtered queries

### Key Constraints & Business Rules
- CHECK constraints: `probability BETWEEN 0 AND 100`, `priority IN (1,2,3,4,5)`, positive amounts
- UNIQUE constraints: SKU per principal, active contact-organization pairs
- EXCLUDE constraints: Prevent overlapping pricing tiers
- RLS policies: `FOR ALL USING (auth.role() = 'authenticated' AND deleted_at IS NULL)`

## Architectural Patterns

### Database-Level Business Logic
**Critical Pattern**: Extensive business logic implemented via PostgreSQL functions and triggers
- Search vector maintenance automatic via triggers
- Opportunity probability auto-calculation based on stage
- Multi-principal validation and relationship management
- Activity consistency enforcement
- Complex product pricing and availability calculations
- **Why it matters**: Ensures data integrity at lowest level, prevents duplicate logic

### Validation Architecture
**Zod Schemas at API Boundaries**: All validation in `/src/atomic-crm/validation/`
- Single-point validation per Core Principle #3
- Schemas export both Zod definitions and React Admin validation functions
- Business rules: probability 0-100, semantic colors only, reminder dates before due dates
- JSONB field validation for flexible email/phone storage
- **Current State**: Zod already implemented for all core entities

### Product Catalog System
**Complete Product Management**: Comprehensive subsystem with pricing and inventory
- Multi-tiered pricing models (fixed, tiered, volume, subscription)
- Distributor authorization controls
- Inventory tracking with reorder points
- Seasonal availability management
- Product features and categorization hierarchy
- **Integration**: Products link to opportunities via `opportunity_products`

### Activity System (Engagements vs Interactions)
**Two-Type Activity Model**: Distinguishes customer touchpoints
- **Engagements**: Activities without opportunity context (prospecting, general outreach)
- **Interactions**: Activities linked to specific opportunities (demos, negotiations)
- Tracked via `activities` table with `activity_type` enum
- Functions `log_engagement()` and `log_interaction()` for proper recording

### Multi-Organization Contact Management
**Complex Relationship Model**: Contacts belong to multiple organizations
- `contact_organizations` junction with role, influence, decision authority
- `contact_preferred_principals` tracks principal preferences
- Primary organization syncing via triggers
- Functions for querying organizational relationships

### Full-Text Search Implementation
**PostgreSQL tsvector Pattern**: High-performance search
- `search_tsv` columns on searchable tables
- GIN indexes for fast full-text queries
- Automatic maintenance via `update_search_tsv()` triggers
- Weighted search across multiple fields

### Soft Delete Pattern
**Logical Deletion**: Use `deleted_at` timestamps
- All tables include `deleted_at` column
- RLS policies filter: `AND deleted_at IS NULL`
- `unarchiveOpportunity()` method for restoration
- Maintains referential integrity and audit trail

### Summary View Optimization
**Pre-computed Views**: Performance optimization for list operations
- `*_summary` views aggregate common queries
- Include relationship counts and metrics
- Materialized views for expensive calculations
- Used by React Admin list components

### Kanban Index Management
**Drag-Drop Reordering**: Complex positioning logic
- Index field for manual ordering within stages
- Gap-based indexing to minimize updates
- Implemented in `OpportunityListContent.tsx`

### Migration Numbering
**Timestamp Format**: YYYYMMDDHHMMSS (e.g., `20250125000000_fresh_crm_schema.sql`)
- Ensures explicit ordering
- Prevents numbering conflicts
- Allows parallel development

### Resource Registration
**React Admin Pattern**: Lazy-loaded components
- Resources registered in `/src/atomic-crm/root/CRM.tsx`
- Minimal exports from feature modules
- Automatic route and navigation generation

### Data Provider Lifecycle
**Pre/Post Operation Hooks**: Transform and validate data
- Attachment handling in lifecycle callbacks
- File upload processing for avatars
- Transformation between API and UI formats

### Form Structure
**Admin Form Layer**: Consistent validation and error handling
- Components in `/src/components/admin/`
- Integrated with React Hook Form
- Zod validation at submission

### RLS Security
**Simple Authentication**: No complex multi-tenant logic
- Pattern: `FOR ALL USING (auth.role() = 'authenticated' AND deleted_at IS NULL)`
- All authenticated users see all data
- Soft deletes enforced at RLS level

### Storage Integration
**Supabase Storage**: File attachment management
- Public bucket with RLS policies
- Processed via dataProvider lifecycle callbacks
- Automatic cleanup on record deletion

## Relevant Docs

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on validation (Core Principle #3), data provider consolidation (Core Principle #1), and migration approach (Core Principle #9 - no backward compatibility)

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md`**: You _must_ read this when implementing any migration phase - contains complete file lists, SQL templates, and execution workflow

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/database-research.docs.md`**: You _must_ read this when creating the fresh schema migration - contains all table structures, indexes, views, functions, and RLS policies

**`/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`**: The actual fresh schema implementation - definitive source for database structure

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/opportunities-research.docs.md`**: You _must_ read this when understanding the target state - shows correct component patterns and business logic

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/deals-legacy-research.docs.md`**: You _must_ read this when removing legacy code - contains complete list of files to delete and modify

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/data-provider-research.docs.md`**: You _must_ read this when updating the data provider - shows transformation logic and resource configuration

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/validation-research.docs.md`**: You _must_ read this when implementing Zod schemas - identifies all validation points and consolidation opportunities

**`/home/krwhynot/Projects/atomic/docs/database/09-developer-getting-started.md`**: Reference for database setup and environment configuration

**`/home/krwhynot/Projects/atomic/README.md`**: Project overview and development commands