# Contact & Territory Modeling - CRM Patterns

## Executive Summary

This research examines industry-standard patterns for modeling contacts within distributor organizations, including department hierarchies, territory assignments, and manager relationships. Key findings: (1) Manager relationships use self-referential foreign keys (`manager_id` → `contacts.id`), (2) Territory assignment ranges from simple contact fields to complex many-to-many junction tables, and (3) Department hierarchies favor enums for structured roles vs. lookup tables for flexible organizational structures. For Crispy CRM's 594 distributor reps across district-based territories, an adjacency list model for manager hierarchies plus territory-as-field approach offers optimal balance of simplicity and query performance.

## Department/Role Hierarchy Patterns

### Pattern 1: Enum-based Roles (Simple, Structured)

**When to use:** Fixed role taxonomy with clear levels, no ad-hoc role creation needed

**Crispy CRM Implementation:**
```sql
-- Current approach (7 fixed departments)
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  department VARCHAR(50) CHECK (department IN (
    'senior_management',
    'sales_management',
    'district_management',
    'area_sales',
    'sales_specialist',
    'sales_support',
    'procurement'
  )),
  -- other fields
);
```

**Pros:**
- Zero-join queries for filtering by department
- Type-safe in application code (TypeScript enums)
- Database constraint enforcement prevents invalid values
- Simplest schema for fixed hierarchies

**Cons:**
- Schema migration required to add new departments
- Cannot represent custom/regional role names (e.g., "Key Account Manager" vs. "National Account Manager")
- No metadata storage (e.g., role description, pay grade)

**Source:** [Database Star - Hierarchical Data in SQL](https://www.databasestar.com/hierarchical-data-sql/)

---

### Pattern 2: Lookup Table Roles (Flexible, Metadata-rich)

**When to use:** Organizations with evolving role structures, need for role-specific metadata, or multi-tenant systems with per-customer role naming

**Schema:**
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'district_management'
  level INT NOT NULL,                -- Hierarchy level (1=senior, 5=area)
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  department_id UUID REFERENCES departments(id),
  -- other fields
);
```

**Pros:**
- Add/rename roles without schema changes
- Store role metadata (level, description, active status)
- Support multi-tenant custom role names
- Easier internationalization (department names in multiple languages)

**Cons:**
- Requires join for every department filter/display
- More complex queries (`JOIN departments d ON c.department_id = d.id`)
- Application must handle missing department_id (orphaned records)

**Source:** [Microsoft Dynamics 365 Hierarchy Documentation](https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/admin/set-up-sales-territories-organize-business-markets-geographical-area)

---

## Manager Relationship Patterns

### Self-Referential Foreign Key (Adjacency List)

**Industry Standard:** Microsoft Dynamics uses `ParentsystemuserID`, Salesforce uses `ManagerId`

**Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  manager_id UUID REFERENCES contacts(id),
  -- Indexes
  INDEX idx_manager (manager_id)
);
```

**Queries:**

**Find direct reports:**
```sql
SELECT c.id, c.first_name, c.last_name
FROM contacts c
WHERE c.manager_id = 'uuid-of-district-manager';
```

**Find entire reporting chain (recursive CTE):**
```sql
WITH RECURSIVE reporting_chain AS (
  -- Anchor: Start with specific employee
  SELECT id, first_name, last_name, manager_id, 0 AS depth
  FROM contacts
  WHERE id = 'uuid-of-area-manager'

  UNION ALL

  -- Recursive: Walk up the chain
  SELECT c.id, c.first_name, c.last_name, c.manager_id, rc.depth + 1
  FROM contacts c
  INNER JOIN reporting_chain rc ON c.id = rc.manager_id
)
SELECT * FROM reporting_chain ORDER BY depth DESC;
```

**Find all descendants (org chart):**
```sql
WITH RECURSIVE org_chart AS (
  -- Anchor: Start with manager
  SELECT id, first_name, last_name, manager_id, 1 AS depth
  FROM contacts
  WHERE id = 'uuid-of-regional-manager'

  UNION ALL

  -- Recursive: Walk down the hierarchy
  SELECT c.id, c.first_name, c.last_name, c.manager_id, oc.depth + 1
  FROM contacts c
  INNER JOIN org_chart oc ON c.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY depth, last_name;
```

