# Organizations

## Purpose

Organization management in Crispy-CRM includes parent-child hierarchies for multi-location customers and distributors. This resource covers hierarchy validation, circular reference prevention, depth limits, rollup metrics, and deletion protection.

## Core Pattern

### Organization Hierarchy Model

```typescript
// Two-level hierarchy maximum
// Example: Distributor → Branch Locations
//          Restaurant Chain → Individual Locations
//          Customer → Sister Branches

interface Organization {
  id: number;
  name: string;
  organization_type: OrganizationType;
  parent_organization_id?: number | null;  // Reference to parent
  child_branch_count?: number;              // Computed: number of children
}

// Business rules:
// 1. Only distributor/customer/principal can be parents
// 2. Maximum depth: 2 levels (no grandchildren)
// 3. Circular references prevented
// 4. Cannot delete parent with active children
```

## Real-World Example: Hierarchy Validation

**From `src/atomic-crm/validation/organizations.ts`:**

```typescript
// Define eligible parent types
export const PARENT_ELIGIBLE_TYPES = ["distributor", "customer", "principal"] as const;
export type ParentEligibleType = (typeof PARENT_ELIGIBLE_TYPES)[number];

// Type guard
export function isParentEligibleType(type: string): type is ParentEligibleType {
  return PARENT_ELIGIBLE_TYPES.includes(type as ParentEligibleType);
}

// Business rule: Can this organization be a parent?
export function canBeParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
}): boolean {
  return (
    isParentEligibleType(org.organization_type) &&
    !org.parent_organization_id  // Can't be a parent if it HAS a parent
  );
}

// Business rule: Can this organization have a parent?
export function canHaveParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
  child_branch_count?: number;
}): boolean {
  return (
    isParentEligibleType(org.organization_type) &&
    !org.parent_organization_id && // Can't have parent if already has one
    (org.child_branch_count === 0 || org.child_branch_count === undefined) // Can't have parent if has children
  );
}
```

## Database Schema

### Table Structure

```sql
CREATE TABLE organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  organization_type organization_type NOT NULL DEFAULT 'unknown',

  -- Hierarchy field
  parent_organization_id BIGINT REFERENCES organizations(id),

  -- Other fields...
  priority TEXT,
  sales_id BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT organizations_name_not_empty CHECK (name <> '')
);

-- Index for hierarchy queries
CREATE INDEX idx_organizations_parent_id ON organizations(parent_organization_id);

-- Index for type filtering
CREATE INDEX idx_organizations_type ON organizations(organization_type);
```

### Summary View with Rollup Metrics

**From migration `20251110142654_add_organization_hierarchy_rollups.sql`:**

```sql
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name as parent_organization_name,
  o.priority,
  o.sales_id,
  o.created_at,
  o.deleted_at,

  -- Branch counts for parent orgs
  (SELECT COUNT(*)
   FROM organizations children
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL) as child_branch_count,

  -- Rollup metrics across all branches
  (SELECT COUNT(DISTINCT c.id)
   FROM organizations children
   LEFT JOIN contacts c ON c.organization_id = children.id
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL
     AND c.deleted_at IS NULL) as total_contacts_across_branches,

  (SELECT COUNT(DISTINCT opp.id)
   FROM organizations children
   LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL
     AND opp.deleted_at IS NULL) as total_opportunities_across_branches,

  -- Direct counts (for this org only)
  (SELECT COUNT(*) FROM contacts WHERE organization_id = o.id
   AND deleted_at IS NULL) as nb_contacts,

  (SELECT COUNT(*) FROM opportunities WHERE principal_organization_id = o.id
   AND deleted_at IS NULL) as nb_opportunities

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;
```

**Why this design:**
- `child_branch_count`: Number of direct children (branches)
- `total_contacts_across_branches`: All contacts across all branches
- `total_opportunities_across_branches`: All opportunities across all branches
- `nb_contacts`: Direct contacts for this org only
- `nb_opportunities`: Direct opportunities for this org only
- Subqueries ensure accurate counts with soft deletes

