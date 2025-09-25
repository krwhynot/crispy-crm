# Fresh Start Migration: Shared Architecture Document - Part 2 (Critical Additions)

This document contains the **critical architectural components that were missing** from the original shared.md documentation but exist in the actual implementation. These gaps were identified through analysis of the fresh schema SQL and codebase.

## Missing Database Objects (Actually Implemented)

### ENUM Types (12 total - ALL were undocumented)
These define the allowed values for critical fields throughout the system:
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

### Missing Core Tables (15 of 22 were undocumented)
Original documented only 7 tables. These 15 were completely missing:
- `activities`: Engagement vs interaction tracking
- `interaction_participants`: Activity participant tracking
- `contact_preferred_principals`: Contact advocacy tracking
- `products`: Comprehensive product catalog
- `product_category_hierarchy`: Category tree structure
- `product_pricing_tiers`: Volume-based pricing
- `product_distributor_authorizations`: Distributor access control
- `product_inventory`: Stock tracking with reorder points
- `product_pricing_models`: Flexible pricing strategies
- `product_features`: Product feature highlights
- `opportunity_products`: Opportunity line items
- `migration_history`: Migration tracking
- Plus the junction table `interaction_participants`

### Missing Views (9 of 12 were undocumented)
Original listed only 3 summary views. These 9 were missing:
- `opportunities_with_participants`: Denormalized participant data
- `contact_influence_profile`: Contact decision authority analysis
- `principal_advocacy_dashboard`: Principal performance metrics
- `engagement_analytics`: Engagement metrics by month
- `interaction_analytics`: Opportunity interaction tracking
- `contact_engagement_summary`: Contact activity summary
- `product_catalog`: Products with pricing and availability
- `product_performance`: Product sales analytics
- `opportunities_legacy`: Backward compatibility view (DB only)

### Database Functions (ALL 16 were undocumented)
**This is the most critical gap** - extensive business logic at database level:
- `update_search_tsv()`: Maintains full-text search vectors
- `calculate_opportunity_probability()`: Auto-calculates probability based on stage
- `validate_principal_organization()`: Ensures principal integrity
- `sync_primary_organization()`: Syncs contact primary organization
- `validate_opportunity_participants()`: Enforces participant business rules
- `validate_activity_consistency()`: Ensures activity data integrity
- `validate_pricing_tiers()`: Prevents pricing overlap
- `handle_new_user()` / `handle_update_user()`: Auth integration
- `get_contact_organizations()`: Contact relationship queries
- `get_organization_contacts()`: Reverse relationship queries
- `create_opportunity_with_participants()`: Complex opportunity creation
- `log_engagement()`: Engagement activity logging
- `log_interaction()`: Interaction activity logging
- `calculate_product_price()`: Dynamic pricing calculation
- `check_product_availability()`: Inventory and seasonality checks

### Triggers (ALL 11 were undocumented)
Automatic business rule enforcement:
- 4 search vector update triggers (companies, contacts, opportunities, products)
- Opportunity probability calculation trigger
- Principal organization validation trigger
- Primary organization sync trigger
- Opportunity participant validation trigger
- Activity consistency validation trigger
- Pricing tier validation trigger
- 2 auth user lifecycle triggers

### Indexes (85+ total - none were documented)
Critical for performance:
- 50+ performance indexes on foreign keys
- 4 GIN indexes for full-text search
- Multiple composite indexes for common queries
- Partial indexes for soft deletes and filtered queries

### Key Constraints & Business Rules (none were documented)
Data integrity enforcement:
- CHECK constraints: `probability BETWEEN 0 AND 100`, `priority IN (1,2,3,4,5)`, positive amounts
- UNIQUE constraints: SKU per principal, active contact-organization pairs
- EXCLUDE constraints: Prevent overlapping pricing tiers
- RLS refinement: `AND deleted_at IS NULL` (not just authenticated)

## Missing Architectural Patterns

### Database-Level Business Logic (Completely Missing)
**Most Critical Omission**: Extensive business logic via PostgreSQL functions and triggers
- Search vector maintenance automatic via triggers
- Opportunity probability auto-calculation based on stage
- Multi-principal validation and relationship management
- Activity consistency enforcement
- Complex product pricing and availability calculations
- **Impact**: Developers would duplicate this logic or violate business rules

