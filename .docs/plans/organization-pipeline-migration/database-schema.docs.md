# Database Schema Research - Company→Organization Migration

Comprehensive analysis of the Atomic CRM database schema focusing on companies, opportunities, and all related relationships to support the company→organization rename and opportunity stage changes.

## Relevant Files

- `/supabase/migrations/20250125000000_fresh_crm_schema.sql`: Main schema definition with all tables, relationships, and constraints
- `/supabase/migrations/20250925094751_fix_summary_view_permissions.sql`: Recent view permissions fix
- `/src/atomic-crm/types.ts`: TypeScript type definitions for all entities
- `/src/atomic-crm/validation/organizations.ts`: Organization/company validation schemas and functions
- `/src/atomic-crm/validation/opportunities.ts`: Opportunity validation schemas and functions
- `/src/atomic-crm/validation/contacts.ts`: Contact validation schemas with multi-organization support
- `/src/types/database.generated.ts`: Auto-generated database types from Supabase
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Data provider with validation integration

## Schema Overview

The Atomic CRM uses a fresh "opportunities-first" schema (not deals) with comprehensive multi-principal support and advanced relationship modeling. The database currently uses `companies` table but references "organizations" throughout validation and types, indicating planned migration.

### Core Tables Structure

#### 1. Companies Table (Target for Rename → Organizations)
```sql
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organization_type organization_type DEFAULT 'customer',
    is_principal BOOLEAN DEFAULT false,
    is_distributor BOOLEAN DEFAULT false,
    parent_company_id BIGINT REFERENCES companies(id),
    segment TEXT DEFAULT 'Standard',
    priority VARCHAR(1) DEFAULT 'C' CHECK (priority IN ('A', 'B', 'C', 'D')),
    industry TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    linkedin_url TEXT,
    annual_revenue NUMERIC(15,2),
    employee_count INTEGER,
    founded_year INTEGER,
    notes TEXT,
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    import_session_id UUID,
    search_tsv tsvector
);
```

**Key Foreign Key Relationships:**
- `parent_company_id → companies(id)` (Self-referencing for hierarchies)
- `sales_id → sales(id)` (Account owner)
- `created_by → sales(id)` (Creator tracking)

#### 2. Opportunities Table
```sql
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stage opportunity_stage DEFAULT 'lead',
    status opportunity_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    amount NUMERIC(12,2),
    category TEXT,
    index INTEGER,
    estimated_close_date DATE,
    actual_close_date DATE,
    customer_organization_id BIGINT REFERENCES companies(id),
    principal_organization_id BIGINT REFERENCES companies(id),
    distributor_organization_id BIGINT REFERENCES companies(id),
    founding_interaction_id BIGINT,
    stage_manual BOOLEAN DEFAULT false,
    status_manual BOOLEAN DEFAULT false,
    next_action TEXT,
    next_action_date DATE,
    competition TEXT,
    decision_criteria TEXT,
    contact_ids BIGINT[] DEFAULT '{}',
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector
);
```

**Key Foreign Key Relationships:**
- `customer_organization_id → companies(id)` (Primary customer)
- `principal_organization_id → companies(id)` (Primary principal)
- `distributor_organization_id → companies(id)` (Primary distributor)
- `company_id → companies(id)` (Backward compatibility - legacy field)
- `sales_id → sales(id)` (Owner)
- `created_by → sales(id)` (Creator)

#### 3. Contacts Table
```sql
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email JSONB DEFAULT '[]'::jsonb,
    phone JSONB DEFAULT '[]'::jsonb,
    title TEXT,
    role contact_role,
    department TEXT,
    is_primary_contact BOOLEAN DEFAULT false,
    purchase_influence VARCHAR(10) DEFAULT 'Unknown',
    decision_authority VARCHAR(20) DEFAULT 'End User',
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    birthday DATE,
    linkedin_url TEXT,
    twitter_handle TEXT,
    notes TEXT,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector
);
```

**Key Foreign Key Relationships:**
- `company_id → companies(id)` (Primary organization - backward compatibility)
- `sales_id → sales(id)` (Owner)
- `created_by → sales(id)` (Creator)

## Junction Tables Analysis