**Pros:**
- Simple schema (one field)
- Easy to insert/update manager relationships
- Industry-standard pattern (Salesforce, Dynamics 365, HubSpot)
- Natural model for direct reporting structures

**Cons:**
- Requires recursive queries for multi-level traversal
- Performance degrades with deep hierarchies (>10 levels)
- No inherent cycle detection (can create A→B→A loops)

**Source:** [Microsoft Power Platform - Hierarchy Security](https://learn.microsoft.com/en-us/power-platform/admin/hierarchy-security)

---

### Alternative: Closure Table (Bridge Pattern)

**When to use:** Frequent "all descendants" queries, deep hierarchies (>5 levels), need for pre-computed paths

**Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100)
);

CREATE TABLE contact_hierarchy (
  ancestor_id UUID REFERENCES contacts(id),
  descendant_id UUID REFERENCES contacts(id),
  depth INT NOT NULL, -- 0 for self, 1 for direct report, 2 for skip-level
  PRIMARY KEY (ancestor_id, descendant_id),
  INDEX idx_ancestor (ancestor_id, depth),
  INDEX idx_descendant (descendant_id)
);
```

**Example Data:**
```
-- If hierarchy is: CEO → VP → Manager → Rep
ancestor_id | descendant_id | depth
------------|---------------|------
CEO         | CEO           | 0     (self-reference)
CEO         | VP            | 1
CEO         | Manager       | 2
CEO         | Rep           | 3
VP          | VP            | 0
VP          | Manager       | 1
VP          | Rep           | 2
Manager     | Manager       | 0
Manager     | Rep           | 1
Rep         | Rep           | 0
```

**Query all descendants (no recursion):**
```sql
SELECT c.*
FROM contact_hierarchy ch
JOIN contacts c ON ch.descendant_id = c.id
WHERE ch.ancestor_id = 'uuid-of-manager'
  AND ch.depth > 0
ORDER BY ch.depth, c.last_name;
```

**Pros:**
- Blazing-fast descendant queries (single join, no recursion)
- Pre-computed paths eliminate runtime hierarchy traversal
- Supports "depth limit" queries (e.g., show only direct + skip-level reports)

**Cons:**
- Complex insert/update logic (must maintain all ancestor-descendant pairs)
- Storage overhead (O(n²) for deep trees)
- No referential integrity for manager relationship (must be maintained via triggers/app logic)

**Trade-off:** Optimizes reads at the expense of write complexity. Only justified for read-heavy workloads with deep hierarchies.

**Source:** [Database Star - Hierarchical Data in SQL](https://www.databasestar.com/hierarchical-data-sql/)

---

## Territory Assignment Patterns

### Pattern 1: Territory Field on Contact (Simple)

**When to use:** Each contact belongs to exactly one territory, territories are stable (rarely change)

**Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  territory VARCHAR(100), -- "D1", "D73", "Western Suburbs"
  -- Option A: Enum constraint
  -- territory VARCHAR(50) CHECK (territory IN ('D1', 'D20', 'D73')),
  INDEX idx_territory (territory)
);
```

**Queries:**

**Filter by territory:**
```sql
SELECT * FROM contacts WHERE territory = 'D1';
```

**Group by territory:**
```sql
SELECT territory, COUNT(*) AS rep_count
FROM contacts
WHERE department = 'area_sales'
GROUP BY territory;
```

**Pros:**
- Zero-join queries for territory filtering
- Trivial to update (single UPDATE statement)
- Matches current Crispy CRM district structure (D1, D73, etc.)

**Cons:**
- Cannot represent multi-territory contacts (e.g., regional reps covering 2 districts)
- No territory metadata (manager, region, description)
- Territory rename requires UPDATE across all contacts

**Crispy CRM Fit:** Excellent for 594 distributor reps where each belongs to one district.

