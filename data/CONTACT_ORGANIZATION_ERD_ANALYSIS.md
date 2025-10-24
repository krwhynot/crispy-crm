# Contact & Organization Entity Relationship Diagram Analysis

**Database:** Atomic CRM (Supabase PostgreSQL)
**Analysis Date:** 2025-10-24
**Scope:** Contact and Organization related entities
**Status:** Pre-launch phase

---

## Executive Summary

The Atomic CRM database implements a sophisticated contact and organization management system designed for a food brokerage business. The schema supports complex B2B relationships including:

- **Direct Contact-Organization Relationships**: Primary `contacts.organization_id` foreign key (current pattern)
- **Legacy Many-to-Many Relationships**: Deprecated `contact_organizations` junction table (historical data only)
- **Principal Preferences**: Contact-specific manufacturer preferences via `contact_preferred_principals`
- **Hierarchical Organizations**: Self-referencing organizational structures
- **Multi-tenant Security**: Row-level security (RLS) enabled on all tables
- **Audit Trail**: Comprehensive tracking via `created_by`, `updated_by`, `created_at`, `updated_at`

**Key Architectural Decision**: The system migrated from a many-to-many contact-organization relationship to a simpler one-to-many model where each contact has one primary organization (`contacts.organization_id`).

---

## Table Inventory

### Core Contact & Organization Tables

| Table Name | Type | Row Count | RLS Enabled | Primary Purpose |
|------------|------|-----------|-------------|-----------------|
| `contacts` | Entity | 0 | ✅ | Individual people/contacts |
| `organizations` | Entity | 0 | ✅ | Companies/organizations |
| `contact_organizations` | Junction (Deprecated) | 0 | ✅ | Historical contact-org relationships |
| `contact_preferred_principals` | Junction | 0 | ✅ | Contact preferences for manufacturers |

### Related Supporting Tables

| Table Name | Type | Row Count | RLS Enabled | Relationship to Contacts/Orgs |
|------------|------|-----------|-------------|-------------------------------|
| `sales` | Entity | 3 | ✅ | Sales reps who own contacts/orgs |
| `segments` | Reference | 0 | ✅ | Industry segments for organizations |
| `activities` | Activity | 0 | ✅ | Interactions with contacts/orgs |
| `contactNotes` | Notes | 0 | ✅ | Notes attached to contacts |
| `interaction_participants` | Junction | 0 | ✅ | Links contacts/orgs to activities |
| `tasks` | Task | 0 | ✅ | Tasks related to contacts |
| `opportunities` | Pipeline | 0 | ✅ | Sales opportunities with contacts/orgs |

---

## Detailed Table Analysis

### 1. `contacts` Table

**Purpose:** Stores individual people/contacts within the CRM system.

**Schema:**

```sql
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,

  -- Core Identity
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,

  -- Contact Information (JSONB Arrays)
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,

  -- Professional Details
  title TEXT,
  department TEXT,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,

  -- Address Information
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Social/Personal
  birthday DATE,
  linkedin_url TEXT,
  twitter_handle TEXT,
  gender TEXT,

  -- Relationship Management
  sales_id BIGINT REFERENCES sales(id),
  notes TEXT,
  tags BIGINT[] DEFAULT '{}'::bigint[],

  -- Timestamps & Tracking
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,

  -- Full-Text Search
  search_tsv TSVECTOR
);
```

**Key Features:**

- **JSONB Contact Methods**: Email and phone stored as JSONB arrays to support multiple values
- **Organization Link**: Single `organization_id` foreign key (replaces many-to-many)
- **Soft Deletes**: Uses `deleted_at` timestamp for logical deletion
- **Full-Text Search**: GIN index on `search_tsv` for fast text search
- **Audit Trail**: Tracks who created and last updated each record

**Indexes:**

| Index Name | Type | Columns | Purpose |
|------------|------|---------|---------|
| `contacts_pkey` | UNIQUE BTREE | `id` | Primary key |
| `idx_contacts_organization_id` | BTREE | `organization_id` | Fast org lookups |
| `idx_contacts_sales_id` | BTREE | `sales_id` | Filter by sales rep |
| `idx_contacts_deleted_at` | BTREE | `deleted_at` WHERE NULL | Active records only |
| `idx_contacts_search_tsv` | GIN | `search_tsv` | Full-text search |

