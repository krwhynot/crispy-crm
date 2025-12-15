# Product-Distributor Relationships - Database Patterns

## Executive Summary

This research examines database patterns for modeling many-to-many relationships between products and distributors, with specific focus on vendor item numbers (DOT numbers) and authorization agreements. The core pattern uses junction tables with relationship-specific attributes, enabling storage of distributor-assigned product codes while maintaining referential integrity and query performance. Status workflows and temporal validity patterns support authorization lifecycle management from pending through active to inactive states.

## Many-to-Many Patterns

### Pattern 1: Simple Junction Table

**Source:** [Many-to-Many Database Relationships: Complete Implementation Guide | Beekeeper Studio](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide)

The fundamental structure for many-to-many relationships uses a junction table with composite primary keys:

```sql
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

**Key principle:** "A composite primary key prevents duplicate relationships" between entities. This pattern works when the relationship itself has no additional attributes beyond the link.

### Pattern 2: Junction Table with Attributes

**Source:** [Many-to-Many Database Relationships: Complete Implementation Guide | Beekeeper Studio](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide)

When the relationship needs to store additional data (like vendor item numbers, dates, or status), expand the junction table to include relationship-specific attributes:

```sql
CREATE TABLE enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(5),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

Another example showing work assignment attributes:

```sql
CREATE TABLE project_assignments (
    project_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    role VARCHAR(50),
    hourly_rate DECIMAL(8,2),
    PRIMARY KEY (project_id, member_id)
);
```

**Critical insight:** When a junction table carries significant additional data, it transforms into an "associative entity" - a first-class entity with its own lifecycle and business rules.

### Pattern 3: Surrogate Key Option