## Hierarchy Business Rules

### Pattern 1: Type Eligibility

```typescript
// Only certain types can participate in hierarchies
const ELIGIBLE_TYPES = ["distributor", "customer", "principal"];

// Validation in UI
function validateParentSelection(parent: Organization, child: Organization): string | null {
  // Parent must be eligible type
  if (!ELIGIBLE_TYPES.includes(parent.organization_type)) {
    return `${parent.organization_type} organizations cannot be parents`;
  }

  // Child must be eligible type
  if (!ELIGIBLE_TYPES.includes(child.organization_type)) {
    return `${child.organization_type} organizations cannot have parents`;
  }

  // Parent cannot already have a parent (max 2 levels)
  if (parent.parent_organization_id) {
    return "Selected organization is already a branch and cannot be a parent";
  }

  // Child cannot have children
  if (child.child_branch_count && child.child_branch_count > 0) {
    return "Organization with branches cannot become a child";
  }

  return null; // Valid
}
```

### Pattern 2: Circular Reference Prevention

```typescript
export class OrganizationService {
  /**
   * Prevent circular references in hierarchy
   * Example: A → B → C → A (circular)
   */
  async validateHierarchy(parentId: string, childId?: string): Promise<void> {
    if (!childId) return; // New organization, no circular risk

    // Get all ancestors of the parent
    const ancestors = await this.getAncestors(parentId);

    // Check if child is in parent's ancestry
    if (ancestors.some(ancestor => ancestor.id === childId)) {
      throw new BusinessRuleError(
        'Circular organization hierarchy detected',
        { parentId, childId, ancestors }
      );
    }
  }

  /**
   * Get all ancestors using recursive query
   */
  private async getAncestors(orgId: string): Promise<Organization[]> {
    // Use RPC function with recursive CTE
    const { data, error } = await this.supabase.rpc('get_org_ancestors', {
      org_id: orgId
    });

    if (error) {
      throw new DatabaseError('Failed to get ancestors', { orgId, error });
    }

    return data || [];
  }
}
```

**RPC function for recursive ancestors:**

```sql
CREATE OR REPLACE FUNCTION get_org_ancestors(org_id BIGINT)
RETURNS TABLE(id BIGINT, name TEXT, parent_organization_id BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    -- Base case: start with the organization
    SELECT o.id, o.name, o.parent_organization_id
    FROM organizations o
    WHERE o.id = org_id

    UNION ALL

    -- Recursive case: get parent
    SELECT p.id, p.name, p.parent_organization_id
    FROM organizations p
    INNER JOIN ancestors a ON p.id = a.parent_organization_id
    WHERE p.deleted_at IS NULL
  )
  SELECT * FROM ancestors WHERE id != org_id;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Pattern 3: Depth Limit Enforcement

```typescript
export class OrganizationService {
  private readonly MAX_DEPTH = 2;

  /**
   * Enforce maximum hierarchy depth (2 levels)
   */
  async validateDepth(parentId: string): Promise<void> {
    const depth = await this.getHierarchyDepth(parentId);

    if (depth >= this.MAX_DEPTH) {
      throw new BusinessRuleError(
        `Maximum hierarchy depth (${this.MAX_DEPTH} levels) exceeded`,
        { parentId, currentDepth: depth }
      );
    }
  }

  /**
   * Calculate hierarchy depth
   */
  private async getHierarchyDepth(orgId: string): Promise<number> {
    const ancestors = await this.getAncestors(orgId);
    return ancestors.length;
  }
}
```

### Pattern 4: Deletion Protection

**From migration `20251110142650_add_organization_deletion_protection.sql`:**

```sql
-- Prevent deleting parent organizations with child branches
CREATE OR REPLACE FUNCTION prevent_parent_org_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations
    WHERE parent_organization_id = OLD.id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization with child branches. Remove branches first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER check_parent_deletion
  BEFORE DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_parent_org_deletion();