**Source:** [Salesforce Territory Management Guide](https://calendly.com/blog/territory-management-salesforce)

---

### Pattern 2: Territory Lookup Table (Normalized)

**When to use:** Need territory metadata, hierarchical territories (district → region → national), or territory attributes

**Schema:**
```sql
CREATE TABLE territories (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,      -- "D1", "D73"
  name VARCHAR(100) NOT NULL,            -- "Western Suburbs", "Downtown Chicago"
  parent_territory_id UUID REFERENCES territories(id), -- Hierarchy
  manager_id UUID REFERENCES contacts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  territory_id UUID REFERENCES territories(id),
  INDEX idx_territory (territory_id)
);
```

**Territory Hierarchy Example:**
```sql
-- National → Regional → District
INSERT INTO territories (id, code, name, parent_territory_id) VALUES
('national-1', 'USA', 'United States', NULL),
('regional-1', 'MW', 'Midwest Region', 'national-1'),
('district-1', 'D1', 'Western Suburbs', 'regional-1'),
('district-73', 'D73', 'Downtown Chicago', 'regional-1');
```

**Queries:**

**Get territory details with contact:**
```sql
SELECT c.first_name, c.last_name, t.code, t.name
FROM contacts c
JOIN territories t ON c.territory_id = t.id
WHERE t.code = 'D1';
```

**Hierarchical territory query (all reps in Midwest):**
```sql
WITH RECURSIVE territory_tree AS (
  SELECT id FROM territories WHERE code = 'MW'
  UNION ALL
  SELECT t.id FROM territories t
  INNER JOIN territory_tree tt ON t.parent_territory_id = tt.id
)
SELECT c.* FROM contacts c
WHERE c.territory_id IN (SELECT id FROM territory_tree);
```

**Pros:**
- Supports territory hierarchies (district → region → national)
- Store territory attributes (manager, active status)
- Easy to rename territories (one UPDATE in territories table)
- Enable territory-based reporting rollups

**Cons:**
- Requires join for every territory display
- More complex schema
- Overkill if territories are just simple labels

**Source:** [Salesforce Territory Management Data Model](https://developer.salesforce.com/docs/platform/data-models/guide/territory-management.html)

---

### Pattern 3: Junction Table (Many-to-Many)

**When to use:** Contacts can cover multiple territories (e.g., regional reps covering 3 districts)

**Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100)
);

CREATE TABLE territories (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE contact_territories (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, territory_id),
  INDEX idx_territory (territory_id)
);
```

**Queries:**

**Find all territories for a contact:**
```sql
SELECT t.code, t.name, ct.is_primary
FROM contact_territories ct
JOIN territories t ON ct.territory_id = t.id
WHERE ct.contact_id = 'uuid-of-contact'
ORDER BY ct.is_primary DESC, t.code;
```

**Find all contacts in a territory:**
```sql
SELECT c.first_name, c.last_name, ct.is_primary
FROM contact_territories ct
JOIN contacts c ON ct.contact_id = c.id
WHERE ct.territory_id = (SELECT id FROM territories WHERE code = 'D1');
```

**Pros:**
- Supports multi-territory assignments
- Track assignment metadata (is_primary, assigned_at)
- Flexible for complex coverage models

**Cons:**
- Most complex query pattern (always requires joins)
- Application must handle "primary territory" logic
- Overkill for simple 1:1 territory assignments

**Use Case:** Regional sales directors covering multiple districts, national account managers with no geographic boundaries.

**Source:** [Veeva CRM Territory Assignment](https://crmhelp.veeva.com/doc/Content/CRM_topics/Integration/Network_Integration/Territory_Assignments.htm)

---

## Multi-Value Contact Fields

### Phone Numbers

**Pattern A: JSON Array (PostgreSQL)**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  phone_numbers JSONB DEFAULT '[]'::jsonb
);

-- Example data
-- phone_numbers: [
--   {"type": "mobile", "number": "+1-312-555-0100", "is_primary": true},
--   {"type": "office", "number": "+1-312-555-0101", "is_primary": false}
-- ]

-- Query contacts with specific phone
SELECT * FROM contacts
WHERE phone_numbers @> '[{"number": "+1-312-555-0100"}]';
```

**Pattern B: Related Table (Normalized)**
```sql
CREATE TABLE contact_phones (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_type VARCHAR(20) CHECK (phone_type IN ('mobile', 'office', 'home')),
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  INDEX idx_contact (contact_id),
  INDEX idx_phone (phone_number)
);
```

**Trade-off:**
- **JSON:** Simpler queries when displaying contact, harder to search across all phones
- **Related Table:** Better for "find contact by phone number" queries, more complex joins

---

### Email Addresses