### 1. Contact-Organizations Many-to-Many
```sql
CREATE TABLE contact_organizations (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    is_primary_decision_maker BOOLEAN DEFAULT false,
    is_primary_contact BOOLEAN DEFAULT false,
    role contact_role,
    purchase_influence SMALLINT CHECK (purchase_influence BETWEEN 0 AND 100),
    decision_authority SMALLINT CHECK (decision_authority BETWEEN 0 AND 100),
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT valid_relationship_dates
        CHECK (relationship_end_date IS NULL OR relationship_end_date > relationship_start_date),
    CONSTRAINT unique_contact_organization_active
        EXCLUDE (contact_id WITH =, organization_id WITH =)
        WHERE (deleted_at IS NULL)
);
```

**Foreign Key Dependencies:**
- `contact_id → contacts(id)` ON DELETE CASCADE
- `organization_id → companies(id)` ON DELETE CASCADE (**MIGRATION TARGET**)
- `created_by → sales(id)`

### 2. Contact Preferred Principals
```sql
CREATE TABLE contact_preferred_principals (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    advocacy_strength SMALLINT DEFAULT 50 CHECK (advocacy_strength BETWEEN 0 AND 100),
    last_interaction_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_contact_principal_active
        UNIQUE(contact_id, principal_organization_id, deleted_at)
);
```

**Foreign Key Dependencies:**
- `contact_id → contacts(id)` ON DELETE CASCADE
- `principal_organization_id → companies(id)` ON DELETE CASCADE (**MIGRATION TARGET**)
- `created_by → sales(id)`

### 3. Opportunity Participants (Multi-Principal Support)
```sql
CREATE TABLE opportunity_participants (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'principal', 'distributor', 'partner', 'competitor')),
    is_primary BOOLEAN DEFAULT false,
    commission_rate NUMERIC(5,4) CHECK (commission_rate >= 0 AND commission_rate <= 1),
    territory TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ
);
```

**Foreign Key Dependencies:**
- `opportunity_id → opportunities(id)` ON DELETE CASCADE
- `organization_id → companies(id)` (**MIGRATION TARGET**)
- `created_by → sales(id)`

## Tables Referencing Companies

### Direct References to companies(id)
1. **companies.parent_company_id** - Self-referencing hierarchy
2. **contacts.company_id** - Primary organization (backward compatibility)
3. **opportunities.customer_organization_id** - Customer organization
4. **opportunities.principal_organization_id** - Principal organization
5. **opportunities.distributor_organization_id** - Distributor organization
6. **opportunities.company_id** - Legacy backward compatibility field
7. **contact_organizations.organization_id** - Many-to-many relationships
8. **contact_preferred_principals.principal_organization_id** - Principal preferences
9. **opportunity_participants.organization_id** - Multi-principal support
10. **activities.organization_id** - Activity relationships
11. **tasks.company_id** - Task relationships
12. **products.principal_id** - Product ownership
13. **product_distributor_authorizations.distributor_id** - Distribution rights
14. **interaction_participants.organization_id** - Interaction participation

## Opportunity Stage Configuration

### Current Stage Enum
```sql
CREATE TYPE opportunity_stage AS ENUM (
    'lead',
    'qualified',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
    'nurturing'
);
```