**Foreign Key Relationships:**

```
contacts.organization_id → organizations.id (ON DELETE SET NULL)
contacts.sales_id → sales.id
contacts.created_by → sales.id
contacts.updated_by → sales.id (ON DELETE SET NULL)
```

---

### 2. `organizations` Table

**Purpose:** Stores companies, manufacturers, distributors, and other business entities.

**Schema:**

```sql
CREATE TABLE organizations (
  id BIGSERIAL PRIMARY KEY,

  -- Core Identity
  name TEXT NOT NULL,
  organization_type organization_type DEFAULT 'unknown',
    -- ENUM: 'customer', 'principal', 'distributor', 'prospect', 'partner', 'unknown'

  -- Hierarchy
  parent_organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,

  -- Classification
  priority VARCHAR CHECK (priority IN ('A', 'B', 'C', 'D')) DEFAULT 'C',
  segment_id UUID REFERENCES segments(id),

  -- Contact Information
  website TEXT,
  phone TEXT,
  email TEXT,

  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,

  -- Company Details
  description TEXT,
  logo_url TEXT,
  linkedin_url TEXT,
  annual_revenue NUMERIC,
  employee_count INTEGER,
  founded_year INTEGER,
  tax_identifier TEXT,

  -- Metadata
  context_links JSONB,
  notes TEXT,

  -- Ownership & Tracking
  sales_id BIGINT REFERENCES sales(id),
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Import Tracking
  import_session_id UUID,

  -- Full-Text Search
  search_tsv TSVECTOR
);
```

**Key Features:**

- **Organization Types**: Enum distinguishes customers, principals, distributors, prospects, partners
- **Self-Referencing Hierarchy**: `parent_organization_id` enables org trees (e.g., subsidiaries)
- **Priority System**: A/B/C/D classification for account prioritization
- **Industry Segmentation**: Optional link to `segments` table
- **Deprecated Fields**: Removed `is_principal` and `is_distributor` booleans (use `organization_type` enum)

**Indexes:**

| Index Name | Type | Columns | Purpose |
|------------|------|---------|---------|
| `organizations_pkey` | UNIQUE BTREE | `id` | Primary key |
| `idx_organizations_name` | BTREE | `name` WHERE deleted_at IS NULL | Name searches |
| `idx_organizations_type_principal` | BTREE | `organization_type` WHERE 'principal' | Principal filter |
| `idx_organizations_type_distributor` | BTREE | `organization_type` WHERE 'distributor' | Distributor filter |
| `idx_companies_organization_type` | BTREE | `organization_type` | General type filter |
| `idx_companies_priority` | BTREE | `priority` | Priority-based queries |
| `idx_companies_sales_id` | BTREE | `sales_id` | Sales rep filtering |
| `idx_companies_parent_company_id` | BTREE | `parent_organization_id` WHERE NOT NULL | Hierarchy queries |
| `idx_companies_search_tsv` | GIN | `search_tsv` | Full-text search |
| `idx_companies_deleted_at` | BTREE | `deleted_at` WHERE NULL | Active records |

**Foreign Key Relationships:**

```
organizations.parent_organization_id → organizations.id (ON DELETE SET NULL)
organizations.segment_id → segments.id
organizations.sales_id → sales.id
organizations.created_by → sales.id
organizations.updated_by → sales.id (ON DELETE SET NULL)
```

---

### 3. `contact_organizations` Table (DEPRECATED)

**Purpose:** Historical many-to-many junction table for contact-organization relationships.

**Status:** ⚠️ **DEPRECATED** - Use `contacts.organization_id` for new relationships.

**Schema:**

```sql
CREATE TABLE contact_organizations (
  id BIGSERIAL PRIMARY KEY,

  -- Junction Keys
  contact_id BIGINT REFERENCES contacts(id) NOT NULL,
  organization_id BIGINT NOT NULL,  -- Foreign key removed (legacy data)

  -- Relationship Metadata
  is_primary BOOLEAN DEFAULT false,
  is_primary_decision_maker BOOLEAN DEFAULT false,
  relationship_start_date DATE DEFAULT CURRENT_DATE,
  relationship_end_date DATE,
  notes TEXT,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ
);
```