**Source:** [What Is a Junction Table and Why Is It Important in Databases? | Enkle Designs](https://enkledesigns.com/what-is-a-junction-table/)

While composite keys are preferred, some scenarios benefit from surrogate keys:

```sql
CREATE TABLE users_roles (
    id SERIAL PRIMARY KEY,  -- Optional surrogate key
    user_id INTEGER,
    role_id INTEGER,
    assigned_date TIMESTAMP,
    status VARCHAR(20),
    CONSTRAINT fk_users FOREIGN KEY(user_id) REFERENCES users(id),
    CONSTRAINT fk_roles FOREIGN KEY(role_id) REFERENCES roles(id),
    UNIQUE(user_id, role_id)  -- Enforce uniqueness separately
);
```

**Trade-off:** Surrogate keys simplify foreign key references to the junction table itself, but add complexity by requiring separate uniqueness constraints.

## Vendor Item Number Patterns

### The Multi-Vendor SKU Challenge

**Source:** [A Beginner's Guide to SKU Mapping for Ecommerce | Flxpoint](https://flxpoint.com/blog/beginners-guide-sku-mapping-ecommerce)

In multi-vendor scenarios, different distributors assign their own internal product codes to identical items. As the source explains: "SKU mapping bridges this gap by creating a standardized identifier system that translates between vendor-specific codes and your unified catalog."

The recommended architecture involves:
- Creating a primary SKU for your internal catalog
- Mapping each vendor's product ID to that master SKU
- Maintaining a lookup table connecting all relationships

### Master SKU + Vendor Mapping Schema

**Source:** [Database Design for Product Management | Medium](https://medium.com/@pesarakex/database-design-for-product-management-9280fd7c66fe)

For Crispy CRM's DOT number requirement (USF#, Sysco#, GFS#, etc.), the pattern would be:

```sql
-- Internal product catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    principal_id UUID NOT NULL REFERENCES principals(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distributor master table
CREATE TABLE distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'national' or 'regional'
    parent_id UUID REFERENCES distributors(id), -- for regional hierarchy
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table with vendor item numbers
CREATE TABLE product_distributors (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    vendor_item_number TEXT, -- The DOT number (USF#, Sysco#, GFS#)
    status TEXT NOT NULL DEFAULT 'pending',
    authorized_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, distributor_id)
);

-- Indexes for performance
CREATE INDEX idx_product_distributors_product ON product_distributors(product_id);
CREATE INDEX idx_product_distributors_distributor ON product_distributors(distributor_id);
CREATE INDEX idx_product_distributors_status ON product_distributors(status);
CREATE INDEX idx_product_distributors_vendor_item ON product_distributors(vendor_item_number);
```

### Data Normalization and Synchronization

**Source:** [A Beginner's Guide to SKU Mapping for Ecommerce | Flxpoint](https://flxpoint.com/blog/beginners-guide-sku-mapping-ecommerce)

"Normalization is about making sure that all data follows the same format and rules." For DOT numbers:
- Establish standard format (numeric only vs. alphanumeric)
- Validate uniqueness per distributor (but same product can have different codes across distributors)
- Real-time sync ensures when one distributor updates codes, changes reflect immediately

## Authorization/Agreement Modeling

### Authorization Entity Design

**Source:** [Distribution Agreement Template | Contractbook](https://contractbook.com/templates/distribution-agreement)

Based on distributor agreement patterns, authorizations typically track:
- **Contract term:** Start and end dates, renewal conditions
- **Territorial scope:** Regions, countries or market segments the distributor is authorized to serve
- **Product scope:** Specific products or product categories covered
- **Pricing and payment terms:** Wholesale pricing structure, volume discounts
- **Performance obligations:** Sales targets, inventory levels

### Schema for Product Authorizations

For Crispy CRM, product authorization can be modeled as an enhancement to the junction table or as a separate entity:

**Option A: Junction Table IS the Authorization**
```sql
-- The product_distributors table itself represents the authorization
-- Status tracks: pending → active → inactive
CREATE TABLE product_distributors (
    product_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    vendor_item_number TEXT,

    -- Authorization fields
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    authorized_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    authorization_notes TEXT,

    -- Temporal validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ DEFAULT 'infinity',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, distributor_id)
);
```

**Option B: Separate Principal-Distributor Authorizations**
```sql
-- High-level agreement between principal and distributor
CREATE TABLE authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES principals(id),
    distributor_id UUID NOT NULL REFERENCES distributors(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),

    -- Agreement metadata
    authorized_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    contract_start_date DATE,
    contract_end_date DATE,

    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ DEFAULT 'infinity',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(principal_id, distributor_id)
);

-- Product-specific mappings inherit from authorization
CREATE TABLE product_distributors (
    product_id UUID NOT NULL REFERENCES products(id),
    distributor_id UUID NOT NULL REFERENCES distributors(id),
    authorization_id UUID REFERENCES authorizations(id),
    vendor_item_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, distributor_id)
);
```

**Trade-off:** Option A is simpler for MVP; Option B supports principal-level agreements that cover multiple products.

## Status Workflow Patterns

### State Machine Implementation

**Source:** [Use your database to power state machines | Lawrence Jones](https://blog.lawrencejones.dev/state-machines/)

For tracking authorization lifecycle (pending → active → inactive), use a transition table pattern:

```sql
CREATE TABLE authorization_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID NOT NULL,
    to_state TEXT NOT NULL CHECK (to_state IN ('pending', 'active', 'inactive')),
    most_recent BOOLEAN NOT NULL,
    sort_key INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    -- Ensure only one current state
    UNIQUE(authorization_id, most_recent) WHERE most_recent = true,
    -- Prevent duplicate ordinal values
    UNIQUE(authorization_id, sort_key)
);

CREATE INDEX idx_auth_transitions_auth ON authorization_transitions(authorization_id);
CREATE INDEX idx_auth_transitions_recent ON authorization_transitions(authorization_id, most_recent) WHERE most_recent = true;
```

**Key advantages from source:**
- Built-in audit trail via complete transition history
- Query efficiency through indexed state lookups
- Concurrency safety: "competing transactions" handle conflicts gracefully without explicit locking

### Simplified Enum Approach

For simpler use cases without full audit history:

```sql
-- Define allowed states as PostgreSQL enum
CREATE TYPE authorization_status AS ENUM ('pending', 'active', 'inactive');

CREATE TABLE authorizations (
    id UUID PRIMARY KEY,
    principal_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    status authorization_status NOT NULL DEFAULT 'pending',
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update status_changed_at
CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER authorization_status_change
    BEFORE UPDATE ON authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_status_timestamp();
```

## Effective Dating and Versioning Patterns

### Temporal Validity with valid_from/valid_to

**Source:** [How to Manage Temporal Visibility in PostgreSQL | GeeksforGeeks](https://www.geeksforgeeks.org/postgresql/how-to-manage-temporal-visibility-in-postgresql/)

For tracking when authorizations are valid in the real world (vs. when they were entered):

```sql
CREATE TABLE authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    status TEXT NOT NULL,

    -- Temporal validity columns
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ DEFAULT 'infinity',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for temporal queries
CREATE INDEX idx_auth_valid_period ON authorizations(valid_from, valid_to);
```

**Querying current authorizations:**
```sql
SELECT * FROM authorizations
WHERE valid_from <= NOW()
  AND valid_to > NOW();
```

**Querying authorizations valid during a specific period:**
```sql
SELECT * FROM authorizations
WHERE valid_from <= '2024-09-01'
  AND (valid_to > '2024-09-30' OR valid_to = 'infinity');
```

**Key insights from source:**
- "valid_from" (start) time is inclusive boundary
- "valid_until" (end) time is exclusive boundary
- When data is still valid, set valid_to to 'infinity'
- Adding indexes on valid_from/valid_to significantly improves query performance

### Updating Historical Records

When an authorization changes, preserve history by closing the old record and inserting a new one:

```sql
-- Close current record
UPDATE authorizations
SET valid_to = NOW()
WHERE id = 'auth-123' AND valid_to = 'infinity';

-- Insert new version
INSERT INTO authorizations (principal_id, distributor_id, status, valid_from)
VALUES ('principal-456', 'dist-789', 'active', NOW());
```

### PostgreSQL Range Types Alternative

**Source:** [How to Manage Temporal Visibility in PostgreSQL | GeeksforGeeks](https://www.geeksforgeeks.org/postgresql/how-to-manage-temporal-visibility-in-postgresql/)

For more sophisticated temporal queries, use PostgreSQL's native range types:

```sql
CREATE TABLE authorizations (
    id UUID PRIMARY KEY,
    principal_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    status TEXT NOT NULL,
    valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(NOW(), 'infinity'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GiST index for range queries
CREATE INDEX idx_auth_valid_period_gist ON authorizations USING GIST (valid_period);

-- Query authorizations valid at a point in time
SELECT * FROM authorizations
WHERE valid_period @> '2024-06-15'::timestamptz;

-- Query authorizations overlapping a period
SELECT * FROM authorizations
WHERE valid_period && tstzrange('2024-06-01', '2024-06-30');
```

**Benefits:** Range types support specialized operators (`@>` for contains, `&&` for overlaps) and GiST indexes for optimized temporal queries.

## Inheritance Patterns (National → Regional)

### Hierarchical Distributor Structure

**Source:** [From Trees to Tables: Storing Hierarchical Data in Relational Databases | Medium](https://medium.com/@rishabhdevmanu/from-trees-to-tables-storing-hierarchical-data-in-relational-databases-a5e5e6e1bd64) and [Parent-child hierarchies | IBM](https://www.ibm.com/docs/en/ida/9.1.2?topic=hierarchies-parent-child)

For modeling national distributors with regional subdivisions:

```sql
CREATE TABLE distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('national', 'regional')),
    parent_id UUID REFERENCES distributors(id), -- NULL for national, points to national for regional
    territory_code TEXT, -- e.g., 'CA', 'TX', 'Northeast'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure regional distributors have parents
ALTER TABLE distributors
ADD CONSTRAINT regional_must_have_parent
CHECK ((type = 'national' AND parent_id IS NULL) OR (type = 'regional' AND parent_id IS NOT NULL));

-- Self-join to find all regional divisions
SELECT
    national.name AS national_name,
    regional.name AS regional_name,
    regional.territory_code
FROM distributors national
LEFT JOIN distributors regional ON regional.parent_id = national.id
WHERE national.type = 'national';
```

### Authorization Inheritance Pattern

**Approach 1: Materialized Inheritance (Recommended for Performance)**

Store authorizations at both levels, but mark inherited ones:

```sql
CREATE TABLE authorizations (
    id UUID PRIMARY KEY,
    principal_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    status TEXT NOT NULL,

    -- Inheritance tracking
    inherited_from UUID REFERENCES authorizations(id), -- NULL if direct, points to parent auth if inherited

    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ DEFAULT 'infinity',
    PRIMARY KEY (principal_id, distributor_id)
);

-- Trigger to auto-create regional authorizations when national auth is created
CREATE OR REPLACE FUNCTION inherit_national_authorization()
RETURNS TRIGGER AS $$
BEGIN
    -- When a national authorization is created, create inherited records for all regions
    INSERT INTO authorizations (principal_id, distributor_id, status, inherited_from, valid_from, valid_to)
    SELECT
        NEW.principal_id,
        regional.id,
        NEW.status,
        NEW.id,
        NEW.valid_from,
        NEW.valid_to
    FROM distributors regional
    WHERE regional.parent_id = NEW.distributor_id
      AND regional.type = 'regional';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inherit_to_regions
    AFTER INSERT ON authorizations
    FOR EACH ROW
    WHEN (NEW.inherited_from IS NULL) -- Only for direct (non-inherited) authorizations
    EXECUTE FUNCTION inherit_national_authorization();
```

**Approach 2: Computed Inheritance (Simpler, Slower)**

Only store authorizations at the level they were granted, compute inheritance via views:

```sql
-- Store authorizations only where explicitly granted
CREATE TABLE authorizations (
    id UUID PRIMARY KEY,
    principal_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    status TEXT NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ DEFAULT 'infinity'
);

-- View that computes effective authorizations (including inherited)
CREATE VIEW effective_authorizations AS
-- Direct authorizations
SELECT
    a.id,
    a.principal_id,
    a.distributor_id,
    d.name AS distributor_name,
    a.status,
    false AS is_inherited,
    a.valid_from,
    a.valid_to
FROM authorizations a
JOIN distributors d ON a.distributor_id = d.id

UNION

-- Inherited authorizations (regional gets from national parent)
SELECT
    a.id || '-inherited-' || regional.id AS id,
    a.principal_id,
    regional.id AS distributor_id,
    regional.name AS distributor_name,
    a.status,
    true AS is_inherited,
    a.valid_from,
    a.valid_to
FROM authorizations a
JOIN distributors national ON a.distributor_id = national.id
JOIN distributors regional ON regional.parent_id = national.id
WHERE national.type = 'national'
  AND regional.type = 'regional';
```

## Performance Optimization

### Indexing Strategy

**Source:** [Many-to-Many Database Relationships: Complete Implementation Guide | Beekeeper Studio](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide)

Always index foreign key columns in junction tables:

```sql
CREATE INDEX idx_product_distributors_product ON product_distributors(product_id);
CREATE INDEX idx_product_distributors_distributor ON product_distributors(distributor_id);

-- Composite index for common query patterns
CREATE INDEX idx_product_dist_status_lookup ON product_distributors(distributor_id, status);

-- Index on vendor item numbers for reverse lookups
CREATE INDEX idx_vendor_item_number ON product_distributors(vendor_item_number) WHERE vendor_item_number IS NOT NULL;
```

### Query Performance Patterns

For finding all products a distributor carries:
```sql
SELECT p.*, pd.vendor_item_number, pd.status
FROM products p
JOIN product_distributors pd ON p.id = pd.product_id
WHERE pd.distributor_id = 'dist-123'
  AND pd.status = 'active'
  AND pd.valid_to = 'infinity';
```

For finding which distributors carry a product:
```sql
SELECT d.*, pd.vendor_item_number, pd.status
FROM distributors d
JOIN product_distributors pd ON d.id = pd.distributor_id
WHERE pd.product_id = 'prod-456'
  AND pd.status = 'active';
```

## Trade-off Analysis

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Composite PK** | Prevents duplicates automatically; standard pattern; no extra ID column | More complex foreign keys if other tables reference junction | Simple many-to-many with few attributes |
| **Surrogate PK** | Easier foreign key references; simpler ORM mapping | Requires separate uniqueness constraint; extra column | Junction tables referenced by other tables |
| **Simple Junction** | Minimal schema; fast inserts | No relationship metadata; limited business logic | Pure linking with no attributes |
| **Junction with Attributes** | Rich relationship data; becomes domain entity | More complex queries; larger table size | Authorization agreements with DOT numbers |
| **Transition Table (State Machine)** | Full audit trail; concurrency-safe; historical queries | Additional table; more complex writes | Compliance/audit requirements |
| **Enum Status** | Type-safe; simple queries; enforced at DB level | Schema migration to add states; less flexible | Simple workflows without history needs |
| **valid_from/valid_to** | Time travel queries; historical accuracy | More complex queries; larger indexes | Contract/agreement effective dating |
| **Range Types** | Efficient temporal queries; native operators | PostgreSQL-specific; learning curve | Advanced temporal requirements |
| **Materialized Inheritance** | Fast reads; no joins needed | Data duplication; complex updates; sync issues | High-read, low-write scenarios |
| **Computed Inheritance (Views)** | Single source of truth; simpler updates | Slower queries; no indexes on computed data | Low-volume or occasional queries |

## Recommendations for Crispy CRM

### Recommended Schema for Product-Distributor Junction

Based on Crispy CRM's requirements (DOT numbers, authorizations, status tracking), here's the recommended approach:

```sql
-- Core entities
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    principal_id UUID NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
    sku TEXT, -- Internal SKU
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE TABLE distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'regional' CHECK (type IN ('national', 'regional')),
    parent_id UUID REFERENCES distributors(id), -- For regional → national hierarchy
    territory_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT regional_must_have_parent
        CHECK ((type = 'national' AND parent_id IS NULL) OR
               (type = 'regional' AND parent_id IS NOT NULL))
);

-- Junction table with DOT numbers and authorization tracking
CREATE TABLE product_distributors (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,

    -- Vendor item number (DOT number: USF#, Sysco#, GFS#, etc.)
    vendor_item_number TEXT,

    -- Authorization status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),

    -- Status tracking
    authorized_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,

    -- Temporal validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ DEFAULT 'infinity',

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    PRIMARY KEY (product_id, distributor_id)
);

-- Essential indexes
CREATE INDEX idx_product_dist_product ON product_distributors(product_id);
CREATE INDEX idx_product_dist_distributor ON product_distributors(distributor_id);
CREATE INDEX idx_product_dist_status ON product_distributors(status);
CREATE INDEX idx_product_dist_vendor_item ON product_distributors(vendor_item_number) WHERE vendor_item_number IS NOT NULL;
CREATE INDEX idx_product_dist_valid_period ON product_distributors(valid_from, valid_to);

-- Index for finding active authorizations
CREATE INDEX idx_product_dist_active ON product_distributors(distributor_id, status)
    WHERE status = 'active' AND valid_to = 'infinity';
```

### Implementation Rationale

1. **Composite Primary Key** (product_id, distributor_id): Prevents duplicate authorizations naturally
2. **vendor_item_number as TEXT**: Supports alphanumeric codes from different distributors (USF#4587291, Sysco#1092847)
3. **Enum-style CHECK constraint** for status: Type-safe without PostgreSQL enum migration complexity
4. **valid_from/valid_to** pattern: Supports contract effective dating and future-dated authorizations
5. **Separate status timestamps**: authorized_at and deactivated_at provide audit trail without full transition table
6. **Soft delete via deleted_at**: Maintains referential integrity while hiding inactive records

### Migration Path for MVP → Full Audit Trail

If full audit history becomes required post-MVP, add transition table:

```sql
CREATE TABLE product_distributor_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    distributor_id UUID NOT NULL,
    to_status TEXT NOT NULL,
    most_recent BOOLEAN NOT NULL,
    sort_key INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    FOREIGN KEY (product_id, distributor_id)
        REFERENCES product_distributors(product_id, distributor_id),

    UNIQUE(product_id, distributor_id, most_recent) WHERE most_recent = true,
    UNIQUE(product_id, distributor_id, sort_key)
);
```

This preserves the existing schema while adding comprehensive audit capabilities.

## Sources Consulted

- [Many-to-Many Database Relationships: Complete Implementation Guide | Beekeeper Studio](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide) - Comprehensive guide to junction table patterns with SQL examples
- [What Is a Junction Table and Why Is It Important in Databases? | Enkle Designs](https://enkledesigns.com/what-is-a-junction-table/) - Junction table fundamentals and surrogate key patterns
- [What Is a Many-to-Many Relationship in a Database? | Redgate](https://www.red-gate.com/blog/many-to-many-relationship) - Many-to-many relationship examples and enhanced junction tables
- [A Beginner's Guide to SKU Mapping for Ecommerce | Flxpoint](https://flxpoint.com/blog/beginners-guide-sku-mapping-ecommerce) - Vendor SKU mapping patterns and data normalization strategies
- [Database Design for Product Management | Medium](https://medium.com/@pesarakex/database-design-for-product-management-9280fd7c66fe) - Product attribute modeling and flexible schema patterns
- [Distribution Agreement Template | Contractbook](https://contractbook.com/templates/distribution-agreement) - Authorization agreement components and business requirements
- [Use your database to power state machines | Lawrence Jones](https://blog.lawrencejones.dev/state-machines/) - Database-powered state machine pattern with transition tables
- [How to Manage Temporal Visibility in PostgreSQL | GeeksforGeeks](https://www.geeksforgeeks.org/postgresql/how-to-manage-temporal-visibility-in-postgresql/) - Temporal data patterns with valid_from/valid_to implementation
- [Parent-child hierarchies | IBM](https://www.ibm.com/docs/en/ida/9.1.2?topic=hierarchies-parent-child) - Hierarchical data modeling for organizational structures
- [Association Patterns in Database Design | Medium](https://medium.com/@artemkhrenov/association-patterns-in-database-design-one-to-many-many-to-many-and-beyond-06aaa1b8ddd6) - Advanced association patterns including inheritance approaches
