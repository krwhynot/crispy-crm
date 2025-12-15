# Organization Hierarchy Patterns for CRM

## Executive Summary

Industry-standard CRM systems model hierarchical organizations using self-referential foreign keys (parent_id pattern) combined with scope/type fields to distinguish operating entities from brand groupings. For distributor hierarchies like "Sysco Corporation → Sysco Chicago," best practices recommend limiting hierarchy depth to 3 levels, using nullable parent_id fields, and leveraging PostgreSQL's WITH RECURSIVE queries for reporting. Critical trade-offs exist between nested data structures (complex querying) and flattened approaches with auxiliary fields (simpler queries, limited roll-up capabilities).

## Industry Standards

### Pattern 1: Self-Referential Foreign Key (Parent-Child)

**Source:** [PostgreSQL Recursive Query (Neon)](https://neon.com/postgresql/postgresql-tutorial/postgresql-recursive-query)

**Description:** The dominant pattern across all CRM platforms uses a single table with a foreign key pointing back to itself, creating a tree structure where each record references its parent.

**When to use:**
- Unknown hierarchy depth at design time
- Need to support recursive traversal (all descendants, all ancestors)
- Standard organizational charts and territory structures
- When hierarchy is stable and cycles are impossible

**Example:**
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Index for performance
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
```

**Key Characteristics:**
- NULL parent_id indicates root/top-level entities
- CASCADE deletion ensures referential integrity
- Requires CHECK constraint to prevent direct self-reference
- Index on parent_id critical for join performance

### Pattern 2: Parent-Child with Scope Levels

**Source:** [RevOps Co-op: Parent-Child Account Hierarchy](https://www.revopscoop.com/post/parent-child-account-hierarchy-crm)

**Description:** Extends the basic pattern with explicit scope/type fields to distinguish between entity purposes (brand vs. operating unit, national vs. regional vs. local).

**When to use:**
- Organizations have distinct entity types (holding companies, operating divisions, branches)
- Different business rules apply at different levels
- Reporting needs vary by scope (national rollups vs. regional metrics)
- Need to identify "where business actually happens"

**Example:**
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT,
  scope_level VARCHAR(50) CHECK (scope_level IN ('national', 'regional', 'local')),
  is_operating_entity BOOLEAN DEFAULT true,
  address TEXT, -- Often NULL for national/brand entities
  FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Example data: Sysco hierarchy
INSERT INTO organizations VALUES
  (1, 'Sysco Corporation', NULL, 'national', false, NULL),
  (2, 'Sysco Chicago', 1, 'regional', true, '123 Main St, Chicago IL'),
  (3, 'Sysco Chicago - West Warehouse', 2, 'local', true, '456 Oak Ave, Naperville IL');
```

**Key Characteristics:**
- `scope_level` enables level-specific queries without counting depth
- `is_operating_entity` distinguishes transactional units from organizational groupings
- Nullable address for non-operational parents
- ON DELETE SET NULL (vs CASCADE) preserves child entities if parent removed

### Pattern 3: Recursive CTE for Hierarchical Queries

**Source:** [GeeksforGeeks: PostgreSQL Recursive Queries](https://www.geeksforgeeks.org/postgresql/postgresql-recursive-query-using-ctes/)

**Description:** PostgreSQL's WITH RECURSIVE clause enables querying entire hierarchies in a single query, supporting both downward (all descendants) and upward (all ancestors) traversal.

**When to use:**
- Need to retrieve full subtrees or ancestor chains
- Calculating aggregate metrics across hierarchy levels
- Generating organizational reports or visualizations
- Unknown/variable hierarchy depth

**Example - Find All Subordinate Organizations:**
```sql
WITH RECURSIVE org_tree AS (
  -- Anchor: Start with Sysco Chicago
  SELECT id, name, parent_id, 0 AS level, name::TEXT AS path
  FROM organizations
  WHERE id = 2

  UNION ALL

  -- Recursive: Find all children
  SELECT o.id, o.name, o.parent_id, t.level + 1, t.path || ' > ' || o.name
  FROM organizations o
  INNER JOIN org_tree t ON o.parent_id = t.id
)
SELECT level, REPEAT('  ', level) || name AS indented_name, path
FROM org_tree
ORDER BY path;
```

**Example - Find Parent Chain (Upward Traversal):**
```sql
WITH RECURSIVE parent_chain AS (
  -- Anchor: Start with local warehouse
  SELECT id, name, parent_id, 0 AS level
  FROM organizations
  WHERE id = 3

  UNION ALL

  -- Recursive: Follow parent_id upward
  SELECT o.id, o.name, o.parent_id, p.level + 1
  FROM organizations o
  INNER JOIN parent_chain p ON o.id = p.parent_id
)
SELECT name, level FROM parent_chain ORDER BY level DESC;
```

**Key Characteristics:**
- Anchor member defines starting point (WHERE clause)
- Recursive member joins CTE to itself
- Automatically terminates when no new rows match
- Can track depth with level counter
- Can build path strings for breadcrumb navigation

### Pattern 4: Custom Lookup Fields (Non-Hierarchical Alternative)

**Source:** [RevOps Co-op: Parent-Child Account Hierarchy](https://www.revopscoop.com/post/parent-child-account-hierarchy-crm)

**Description:** For complex many-to-many or non-hierarchical relationships, use separate lookup/junction tables instead of parent_id hierarchies.

**When to use:**
- Entities can belong to multiple parents (e.g., distributor carries multiple principals)
- Relationship is associative, not hierarchical
- Need to avoid reporting limitations of nested hierarchies
- Require bidirectional visibility without hierarchy constraints

**Example:**
```sql
-- Separate tables, no hierarchy
CREATE TABLE distributors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  scope_level VARCHAR(50)
);

CREATE TABLE principals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Junction table for many-to-many
CREATE TABLE distributor_principals (
  id SERIAL PRIMARY KEY,
  distributor_id INT NOT NULL,
  principal_id INT NOT NULL,
  authorized_date DATE,
  FOREIGN KEY (distributor_id) REFERENCES distributors(id),
  FOREIGN KEY (principal_id) REFERENCES principals(id),
  UNIQUE (distributor_id, principal_id)
);
```

**Key Characteristics:**
- Avoids hierarchy limitations (single parent, depth constraints)
- Enables "summary reports by OEM and see all dealerships associated"
- Better for many-to-many relationships
- Simpler queries, no recursive CTEs needed

## Salesforce-Specific Patterns

**Source:** [Best Practices for Managing Parent-Child Relationships (LeadGenius)](https://www.leadgenius.com/resources/best-practices-for-managing-parent-child-relationships-in-salesforce)

### Account Hierarchy Fields
- **Parent Account**: Standard lookup field to Account (self-referential)
- **Account Site**: 80-character text field for entity type (e.g., "Regional Office", "Headquarters", "Branch")
- **Ultimate Parent**: Formula field (nested IF statements) to identify top-level parent (max ~5 levels)

### Critical Limitations
- **Reporting Depth**: Roll-up reporting only works 1 level deep (parent cannot see grandchild metrics)
- **Display Limit**: Maximum 2,000 accounts shown in hierarchy view
- **No Roll-Up Fields**: Salesforce does not support automatic roll-up summary fields across hierarchies
- **Data Skew**: Excessive child accounts (>10,000) under single parent cause performance degradation

### Governance Recommendations
1. **Quarterly Audits**: Review hierarchy structure for M&A changes, ownership updates
2. **Territory Alignment**: Use Territory Management to assign parent-child combinations to sales teams
3. **Role Hierarchy Mapping**: Align Salesforce roles to market segments for visibility control
4. **Clear Ownership Rules**: Define escalation paths when child accounts move between tiers

## Supabase-Specific Implementation

**Source:** [Supabase Discussion: Recursive Parent-Child](https://github.com/orgs/supabase/discussions/2588)

### JavaScript Query Approach (Limited Depth)
```javascript
const { data, error } = await supabase
  .from("organizations")
  .select(`
    id, name, parent_id, scope_level,
    children:organizations(*,
      children:organizations(*,
        children:organizations(*)
      )
    )
  `)
  .is("parent_id", null);
```

**Limitations:**
- Must predetermine hierarchy depth (3 levels shown above)
- Creates nested JSON structure
- Not suitable for unknown/variable depth

### PostgreSQL View Approach (Recommended)
```sql
-- Create recursive view
CREATE OR REPLACE VIEW organization_hierarchy AS
WITH RECURSIVE tree AS (
  SELECT id, name, parent_id, 0 AS level, ARRAY[id] AS path
  FROM organizations
  WHERE parent_id IS NULL

  UNION ALL

  SELECT o.id, o.name, o.parent_id, t.level + 1, t.path || o.id
  FROM organizations o
  INNER JOIN tree t ON o.parent_id = t.id
)
SELECT * FROM tree ORDER BY path;

-- Query via Supabase client
const { data, error } = await supabase
  .from("organization_hierarchy")
  .select("*")
  .eq("level", 1); // Regional entities only
```

**Advantages:**
- Handles arbitrary depth
- Reusable across application
- Enables RLS policies on view
- Returns flat array (must reconstruct tree client-side if needed)

## Trade-off Analysis

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Self-Referential (parent_id)** | Simple schema, industry standard, supports unknown depth, efficient storage | Requires recursive queries, complex reporting, potential performance issues at scale | Standard org charts, territory hierarchies, any tree structure |
| **Parent + Scope Fields** | Explicit entity types, simpler queries by level, clear operating vs. brand distinction | Additional columns, must maintain scope consistency, level-specific logic in queries | Multi-tier distributors, franchises, corporate structures with distinct entity roles |
| **Recursive CTEs** | Full hierarchy traversal, single query for rollups, flexible starting points | Complex SQL, performance concerns with deep/wide trees, not supported in all databases | Reporting, aggregations, path generation, ancestor/descendant lookups |
| **Lookup/Junction Tables** | No depth limits, many-to-many support, simpler queries, bidirectional visibility | No automatic hierarchy, manual relationship management, multiple tables | Non-hierarchical relationships, products-to-distributors, authorizations |
| **Supabase Nested Select** | Simple syntax, nested JSON response, no custom views needed | Fixed depth, verbose for deep hierarchies, client-side complexity | Shallow hierarchies (2-3 levels), UI tree components, known structure |
| **PostgreSQL Views** | Arbitrary depth, centralized logic, RLS-compatible, client-agnostic | Flat results (client must reconstruct tree), view maintenance overhead | Deep/variable hierarchies, reusable queries, Supabase/PostgREST environments |

## Performance Considerations

### Indexing Strategy
```sql
-- Required indexes for parent_id pattern
CREATE INDEX idx_parent_id ON organizations(parent_id);
CREATE INDEX idx_scope_level ON organizations(scope_level);
CREATE INDEX idx_is_operating ON organizations(is_operating_entity) WHERE is_operating_entity = true;

-- Composite index for common queries
CREATE INDEX idx_parent_scope ON organizations(parent_id, scope_level);
```

### Query Optimization
- Use `UNION ALL` (not `UNION`) in CTEs to avoid duplicate-check overhead
- Limit recursion depth with `WHERE level < 10` to prevent runaway queries
- Add cycle detection for graphs: `WHERE NOT (id = ANY(path))`
- Cache hierarchy views for read-heavy workloads

### Data Skew Prevention
- Monitor child count per parent (alert if >1,000)
- Partition large hierarchies by region/division
- Consider ltree extension for very large/complex hierarchies

## Recommendations for Crispy CRM

### Schema Design (Distributor Hierarchy)

Given the use case of "Sysco Corporation → Sysco Chicago → Warehouse," implement Pattern 2 (Parent + Scope):

```sql
-- Migration: Add hierarchy support to organizations table
ALTER TABLE organizations
  ADD COLUMN parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN scope_level VARCHAR(50) CHECK (scope_level IN ('national', 'regional', 'local')),
  ADD COLUMN is_operating_entity BOOLEAN DEFAULT true;

-- Index for performance
CREATE INDEX idx_orgs_parent_id ON organizations(parent_id);
CREATE INDEX idx_orgs_scope_level ON organizations(scope_level);
CREATE INDEX idx_orgs_operating ON organizations(is_operating_entity) WHERE is_operating_entity = true;

-- Check constraint: National entities have no parent
ALTER TABLE organizations
  ADD CONSTRAINT national_entities_no_parent
  CHECK (scope_level != 'national' OR parent_id IS NULL);
```

### Data Provider Implementation

Add to `unifiedDataProvider.ts`:

```typescript
// Zod schema additions
const OrganizationSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  parent_id: z.string().uuid().nullable(),
  scope_level: z.enum(['national', 'regional', 'local']).nullable(),
  is_operating_entity: z.boolean().default(true),
  // ... existing fields
});

// Custom method for hierarchy queries
getOrgHierarchy: async (orgId: string) => {
  const { data, error } = await supabase.rpc('get_org_hierarchy', { org_id: orgId });
  if (error) throw error;
  return data.map((row: unknown) => OrganizationSchema.parse(row));
}
```

### PostgreSQL Function (Edge Function or Migration)

```sql
-- Create reusable function for hierarchy retrieval
CREATE OR REPLACE FUNCTION get_org_hierarchy(org_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  parent_id UUID,
  scope_level VARCHAR(50),
  is_operating_entity BOOLEAN,
  level INT,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE tree AS (
    SELECT o.id, o.name, o.parent_id, o.scope_level, o.is_operating_entity,
           0 AS level, o.name::TEXT AS path
    FROM organizations o
    WHERE o.id = org_id

    UNION ALL

    SELECT o.id, o.name, o.parent_id, o.scope_level, o.is_operating_entity,
           t.level + 1, t.path || ' > ' || o.name
    FROM organizations o
    INNER JOIN tree t ON o.parent_id = t.id
  )
  SELECT * FROM tree ORDER BY level, name;
END;
$$ LANGUAGE plpgsql STABLE;
```

### UI Considerations

**List Views:**
- Default filter: `is_operating_entity = true` (hide brand-only parents)
- Add hierarchy breadcrumb: "Sysco Corporation > Sysco Chicago"
- Enable "Show all entities" toggle to include non-operating parents

**Forms:**
- Parent Organization dropdown: Filter to `scope_level = 'national'` or `scope_level = 'regional'` based on current entity's level
- Auto-populate `is_operating_entity = false` when scope_level = 'national'
- Validate: Regional entities must have national parent; local entities must have regional parent

**Reporting:**
- Opportunity roll-ups: Use recursive CTE to sum opportunities across distributor hierarchy
- Activity tracking: Default to operating entities only (exclude holding companies)

### Migration Path

1. **Phase 1 (Schema):** Add columns as nullable, backfill existing orgs as `scope_level = 'regional'`, `is_operating_entity = true`
2. **Phase 2 (Data):** Identify national entities (Sysco Corp, US Foods Corp), set `is_operating_entity = false`
3. **Phase 3 (Relationships):** Populate parent_id for known hierarchies
4. **Phase 4 (Constraints):** Make scope_level NOT NULL after backfill
5. **Phase 5 (UI):** Deploy filtered views and hierarchy navigation

### When NOT to Use Hierarchies

For Crispy CRM, **do NOT use parent_id hierarchy for**:
- **Principals ↔ Distributors**: Use `authorizations` junction table (many-to-many)
- **Contacts ↔ Organizations**: Use `contact_organizations` junction table (existing pattern)
- **Opportunities ↔ Distributors**: Direct foreign key to operating entity only

Use hierarchies **ONLY for**:
- Distributor organizational structure (Sysco Corp → Sysco Chicago)
- Territory management (future: North Region → Illinois Territory)

## Sources Consulted

- [RevOps Co-op: Parent-Child Account Hierarchy](https://www.revopscoop.com/post/parent-child-account-hierarchy-crm) — CRM hierarchy best practices, scope levels, alternatives
- [LeadGenius: Best Practices for Managing Parent-Child Relationships](https://www.leadgenius.com/resources/best-practices-for-managing-parent-child-relationships-in-salesforce) — Salesforce governance, limitations, territory management
- [Neon: PostgreSQL Recursive Query](https://neon.com/postgresql/postgresql-tutorial/postgresql-recursive-query) — WITH RECURSIVE syntax, employee hierarchy examples
- [Supabase Discussion #2588: Recursive Parent-Child](https://github.com/orgs/supabase/discussions/2588) — Supabase nested queries, recursive view approach
- [GeeksforGeeks: PostgreSQL Recursive Queries](https://www.geeksforgeeks.org/postgresql/postgresql-recursive-query-using-ctes/) — CTE patterns, cycle detection
- [Salesforce Ben: How to Build Account Hierarchy](https://www.salesforceben.com/how-to-build-a-salesforce-account-hierarchy/) — Account Site field, Ultimate Parent formula, display limits
- [QuotaPath: Managing Parent-Child Accounts](https://www.quotapath.com/blog/managing-parent-child-accounts-in-your-crm/) — Ownership rules, data skew prevention