**Key Features:**

- **Unique Constraint**: One active relationship per contact (`idx_contact_organizations_unique_contact`)
- **Decision Maker Tracking**: `is_primary_decision_maker` flag
- **Temporal Data**: `relationship_start_date` and `relationship_end_date`
- **Soft Deletes**: Historical preservation via `deleted_at`

**Indexes:**

| Index Name | Type | Columns | Purpose |
|------------|------|---------|---------|
| `idx_contact_organizations_unique_contact` | UNIQUE BTREE | `contact_id` WHERE deleted_at IS NULL | One active org per contact |
| `idx_contact_organizations_contact` | BTREE | `contact_id` WHERE deleted_at IS NULL | Contact lookups |
| `idx_contact_organizations_organization` | BTREE | `organization_id` WHERE deleted_at IS NULL | Org lookups |
| `idx_contact_organizations_primary` | BTREE | `organization_id, is_primary` WHERE deleted_at IS NULL AND is_primary | Primary contacts |
| `idx_contact_organizations_decision_makers` | BTREE | `organization_id, is_primary_decision_maker` | Decision maker queries |
| `unique_contact_organization_active` | BTREE | `contact_id, organization_id` WHERE deleted_at IS NULL | No duplicate relationships |

**Migration Notes:**

The comment on the table states:
> "DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly. Kept for historical data only."

---

### 4. `contact_preferred_principals` Table

**Purpose:** Track which manufacturer/principal brands specific contacts prefer or advocate for.

**Schema:**

```sql
CREATE TABLE contact_preferred_principals (
  id BIGSERIAL PRIMARY KEY,

  -- Relationship Keys
  contact_id BIGINT REFERENCES contacts(id) NOT NULL,
  principal_organization_id BIGINT NOT NULL,

  -- Preference Strength
  advocacy_strength SMALLINT DEFAULT 50 CHECK (advocacy_strength >= 0 AND advocacy_strength <= 100),

  -- Tracking
  last_interaction_date DATE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ
);
```

**Key Features:**

- **Advocacy Strength**: 0-100 scale measuring how strongly a contact advocates for a principal
- **Multiple Principals**: A contact can have preferences for multiple manufacturers
- **Soft Deletes**: Historical preservation
- **Interaction Tracking**: `last_interaction_date` for relationship recency

**Indexes:**

| Index Name | Type | Columns | Purpose |
|------------|------|---------|---------|
| `idx_contact_preferred_principals_contact` | BTREE | `contact_id` WHERE deleted_at IS NULL | Contact lookups |
| `idx_contact_preferred_principals_principal` | BTREE | `principal_organization_id` WHERE deleted_at IS NULL | Principal lookups |
| `idx_contact_preferred_principals_strength` | BTREE | `advocacy_strength` WHERE deleted_at IS NULL | Strength-based queries |
| `unique_contact_principal_active` | UNIQUE BTREE | `contact_id, principal_organization_id, deleted_at` | No duplicates |

**Foreign Key Relationships:**

```
contact_preferred_principals.contact_id → contacts.id
contact_preferred_principals.created_by → sales.id
```

---

### 5. `segments` Table

**Purpose:** Industry classification/segmentation for organizations.

**Schema:**

```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Key Features:**

- **UUID Primary Key**: Different from other tables using BIGSERIAL
- **Unique Names**: Enforced constraint on segment names
- **Auth Integration**: References `auth.users` instead of `sales` table

**Foreign Key Relationships:**

```
segments.created_by → auth.users.id
organizations.segment_id → segments.id
```

---

### 6. `sales` Table

**Purpose:** Sales representatives/users who manage contacts and organizations.

**Schema:**

```sql
CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,

  -- Auth Integration
  user_id UUID UNIQUE REFERENCES auth.users(id),

  -- Personal Information
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,

  -- Permissions
  is_admin BOOLEAN DEFAULT false,
  disabled BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

**Key Features:**

- **Auth Synchronization**: Linked to Supabase `auth.users` via `user_id`
- **Role Management**: `is_admin` flag for elevated permissions
- **Account Status**: `disabled` flag for deactivated users
- **Soft Deletes**: Preserve historical ownership data

---

## Relationship Mapping

### Contact → Organization Relationship Evolution

