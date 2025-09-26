# Database Schema Structure Research

Comprehensive analysis of the Atomic CRM database schema architecture focusing on core tables, relationships, performance features, and data integrity mechanisms.

## Relevant Files
- `/home/krwhynot/Projects/atomic/supabase/migrations/archive/20250125000000_fresh_crm_schema.sql`: Complete baseline schema with 24 core tables and business logic
- `/home/krwhynot/Projects/atomic/supabase/migrations/RECONCILIATION_SUMMARY.md`: Database state summary and migration history
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping and soft delete configuration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`: Zod validation schemas for organizations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod validation schemas for opportunities
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`: TypeScript type definitions for core entities

## Architectural Patterns

### **Fresh Opportunities-Based Design**
- Complete migration from "deals" to "opportunities" terminology with no backward compatibility
- Organizations-first architecture supporting multiple organization types (customer, principal, distributor)
- Multi-principal support through junction tables for complex B2B relationships

### **Three-Tier Entity Hierarchy**
- **Core Entities**: organizations, contacts, opportunities (24 total tables)
- **Junction Tables**: contact_organizations, opportunity_participants, interaction_participants for many-to-many relationships
- **Activity System**: Distinction between engagements (standalone) and interactions (opportunity-linked)

### **JSONB Flexibility Pattern**
- Email/phone stored as JSONB arrays in contacts table for multiple values with types
- Product specifications, dimensions, nutritional info stored as JSONB
- Pricing rules and special pricing configurations use JSONB for flexibility

### **Soft Delete with Constraints**
- `deleted_at` timestamp pattern across core entities (organizations, contacts, opportunities, activities)
- Exclusion constraints ensure uniqueness only for non-deleted records
- RLS policies filter deleted records automatically

## Schema Design Patterns

### **Enum-Based Type Safety**
- 17 custom PostgreSQL ENUMs for controlled vocabularies (organization_type, contact_role, opportunity_stage, etc.)
- Product categories, storage temperatures, pricing models all enum-constrained
- Interaction types and activity types provide structured activity tracking

### **Generated Computed Fields**
- `quantity_available` calculated as `quantity_on_hand - quantity_committed` in product_inventory
- `extended_price` and `final_price` auto-calculated in opportunity_products with discount logic
- Eliminates data inconsistency and reduces application complexity

### **Hierarchical Organization Support**
- Self-referential `parent_organization_id` in organizations table
- Product category hierarchy with level tracking and category paths
- Supports complex organizational structures and product categorization

## Performance Optimization Features

### **Strategic Indexing (85+ indexes)**
- **Partial Indexes**: Only on non-deleted records (`WHERE deleted_at IS NULL`)
- **Composite Indexes**: Multi-column indexes for common query patterns
- **GIN Indexes**: Full-text search on `search_tsv` columns (organizations, contacts, opportunities, products)
- **Constraint Indexes**: Unique constraints with exclusion patterns for soft deletes

### **Full-Text Search Implementation**
- `search_tsv` tsvector columns updated via triggers before INSERT/UPDATE
- English language stemming and ranking support
- Separate search vectors for organizations, contacts, opportunities, and products
- Trigger function `update_search_tsv()` maintains search vectors automatically

### **Query Optimization Patterns**
- Summary views (`organizations_summary`, `contacts_summary`, `opportunities_summary`) for React Admin list views
- Indexed foreign key relationships for join performance
- Strategic use of `WHERE` clauses in partial indexes to improve selectivity

## Security Features

### **Simple RLS Model**
- Enabled on all 24+ tables with consistent pattern
- Single policy per table: "Enable all access for authenticated users"
- Soft delete filtering built into RLS policies (`USING (deleted_at IS NULL)`)
- SECURITY DEFINER functions for auth user management

### **Data Integrity Constraints**
- Check constraints for valid ranges (probability 0-100, purchase influence 0-100)
- Foreign key cascades for dependent data cleanup
- Exclusion constraints prevent duplicate primary relationships
- Validation functions ensure business rule compliance

### **Auth Integration**
- Automatic sales record creation via `handle_new_user()` trigger
- User email synchronization with `handle_update_user()` trigger
- Clean separation between auth.users and application sales table

## Data Integrity Mechanisms

### **Business Logic Functions (20+)**
- `calculate_opportunity_probability()`: Auto-calculates probability based on stage changes
- `validate_principal_organization()`: Ensures only principals can be assigned as such
- `sync_primary_organization()`: Maintains single primary organization per contact
- `validate_opportunity_participants()`: Enforces participant role rules and primary designation
- `validate_activity_consistency()`: Links interactions to correct customer organizations

### **Trigger-Based Automation**
- Search vector updates on data changes
- Probability calculation on stage transitions
- Primary relationship management across junction tables
- Activity consistency validation and opportunity linking

### **Complex Junction Table Management**
- `contact_organizations`: Many-to-many contacts↔organizations with role tracking
- `opportunity_participants`: Multi-stakeholder opportunities with commission tracking
- `contact_preferred_principals`: Principal advocacy strength tracking
- Constraint validation ensures data quality and business rule compliance

## Edge Cases & Gotchas

### **Primary Relationship Complexity**
- Contacts can belong to multiple organizations via `contact_organizations` junction
- Only one `is_primary` relationship allowed per contact enforced by triggers
- Legacy `company_id` field maintained for backward compatibility but updated by triggers

### **Activity System Distinction**
- **Engagements**: Activities without opportunity context (general relationship building)
- **Interactions**: Activities linked to specific opportunities (sales process activities)
- Constraint validation ensures interactions always have opportunity_id

### **Multi-Principal Architecture**
- Opportunities support multiple principals through `opportunity_participants` table
- Legacy `principal_organization_id` field still exists but participants table is source of truth
- Commission rates and territory assignments tracked per participant

### **Product Pricing Complexity**
- Multiple pricing models: fixed, tiered, volume, subscription, custom
- Tier validation prevents overlapping quantity ranges
- Distributor authorizations control product access by territory

### **Search Vector Maintenance**
- Triggers automatically update search vectors but can impact write performance
- Different search content for each entity type optimized for their specific use cases
- JSONB fields converted to text for search indexing

## Relevant Docs
- [PostgreSQL Full-Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)