**Same patterns apply:**

```sql
-- JSON approach
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  email_addresses JSONB DEFAULT '[]'::jsonb
);

-- Normalized approach
CREATE TABLE contact_emails (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email_type VARCHAR(20) CHECK (email_type IN ('work', 'personal')),
  email_address VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE (contact_id, email_address)
);
```

**Industry Standard:** Most CRMs use normalized tables for multi-value fields to support:
- Unique constraints (prevent duplicate emails per contact)
- Efficient "find by email" queries
- Email validation/verification status tracking

**Source:** [Microsoft Dynamics 365 Territory Setup](https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/admin/set-up-sales-territories-organize-business-markets-geographical-area)

---

## Contact Lifecycle Management

### Status Tracking Pattern

**Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active',
    'inactive',
    'left_company',
    'do_not_contact'
  )),
  inactivated_at TIMESTAMPTZ,
  inactivation_reason TEXT,
  deleted_at TIMESTAMPTZ, -- Soft delete (Crispy CRM standard)

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Common Status Values:**
| Status | Meaning | Use Case |
|--------|---------|----------|
| `active` | Current employee | Default for working contacts |
| `inactive` | Temporarily unavailable | Leave of absence, furlough |
| `left_company` | No longer employed | Track turnover, prevent outreach |
| `do_not_contact` | Opt-out | GDPR/compliance |

**Query active contacts only:**
```sql
SELECT * FROM contacts
WHERE status = 'active'
  AND deleted_at IS NULL;
```

**Lifecycle Events:**
- **Created:** `created_at` timestamp
- **Inactivated:** Set `status = 'inactive'`, populate `inactivated_at` and `inactivation_reason`
- **Soft Deleted:** Set `deleted_at` (Crispy CRM standard for all entities)