**Current Pattern (Active):**

```
contacts.organization_id → organizations.id (One-to-Many)
```

- Each contact belongs to **one** primary organization
- `ON DELETE SET NULL` preserves contact if organization deleted
- Simpler data model, easier queries

**Legacy Pattern (Deprecated):**

```
contacts ←→ contact_organizations ←→ organizations (Many-to-Many)
```

- Allowed multiple organizations per contact
- Preserved for historical data only
- New records should NOT use this pattern

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────┐
│     sales       │         │   auth.users         │
│─────────────────│         │──────────────────────│
│ id (PK)         │◄────────│ id (PK)              │
│ user_id (FK)    │         │                      │
│ first_name      │         └──────────────────────┘
│ last_name       │
│ email           │
│ is_admin        │
└─────────────────┘
        △
        │ (owner/creator relationships)
        │
        ├──────────────────────────────────────┐
        │                                      │
┌───────┴─────────┐                  ┌────────┴────────────┐
│   contacts      │                  │   organizations     │
│─────────────────│                  │─────────────────────│
│ id (PK)         │                  │ id (PK)             │
│ name            │    ┌─────────────┤ name                │
│ first_name      │    │             │ organization_type   │
│ last_name       │    │             │ parent_org_id (FK)──┼──┐
│ email (JSONB)   │    │             │ priority            │  │
│ phone (JSONB)   │    │             │ segment_id (FK)     │  │
│ title           │    │             │ website             │  │
│ organization_id ├────┘             │ annual_revenue      │  │
│ sales_id (FK)   ├──────────────────┤ sales_id (FK)       │  │
│ created_by (FK) │                  │ created_by (FK)     │  │
│ updated_by (FK) │                  │ updated_by (FK)     │  │
│ tags (BIGINT[]) │                  │ search_tsv          │  │
│ search_tsv      │                  └─────────────────────┘  │
└─────────────────┘                           △               │
        │                                     └───────────────┘
        │                                     (self-reference)
        │
        ├────────────────────┬───────────────────┬────────────────┐
        │                    │                   │                │
┌───────▼──────────┐  ┌──────▼────────┐  ┌──────▼──────────┐   │
│ contactNotes     │  │  activities   │  │     tasks       │   │
│──────────────────│  │───────────────│  │─────────────────│   │
│ id (PK)          │  │ id (PK)       │  │ id (PK)         │   │
│ contact_id (FK)  │  │ contact_id    │  │ contact_id (FK) │   │
│ text             │  │ org_id (FK)   │  │ title           │   │
│ sales_id (FK)    │  │ opp_id (FK)   │  │ sales_id (FK)   │   │
│ created_by (FK)  │  │ created_by    │  │ created_by (FK) │   │
└──────────────────┘  └───────────────┘  └─────────────────┘   │
                                                                 │
┌──────────────────────────────────┐                            │
│ contact_organizations (LEGACY)   │                            │
│──────────────────────────────────│                            │
│ id (PK)                          │                            │
│ contact_id (FK) ─────────────────┼────────────────────────────┘
│ organization_id                  │
│ is_primary                       │
│ is_primary_decision_maker        │
│ created_by (FK)                  │
│ deleted_at                       │
└──────────────────────────────────┘
        ⚠️ DEPRECATED

┌──────────────────────────────────┐
│ contact_preferred_principals     │
│──────────────────────────────────│
│ id (PK)                          │
│ contact_id (FK) ─────────────────┼────────────────────────────┐
│ principal_organization_id        │                            │
│ advocacy_strength (0-100)        │                            │
│ last_interaction_date            │                            │
│ created_by (FK)                  │                            │
└──────────────────────────────────┘                            │
                                                                 │