### Product Catalog System (Completely Missing)
Comprehensive subsystem not mentioned:
- Multi-tiered pricing models (fixed, tiered, volume, subscription)
- Distributor authorization controls
- Inventory tracking with reorder points
- Seasonal availability management
- Product features and categorization hierarchy
- **Impact**: Major domain completely undocumented

### Activity System Pattern (Completely Missing)
Two-type activity model not documented:
- **Engagements**: Activities without opportunity context
- **Interactions**: Activities linked to specific opportunities
- Tracked via `activities` table with `activity_type` enum
- Functions `log_engagement()` and `log_interaction()` for recording
- **Impact**: Core business rule for customer touchpoint tracking unknown

### Multi-Organization Contact Management (Completely Missing)
Complex relationship model not documented:
- `contact_organizations` junction with role, influence, decision authority
- `contact_preferred_principals` tracks principal preferences
- Primary organization syncing via triggers
- Functions for querying organizational relationships
- **Impact**: Critical relationship model would be misunderstood

### Full-Text Search Implementation (Completely Missing)
PostgreSQL tsvector pattern not documented:
- `search_tsv` columns on searchable tables
- GIN indexes for fast full-text queries
- Automatic maintenance via `update_search_tsv()` triggers
- Weighted search across multiple fields
- **Impact**: Developers might implement inefficient search

## Missing File References

### Primary Validation Directory (Missing)
- `/src/atomic-crm/validation/` - Central directory for ALL Zod schemas
- Individual schema files for each entity (opportunities.ts, organizations.ts, etc.)
- **Status Correction**: Zod is ALREADY IMPLEMENTED, not future work

### Current Migration File (Misrepresented)
- `/supabase/migrations/20250125000000_fresh_crm_schema.sql` - This is the CURRENT schema
- Was implied to be archived, but it's the active migration

### Development Tools (Missing)
- MCP Database Commands: `mcp__supabase__apply_migration`, `mcp__supabase__execute_sql`
- Seed Data Scripts: `npm run seed:data`, `npm run seed:data:dry-run`

## Critical Business Logic Examples (All Undocumented)

### Automatic Probability Calculation
```sql
-- This trigger automatically sets probability based on stage
-- Developers don't know this happens!
CREATE TRIGGER set_opportunity_probability
    BEFORE INSERT OR UPDATE OF stage ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_opportunity_probability();
```

### Principal Organization Validation
```sql
-- Ensures only principals can be set as principal_organization_id
-- Violating this causes database errors developers won't understand
CREATE TRIGGER validate_principal_org
    BEFORE INSERT OR UPDATE OF principal_organization_id ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION validate_principal_organization();
```

### Complex Product Pricing
```sql
-- Dynamic pricing based on quantity, customer type, and season
-- Complete pricing logic hidden from application developers
CREATE FUNCTION calculate_product_price(
    p_product_id UUID,
    p_quantity INTEGER,
    p_customer_type organization_type,
    p_date DATE DEFAULT CURRENT_DATE
)
```

## Why These Omissions Matter

1. **Hidden Business Rules**: 16 functions contain critical logic developers need to know
2. **Performance Impact**: Missing views mean developers write inefficient queries
3. **Data Integrity**: Constraints and triggers enforce rules silently
4. **Debugging Nightmare**: Developers waste hours not knowing triggers modify data
5. **Duplication Risk**: Without knowing DB logic exists, it gets reimplemented
6. **Product Domain**: Entire product catalog system was invisible
7. **Activity Pattern**: Core distinction between engagement/interaction unknown

## Recommendations

1. **Database Documentation**: Always document ALL database objects, especially functions/triggers
2. **Business Logic Visibility**: Make database-level logic explicit in architecture docs
3. **Pattern Documentation**: Document patterns even if they seem "implementation details"
4. **File Accuracy**: Ensure file paths reflect current state, not transitional state
5. **Validation Status**: Be clear about what's implemented vs. planned

This part 2 document reveals that approximately **80% of the database complexity** was undocumented in the original shared.md file, including ALL business logic functions and triggers.