```

**Why:** Protects data integrity by requiring branches to be deleted before parent

## UI Patterns

### Pattern 1: Parent Organization Selector

```typescript
// Filter organizations eligible to be parents
function getEligibleParents(organizations: Organization[]): Organization[] {
  return organizations.filter(org =>
    // Must be eligible type
    PARENT_ELIGIBLE_TYPES.includes(org.organization_type) &&
    // Cannot already be a child
    !org.parent_organization_id &&
    // Must not be the current organization
    org.id !== currentOrganization.id
  );
}

// Form component
<SelectInput
  source="parent_organization_id"
  label="Parent Organization"
  choices={getEligibleParents(organizations)}
  optionText="name"
  optionValue="id"
  helperText="Select parent for multi-location organization"
/>
```

### Pattern 2: Hierarchy Breadcrumb

```typescript
// Display hierarchy path
export function HierarchyBreadcrumb({ organization }: { organization: Organization }) {
  if (!organization.parent_organization_id) {
    return null; // No parent, no breadcrumb
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Link to="/organizations">Organizations</Link>
      <ChevronRight size={16} />
      <Link to={`/organizations/${organization.parent_organization_id}/show`}>
        {organization.parent_organization_name}
      </Link>
      <ChevronRight size={16} />
      <span className="font-semibold">{organization.name}</span>
    </div>
  );
}
```

### Pattern 3: Branch Locations Table

```typescript
// Display child branches for parent organizations
export function BranchLocationsSection({ parentId }: { parentId: number }) {
  const { data: branches, isLoading } = useGetList('organizations', {
    filter: { parent_organization_id: parentId },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  });

  if (isLoading) return <Loading />;
  if (!branches || branches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Locations ({branches.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Opportunities</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map(branch => (
              <TableRow key={branch.id}>
                <TableCell>
                  <Link to={`/organizations/${branch.id}/show`}>
                    {branch.name}
                  </Link>
                </TableCell>
                <TableCell>{branch.organization_type}</TableCell>
                <TableCell>{branch.nb_contacts}</TableCell>
                <TableCell>{branch.nb_opportunities}</TableCell>
                <TableCell>
                  <Link to={`/organizations/${branch.id}/edit`}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Pattern 4: Sister Branches Display

```typescript
// Show other branches with same parent
export function ParentOrganizationSection({ organization }: { organization: Organization }) {
  if (!organization.parent_organization_id) return null;

  const { data: sisterBranches } = useGetList('organizations', {
    filter: {
      parent_organization_id: organization.parent_organization_id,
      id_neq: organization.id, // Exclude current organization
    },
    pagination: { page: 1, perPage: 3 },
    sort: { field: 'name', order: 'ASC' },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent Organization</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Parent link */}
        <Link to={`/organizations/${organization.parent_organization_id}/show`}>
          {organization.parent_organization_name}
        </Link>

        {/* Sister branches */}
        {sisterBranches && sisterBranches.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Sister Branches</h4>
            <ul className="space-y-1">
              {sisterBranches.slice(0, 3).map(branch => (
                <li key={branch.id}>
                  <Link to={`/organizations/${branch.id}/show`}>
                    {branch.name}
                  </Link>
                </li>
              ))}
              {sisterBranches.length > 3 && (
                <li>
                  <Link to={`/organizations?filter=${JSON.stringify({
                    parent_organization_id: organization.parent_organization_id
                  })}`}>
                    + {sisterBranches.length - 3} more
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Use Cases

### Use Case 1: Multi-Location Restaurant Chain

```
Parent: "Joe's Pizza"
  ├─ Branch: "Joe's Pizza - Downtown"
  ├─ Branch: "Joe's Pizza - Northside"
  └─ Branch: "Joe's Pizza - Airport"
```

**Benefits:**
- Shared contacts (corporate decision-makers)
- Aggregated opportunity tracking
- Individual branch performance metrics
- Sister branch visibility

### Use Case 2: Distributor Network

```
Parent: "ABC Distributors"
  ├─ Branch: "ABC Distributors - Chicago"
  ├─ Branch: "ABC Distributors - Milwaukee"
  └─ Branch: "ABC Distributors - Indianapolis"
```

**Benefits:**
- Corporate relationship tracking
- Regional sales management
- Consolidated reporting
- Territory-based opportunities

### Use Case 3: Principal with Sister Companies

```
Parent: "Organic Foods Inc"
  ├─ Branch: "Organic Snacks Division"
  ├─ Branch: "Organic Beverages Division"
  └─ Branch: "Organic Bakery Division"
```

**Benefits:**
- Brand family management
- Cross-division opportunities
- Consolidated product catalog
- Shared decision-makers

## Query Patterns

### Get Organization with Hierarchy Info

```typescript
const { data: org } = await supabase
  .from('organizations_summary')
  .select('*')
  .eq('id', orgId)
  .single();

console.log({
  name: org.name,
  parent: org.parent_organization_name,
  branches: org.child_branch_count,
  totalContacts: org.total_contacts_across_branches,
  totalOpportunities: org.total_opportunities_across_branches,
});
```

### Get All Branches for Parent

```typescript
const { data: branches } = await supabase
  .from('organizations')
  .select('*')
  .eq('parent_organization_id', parentId)
  .is('deleted_at', null)
  .order('name');
```

### Get Sister Branches

```typescript
// Get branches with same parent, excluding current org
const { data: sisters } = await supabase
  .from('organizations')
  .select('*')
  .eq('parent_organization_id', org.parent_organization_id)
  .neq('id', org.id)
  .is('deleted_at', null)
  .order('name');
```

## Testing Hierarchy Rules

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { canBeParent, canHaveParent } from './organizations';

describe('Organization Hierarchy', () => {
  it('should allow eligible types to be parents', () => {
    expect(canBeParent({
      organization_type: 'distributor',
      parent_organization_id: null,
    })).toBe(true);

    expect(canBeParent({
      organization_type: 'customer',
      parent_organization_id: null,
    })).toBe(true);

    expect(canBeParent({
      organization_type: 'principal',
      parent_organization_id: null,
    })).toBe(true);
  });

  it('should prevent ineligible types from being parents', () => {
    expect(canBeParent({
      organization_type: 'prospect',
      parent_organization_id: null,
    })).toBe(false);

    expect(canBeParent({
      organization_type: 'unknown',
      parent_organization_id: null,
    })).toBe(false);
  });

  it('should prevent child organizations from being parents', () => {
    expect(canBeParent({
      organization_type: 'distributor',
      parent_organization_id: 123, // Has a parent
    })).toBe(false);
  });

  it('should prevent organizations with children from having parents', () => {
    expect(canHaveParent({
      organization_type: 'distributor',
      parent_organization_id: null,
      child_branch_count: 3, // Has children
    })).toBe(false);
  });
});
```

## Best Practices

### DO
✅ Validate hierarchy rules in both UI and backend
✅ Use type guards for eligible parent types
✅ Prevent circular references with recursive queries
✅ Enforce maximum depth (2 levels)
✅ Protect parent deletion with database triggers
✅ Display hierarchy context (breadcrumbs, sister branches)
✅ Aggregate metrics across branches (rollup queries)
✅ Test hierarchy validation thoroughly

### DON'T
❌ Allow unlimited hierarchy depth
❌ Skip circular reference validation
❌ Delete parents with active children
❌ Allow ineligible types in hierarchies
❌ Create hierarchies without business justification
❌ Forget to index parent_organization_id
❌ Mix hierarchy types (distributors with customers)

## Related Resources

- [Validation Patterns](validation-patterns.md) - Hierarchy validation schemas
- [Service Layer](service-layer.md) - Hierarchy business logic in services
- [Query Optimization](query-optimization.md) - Recursive queries and rollup metrics
- [Error Handling](error-handling.md) - Business rule error patterns