┌─────────────────┐                                            │
│    segments     │                                            │
│─────────────────│                                            │
│ id (PK - UUID)  │◄───────────────────────────────────────────┘
│ name (UNIQUE)   │   (organizations.segment_id)
│ created_by (FK) │
└─────────────────┘
```

### Cardinality Summary

| Relationship | Type | Cardinality | Description |
|-------------|------|-------------|-------------|
| `sales` → `contacts` | One-to-Many | 1:N | Sales rep owns multiple contacts |
| `sales` → `organizations` | One-to-Many | 1:N | Sales rep owns multiple organizations |
| `organizations` → `contacts` | One-to-Many | 1:N | Organization has multiple contacts |
| `organizations` → `organizations` | Self-Reference | 1:N | Parent-child hierarchy |
| `segments` → `organizations` | One-to-Many | 1:N (optional) | Segment classifies organizations |
| `contacts` → `contact_preferred_principals` | One-to-Many | 1:N | Contact has multiple principal preferences |
| `contacts` → `contactNotes` | One-to-Many | 1:N | Contact has multiple notes |
| `contacts` → `activities` | One-to-Many | 1:N | Contact has multiple activities |
| `contacts` → `tasks` | One-to-Many | 1:N | Contact has multiple tasks |

---

## Data Integrity Analysis

### Constraints

#### Check Constraints

| Table | Column | Constraint | Purpose |
|-------|--------|------------|---------|
| `organizations` | `priority` | `IN ('A','B','C','D')` | Valid priority levels only |
| `contact_preferred_principals` | `advocacy_strength` | `>= 0 AND <= 100` | Valid percentage range |
| `contacts` | `gender` | Enum validation | Valid gender options |

#### Unique Constraints

| Table | Columns | Scope | Purpose |
|-------|---------|-------|---------|
| `segments` | `name` | Global | No duplicate segment names |
| `sales` | `user_id` | Global | One sales record per auth user |
| `contact_organizations` | `contact_id` | WHERE deleted_at IS NULL | One active org per contact |
| `contact_preferred_principals` | `contact_id, principal_organization_id` | WHERE deleted_at IS NULL | No duplicate preferences |

#### Foreign Key Constraints

**Cascading Behavior:**

- **ON DELETE SET NULL**: Used for non-critical relationships
  - `contacts.organization_id`
  - `contacts.updated_by`
  - `organizations.parent_organization_id`
  - `organizations.updated_by`

- **ON DELETE CASCADE**: Not used in contact/org tables (data preservation)

- **ON DELETE RESTRICT** (default): Most foreign keys prevent orphaned data

### Indexes for Performance

**Full-Text Search:**

- `contacts.search_tsv` (GIN index)
- `organizations.search_tsv` (GIN index)

**Soft Delete Filtering:**

- All active tables have `WHERE deleted_at IS NULL` partial indexes
- Optimizes queries that filter out deleted records

**Relationship Queries:**

- Foreign key indexes on all FK columns
- Composite indexes for common query patterns:
  - `contact_organizations (organization_id, is_primary)`
  - `contact_organizations (organization_id, is_primary_decision_maker)`

**Specialized Indexes:**

- `idx_organizations_type_principal` - Fast principal filtering
- `idx_organizations_type_distributor` - Fast distributor filtering
- `idx_contact_preferred_principals_strength` - Advocacy-based queries

---

## Audit Trail & Security

### Row-Level Security (RLS)

**All tables have RLS enabled:**

✅ `contacts`
✅ `organizations`
✅ `contact_organizations`
✅ `contact_preferred_principals`
✅ `segments`
✅ `sales`
✅ `contactNotes`
✅ `activities`
✅ `tasks`

**RLS Implementation:** Policies enforce multi-tenant data isolation based on `sales_id` or `created_by` fields.

### Audit Fields

**Standard Pattern Across All Tables:**

| Field | Type | Purpose | Trigger |
|-------|------|---------|---------|
| `created_at` | TIMESTAMPTZ | Record creation timestamp | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last modification timestamp | Trigger on UPDATE |
| `created_by` | BIGINT | Sales rep who created record | Function: `get_current_sales_id()` |
| `updated_by` | BIGINT | Sales rep who last modified | Trigger on UPDATE |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp | Manual/Application |

**Audit Trail Benefits:**

- Full change history (who created, who modified, when)
- Soft deletes preserve historical data
- Compliance with data retention requirements
- Rollback capability through historical records

---

## Design Observations & Recommendations

### Strengths

1. **Consistent Audit Trail**: All tables follow the same pattern for tracking changes
2. **Soft Deletes**: Historical data preservation across all entities
3. **Full-Text Search**: Optimized GIN indexes for fast text searching
4. **Flexible Contact Methods**: JSONB arrays for email/phone support multiple values
5. **Type Safety**: Extensive use of ENUMs for categorical data
6. **Performance Optimization**: Comprehensive indexing strategy with partial indexes
7. **Multi-Tenant Security**: RLS enabled on all tables

### Design Patterns

1. **Migration from Many-to-Many to One-to-Many**: Smart simplification while preserving historical data
2. **JSONB for Semi-Structured Data**: `email` and `phone` as arrays, `context_links` for flexible metadata
3. **Hierarchical Data**: Self-referencing `parent_organization_id` enables org trees
4. **Preference Tracking**: `contact_preferred_principals` enables sophisticated relationship management

### Potential Improvements

1. **Missing Foreign Key**: `contact_organizations.organization_id` lacks foreign key constraint (noted as legacy)

2. **Inconsistent UUID vs BIGSERIAL**:
   - `segments` uses UUID primary key
   - All other tables use BIGSERIAL
   - Recommendation: Standardize on one approach

3. **Auth User Reference Inconsistency**:
   - `segments.created_by` references `auth.users(id)` (UUID)
   - Other tables reference `sales.id` (BIGINT)
   - Recommendation: Use `sales` table consistently

4. **Email Validation**: No constraint on email format in `contacts` or `organizations`
   - Recommendation: Add CHECK constraint for basic email validation

5. **Phone Number Standardization**: JSONB allows any format
   - Recommendation: Implement application-level validation or add JSONB schema validation

6. **Organization Type Index**: Could benefit from covering index
   ```sql
   CREATE INDEX idx_organizations_type_name
   ON organizations(organization_type, name)
   WHERE deleted_at IS NULL;
   ```

7. **Contact Search Optimization**: Add composite index for common filters
   ```sql
   CREATE INDEX idx_contacts_org_sales
   ON contacts(organization_id, sales_id)
   WHERE deleted_at IS NULL;
   ```

### Data Model Maturity

**Current State:** Production-ready with sophisticated features

**Migration Status:** In transition from many-to-many to one-to-many contact-organization relationships

**Schema Evolution:** Well-documented with table comments explaining deprecations and migrations

---

## Schema Migration History

### Completed Migrations

1. **Organization Type Refactoring** (2025-10-18)
   - Removed: `is_principal`, `is_distributor` boolean fields
   - Added: `organization_type` ENUM
   - Impact: Cleaner data model, better extensibility

2. **Contact-Organization Relationship Simplification**
   - Deprecated: `contact_organizations` many-to-many table
   - Added: `contacts.organization_id` foreign key
   - Impact: Simpler queries, better performance
   - Status: Historical data preserved

3. **Product Inventory Removal** (2025-10-17)
   - Removed: `minimum_order_quantity` column
   - Removed: `out_of_stock` status
   - Dropped: `product_inventory` table
   - Impact: Simplified product model (not directly related to contacts/orgs)

### Current Schema Version

Based on migration files, the schema is current as of **2025-10-24** with comprehensive feature set for CRM operations.

---

## Business Rules Encoded in Schema

### Contact Management

1. **One Primary Organization**: `idx_contact_organizations_unique_contact` ensures one active org per contact
2. **Multiple Principal Preferences**: Contact can prefer multiple manufacturers
3. **Required Name**: `contacts.name` is NOT NULL (computed from first_name + last_name)
4. **US-Default Geography**: `country` defaults to 'USA'
5. **Tag System**: Array-based tagging via `tags BIGINT[]`

### Organization Management

1. **Priority Levels**: Only A/B/C/D allowed via CHECK constraint
2. **Type-Based Filtering**: Specialized indexes for principals and distributors
3. **Hierarchical Structure**: Self-referencing allows unlimited depth
4. **Optional Segmentation**: `segment_id` is nullable (UI defaults to "Unknown")

### Relationship Management

1. **Advocacy Measurement**: 0-100 scale for principal preferences
2. **Decision Maker Tracking**: Boolean flag in deprecated `contact_organizations`
3. **Temporal Relationships**: Start/end dates in deprecated junction table
4. **Interaction Recency**: `last_interaction_date` tracks relationship freshness

---

## Query Patterns & Performance

### Common Queries Optimized by Indexes

1. **Find contacts by organization**:
   ```sql
   SELECT * FROM contacts
   WHERE organization_id = ? AND deleted_at IS NULL;
   ```
   Index: `idx_contacts_organization_id`

2. **Find decision makers for organization** (legacy):
   ```sql
   SELECT c.* FROM contacts c
   JOIN contact_organizations co ON c.id = co.contact_id
   WHERE co.organization_id = ?
     AND co.is_primary_decision_maker = true
     AND co.deleted_at IS NULL;
   ```
   Index: `idx_contact_organizations_decision_makers`

3. **Find all principals** (manufacturers):
   ```sql
   SELECT * FROM organizations
   WHERE organization_type = 'principal'
     AND deleted_at IS NULL;
   ```
   Index: `idx_organizations_type_principal`

4. **Full-text search across contacts**:
   ```sql
   SELECT * FROM contacts
   WHERE search_tsv @@ to_tsquery('search_term')
     AND deleted_at IS NULL;
   ```
   Index: `idx_contacts_search_tsv` (GIN)

5. **Organizational hierarchy query**:
   ```sql
   WITH RECURSIVE org_tree AS (
     SELECT * FROM organizations WHERE id = ?
     UNION ALL
     SELECT o.* FROM organizations o
     JOIN org_tree ot ON o.parent_organization_id = ot.id
   )
   SELECT * FROM org_tree WHERE deleted_at IS NULL;
   ```
   Index: `idx_companies_parent_company_id`

---

## Conclusion

The Atomic CRM contact and organization schema demonstrates a mature, well-thought-out design that balances:

- **Simplicity**: Migration from complex many-to-many to simpler one-to-many
- **Flexibility**: JSONB fields and hierarchical structures
- **Performance**: Comprehensive indexing strategy with partial indexes
- **Data Integrity**: Strong constraints and audit trails
- **Security**: RLS enabled across all tables
- **Scalability**: Optimized for food brokerage B2B relationships

The schema is production-ready with clear documentation of deprecated patterns and ongoing migrations. The audit trail and soft delete patterns ensure compliance and data preservation while maintaining query performance through strategic indexing.

**Key Takeaway**: This is a sophisticated CRM schema specifically tailored for food brokerage businesses managing complex relationships between contacts, customer organizations, manufacturer principals, and distributors.

---

## Appendix: Complete Foreign Key Reference

### Contacts Table References

```sql
-- Incoming (other tables → contacts)
activities.contact_id → contacts.id
contactNotes.contact_id → contacts.id
contact_organizations.contact_id → contacts.id
contact_preferred_principals.contact_id → contacts.id
interaction_participants.contact_id → contacts.id
tasks.contact_id → contacts.id