**Source:** [Salesforce Role Hierarchy Security](https://trailhead.salesforce.com/content/learn/modules/data_security/data_security_roles)

---

## Trade-off Analysis

### Department/Role Hierarchy

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Enum** | Fast queries, type-safe, simple | Schema changes for new roles | Fixed taxonomies (Crispy CRM's 7 departments) |
| **Lookup Table** | Flexible, metadata-rich | Requires joins | Evolving organizations, multi-tenant |

### Manager Relationship

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Adjacency List** | Simple, industry standard | Recursive queries | Most use cases (Crispy CRM) |
| **Closure Table** | Fast descendant queries | Complex writes, storage overhead | Deep hierarchies, read-heavy |

### Territory Assignment

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Field on Contact** | Zero joins, simple | No metadata, 1:1 only | Simple territories (Crispy CRM districts) |
| **Lookup Table** | Hierarchies, metadata | Requires joins | Territory hierarchies, rollups |
| **Junction Table** | Many-to-many | Most complex | Multi-territory coverage |

---

## Recommendations for Crispy CRM

### Current State Analysis

**594 Distributor Reps with:**
- 7 fixed departments (enum approach ✓)
- District assignments (D1, D73, D20, etc.)
- Territory labels ("Western Suburbs", "Downtown Chicago")
- Manager hierarchy (DSM → Area Managers)

### Recommended Schema

```sql
-- Contacts table (existing + enhancements)
CREATE TABLE contacts (
  id UUID PRIMARY KEY,

  -- Identity
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),

  -- Department (keep enum - works well for 7 fixed levels)
  department VARCHAR(50) CHECK (department IN (
    'senior_management',
    'sales_management',
    'district_management',
    'area_sales',
    'sales_specialist',
    'sales_support',
    'procurement'
  )),

  -- Manager relationship (adjacency list)
  manager_id UUID REFERENCES contacts(id),

  -- Territory (simple field - 1:1 relationship)
  district_code VARCHAR(20),        -- "D1", "D73", "D20"
  territory_name VARCHAR(100),      -- "Western Suburbs", "Downtown Chicago"

  -- Lifecycle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'left_company', 'do_not_contact'
  )),

  -- Organization relationship
  organization_id UUID REFERENCES organizations(id) NOT NULL,

  -- Audit (Crispy CRM standard)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Indexes
  INDEX idx_manager (manager_id),
  INDEX idx_district (district_code),
  INDEX idx_org (organization_id),
  INDEX idx_status (status) WHERE deleted_at IS NULL
);
```

### Rationale

1. **Department Enum:** Keep current approach - 7 fixed levels won't change frequently
2. **Manager Adjacency List:** Industry standard, simple queries for "who reports to DSM"
3. **Territory as Fields:** No need for lookup table - districts are stable, no hierarchy needed
4. **Status Field:** Add lifecycle tracking for left_company, do_not_contact
5. **No Junction Table:** 594 reps each belong to one district (confirmed by current data)

### Migration Path

If territories evolve to need hierarchies (e.g., District → Region → National rollups):

```sql
-- Future: Create territories lookup table
CREATE TABLE territories (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_territory_id UUID REFERENCES territories(id),
  manager_id UUID REFERENCES contacts(id)
);

-- Migrate data
INSERT INTO territories (code, name)
SELECT DISTINCT district_code, territory_name
FROM contacts
WHERE district_code IS NOT NULL;

-- Add FK to contacts
ALTER TABLE contacts ADD COLUMN territory_id UUID REFERENCES territories(id);

-- Backfill
UPDATE contacts c
SET territory_id = (SELECT id FROM territories t WHERE t.code = c.district_code);

-- Drop old fields (after validation)
ALTER TABLE contacts DROP COLUMN district_code, DROP COLUMN territory_name;
```

### Query Examples for Crispy CRM

**Find all Area Managers reporting to a DSM:**
```sql
SELECT id, first_name, last_name, district_code
FROM contacts
WHERE manager_id = 'dsm-uuid'
  AND department = 'area_sales'
  AND deleted_at IS NULL;
```

**Get org chart for a district:**
```sql
WITH RECURSIVE district_hierarchy AS (
  -- Anchor: DSM for district D1
  SELECT id, first_name, last_name, manager_id, department, 0 AS depth
  FROM contacts
  WHERE district_code = 'D1' AND department = 'district_management'

  UNION ALL

  -- Recursive: All reports
  SELECT c.id, c.first_name, c.last_name, c.manager_id, c.department, dh.depth + 1
  FROM contacts c
  INNER JOIN district_hierarchy dh ON c.manager_id = dh.id
  WHERE c.deleted_at IS NULL
)
SELECT * FROM district_hierarchy ORDER BY depth, last_name;
```

**Territory rep counts by department:**
```sql
SELECT district_code, department, COUNT(*) AS rep_count
FROM contacts
WHERE status = 'active' AND deleted_at IS NULL
GROUP BY district_code, department
ORDER BY district_code, department;
```

---

## Sources Consulted

- [Salesforce Territory Management Data Model](https://developer.salesforce.com/docs/platform/data-models/guide/territory-management.html) — Official Salesforce schema with Territory2, UserTerritory2Association, and hierarchy objects
- [Microsoft Power Platform - Hierarchy Security](https://learn.microsoft.com/en-us/power-platform/admin/hierarchy-security) — Manager relationship via ParentsystemuserID self-referential FK
- [Database Star - Hierarchical Data in SQL](https://www.databasestar.com/hierarchical-data-sql/) — Comprehensive comparison of adjacency list, nested sets, closure table, and path enumeration patterns
- [Microsoft Dynamics 365 Territory Setup](https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/admin/set-up-sales-territories-organize-business-markets-geographical-area) — Territory fields, member assignment, and hierarchical relationships
- [CIO - Implementing Territories in CRM Systems](https://www.cio.com/article/282122/customer-relationship-management-implementing-territories-in-crm-systems.html) — Territory assignment methods and geographic parameter-based assignments
- [Calendly - Territory Management in Salesforce Guide](https://calendly.com/blog/territory-management-salesforce) — Territory model overview and assignment strategies
- [Veeva CRM - Territory Assignments](https://crmhelp.veeva.com/doc/Content/CRM_topics/Integration/Network_Integration/Territory_Assignments.htm) — Multi-territory assignment patterns
- [Technology Advice - CRM Roles and Responsibilities](https://technologyadvice.com/blog/sales/crm-roles-and-responsibilities/) — Sales team hierarchy and CRM role structures
- [Salesforce Trailhead - Role Hierarchy Security](https://trailhead.salesforce.com/content/learn/modules/data_security/data_security_roles) — Role-based access control and hierarchical data access patterns