### Stage-Probability Mapping (Automated Trigger)
```sql
-- Auto-calculation trigger function
CREATE OR REPLACE FUNCTION calculate_opportunity_probability()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage) AND NOT NEW.stage_manual THEN
        NEW.probability := CASE NEW.stage
            WHEN 'lead' THEN 10
            WHEN 'qualified' THEN 25
            WHEN 'needs_analysis' THEN 40
            WHEN 'proposal' THEN 60
            WHEN 'negotiation' THEN 80
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
            WHEN 'nurturing' THEN 15
        END;
    END IF;
    -- Auto-set close date for closed opportunities
    IF NEW.stage IN ('closed_won', 'closed_lost') AND NEW.actual_close_date IS NULL THEN
        NEW.actual_close_date := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Views and Functions Impact

### Summary Views (All Reference companies)
1. **companies_summary** - Company aggregation with contact/opportunity counts
2. **opportunities_summary** - Opportunity details with company information
3. **opportunities_with_participants** - Complex JSON aggregation of participants
4. **contact_influence_profile** - Cross-organization contact analysis
5. **principal_advocacy_dashboard** - Principal relationship metrics
6. **product_catalog** - Products with principal company information

### Helper Functions Affected
1. **get_contact_organizations(p_contact_id)** - Returns organization relationships
2. **get_organization_contacts(p_organization_id)** - Returns contacts for organization
3. **create_opportunity_with_participants()** - Multi-organization opportunity creation
4. **log_engagement()** - Activity logging with organization context
5. **log_interaction()** - Interaction logging with organization relationships
6. **validate_principal_organization()** - Business rule enforcement
7. **sync_primary_organization()** - Primary relationship maintenance
8. **validate_opportunity_participants()** - Multi-principal validation
9. **validate_activity_consistency()** - Activity-organization consistency

### Search Integration
Full-text search configured via `search_tsv` columns:
- companies.search_tsv (company name, industry, website, address)
- opportunities.search_tsv (name, description, next_action, category)
- contacts.search_tsv (name, title, department, email, phone)

## Migration Patterns and Conventions

### Naming Convention
- **Timestamp Format**: `YYYYMMDDHHMMSS` (e.g., `20250125000000_fresh_crm_schema.sql`)
- **Fresh Schema Approach**: Single comprehensive migration rather than incremental changes
- **No Backward Compatibility**: Fail-fast approach with complete schema replacement

### Migration History Tracking
```sql
CREATE TABLE migration_history (
    id BIGSERIAL PRIMARY KEY,
    phase_number TEXT NOT NULL,
    phase_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    rollback_sql TEXT,
    rows_affected BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Pattern
Simple authenticated-user pattern:
```sql
CREATE POLICY "Enable all access for authenticated users" ON companies
    FOR ALL TO authenticated USING (deleted_at IS NULL);
```

### Soft Delete Pattern
- `deleted_at TIMESTAMPTZ` columns on all core tables
- RLS policies filter by `deleted_at IS NULL`
- Indexes explicitly exclude deleted records

## Migration Impact Assessment

### Critical Changes Required

#### 1. Table Rename: companies → organizations
**Affected Objects:**
- 14 foreign key references across 10+ tables
- 15+ indexes referencing companies
- 8 summary views with company joins
- 12+ functions with company parameters
- All RLS policies on companies table

#### 2. Opportunity Stage Changes
**Affected Objects:**
- `opportunity_stage` enum type
- Stage-probability mapping in trigger function
- Validation schemas in TypeScript
- UI stage configurations
- Kanban board stage mappings

### Risk Areas

1. **View Dependencies**: Complex JSON aggregation views will need recreation
2. **Function Parameters**: All organization-related functions need parameter updates
3. **Search Integration**: `search_tsv` triggers reference table names
4. **Foreign Key Cascades**: CASCADE rules may cause unexpected deletions during migration
5. **Application Layer**: TypeScript types, validation schemas, and UI components

## Gotchas & Edge Cases

1. **Mixed Terminology**: Code uses "organizations" but database uses "companies" - indicates incomplete previous migration
2. **Backward Compatibility Fields**: `opportunities.company_id` exists for legacy support but should be removed
3. **Self-Referencing FK**: `companies.parent_company_id` creates circular dependency during rename
4. **JSON Aggregation Complexity**: Views use complex JSONB building that may break during table rename
5. **Trigger Dependencies**: Multiple triggers reference companies table by name in dynamic SQL
6. **Search Vector Updates**: Function `update_search_tsv()` uses `TG_TABLE_NAME` comparison
7. **Multi-Principal Logic**: Complex validation rules in triggers assume specific organization roles
8. **Cascade Behavior**: Some FKs use CASCADE, others don't - inconsistent deletion behavior

## Validation Layer Integration

### Current State
- TypeScript validation uses "Organization" types but references "Company" for compatibility
- Zod schemas named `organizationSchema` but aliased to `companySchema`
- Data provider maps both "companies" and "organizations" resources to same validation

### Migration Requirements
- Update resource mapping in `unifiedDataProvider.ts`
- Rename validation registry keys from "companies" to "organizations"
- Update generated TypeScript types from database schema
- Verify React Admin resource configurations

## Recommendations

1. **Phase Migration**: Execute in multiple phases to minimize risk
2. **Backup Strategy**: Full database backup before each phase
3. **Rollback Plan**: Prepare reverse migrations for each change
4. **Testing**: Comprehensive validation of all affected functions and views
5. **Monitoring**: Track performance impact of index recreation
6. **Gradual Deployment**: Blue-green deployment with feature flags