-- Outgoing (contacts → other tables)
contacts.organization_id → organizations.id ON DELETE SET NULL
contacts.sales_id → sales.id
contacts.created_by → sales.id
contacts.updated_by → sales.id ON DELETE SET NULL
```

### Organizations Table References

```sql
-- Incoming (other tables → organizations)
contacts.organization_id → organizations.id

-- Outgoing (organizations → other tables)
organizations.parent_organization_id → organizations.id ON DELETE SET NULL
organizations.segment_id → segments.id
organizations.sales_id → sales.id
organizations.created_by → sales.id
organizations.updated_by → sales.id ON DELETE SET NULL
```

### Sales Table References

```sql
-- Incoming (other tables → sales)
activities.created_by → sales.id
contact_organizations.created_by → sales.id
contact_preferred_principals.created_by → sales.id
contactNotes.sales_id → sales.id
contactNotes.created_by → sales.id
contactNotes.updated_by → sales.id
contacts.sales_id → sales.id
contacts.created_by → sales.id
contacts.updated_by → sales.id
opportunities.opportunity_owner_id → sales.id
opportunities.account_manager_id → sales.id
opportunities.created_by → sales.id
opportunities.updated_by → sales.id
opportunityNotes.sales_id → sales.id
opportunityNotes.created_by → sales.id
opportunityNotes.updated_by → sales.id
opportunity_participants.created_by → sales.id
organizations.sales_id → sales.id
organizations.created_by → sales.id
organizations.updated_by → sales.id
tasks.sales_id → sales.id
tasks.created_by → sales.id

-- Outgoing (sales → other tables)
sales.user_id → auth.users.id
```

---

*End of Report*
