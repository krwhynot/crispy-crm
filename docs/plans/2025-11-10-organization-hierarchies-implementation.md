# Organization Hierarchies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement parent-child organization hierarchies enabling management of multi-branch distributors (Sysco, GFS) and restaurant chains with two-level depth, rollup metrics, and comprehensive UI.

**Architecture:** Database-first approach with view updates for rollup metrics, Zod validation for business rules, React Admin components for UI (breadcrumb, hierarchy sections, filters), and TDD throughout.

**Tech Stack:** PostgreSQL views/triggers, Zod validation, React 19, TypeScript, React Admin, Vitest, Playwright

**Design Document:** `docs/plans/2025-11-10-organization-hierarchies-design.md`

---

## Phase 1: Database & Validation (Day 1)

### Task 1: Create organizations_summary view migration

**Files:**
- Create: `supabase/migrations/20251110200000_add_organization_hierarchy_rollups.sql`

**Step 1: Create migration file**

```bash
npx supabase migration new add_organization_hierarchy_rollups
```

Expected: Creates `supabase/migrations/<timestamp>_add_organization_hierarchy_rollups.sql`

**Step 2: Write migration SQL**

```sql
-- Drop existing view if it exists
DROP VIEW IF EXISTS organizations_summary;

-- Create updated view with hierarchy rollup fields
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

  -- Direct counts (existing logic)
  (SELECT COUNT(*) FROM contacts WHERE organization_id = o.id
   AND deleted_at IS NULL) as nb_contacts,
  (SELECT COUNT(*) FROM opportunities WHERE principal_organization_id = o.id
   AND deleted_at IS NULL) as nb_opportunities

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON organizations_summary TO authenticated;

-- Add comment
COMMENT ON VIEW organizations_summary IS 'Organization summary with hierarchy rollup metrics (child_branch_count, total_contacts_across_branches, total_opportunities_across_branches)';
```

**Step 3: Test migration locally**

```bash
npm run db:local:reset
```

Expected: Migration applies successfully, no errors

**Step 4: Verify view structure**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d+ organizations_summary"
```

Expected: View shows new columns: `child_branch_count`, `total_contacts_across_branches`, `total_opportunities_across_branches`

**Step 5: Query view to test rollups**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT id, name, child_branch_count, parent_organization_name FROM organizations_summary LIMIT 5;"
```

Expected: Returns rows with NULL or 0 for child_branch_count (no hierarchies yet)

**Step 6: Commit migration**

```bash
git add supabase/migrations/*_add_organization_hierarchy_rollups.sql
git commit -m "feat(db): add hierarchy rollup fields to organizations_summary view

- Add child_branch_count for parent orgs
- Add total_contacts_across_branches rollup
- Add total_opportunities_across_branches rollup
- Add parent_organization_name join field

Enables dashboard display of branch counts and metrics."
```

---

### Task 2: Create deletion protection trigger migration

**Files:**
- Create: `supabase/migrations/20251110200001_add_organization_deletion_protection.sql`

**Step 1: Create migration file**

```bash
npx supabase migration new add_organization_deletion_protection
```

Expected: Creates `supabase/migrations/<timestamp>_add_organization_deletion_protection.sql`

**Step 2: Write trigger function and trigger**

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

-- Add comment
COMMENT ON FUNCTION prevent_parent_org_deletion() IS 'Prevents deletion of organizations that have child branches. Protects hierarchy integrity.';
```

**Step 3: Test migration locally**

```bash
npm run db:local:reset
```

Expected: Migration applies successfully

**Step 4: Verify trigger exists**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d organizations" | grep -A5 "Triggers:"
```

Expected: Shows `check_parent_deletion BEFORE DELETE` trigger

**Step 5: Test trigger manually (should fail)**

```bash
# First create parent org
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "INSERT INTO organizations (name, organization_type) VALUES ('Test Parent', 'distributor') RETURNING id;"

# Note the ID (e.g., 100)

# Create child org
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "INSERT INTO organizations (name, organization_type, parent_organization_id) VALUES ('Test Child', 'distributor', 100);"

# Try to delete parent (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "DELETE FROM organizations WHERE id = 100;"
```

Expected: ERROR: `Cannot delete organization with child branches. Remove branches first.`

**Step 6: Commit migration**

```bash
git add supabase/migrations/*_add_organization_deletion_protection.sql
git commit -m "feat(db): add deletion protection for parent organizations

- Create prevent_parent_org_deletion() trigger function
- Add check_parent_deletion trigger on organizations table
- Blocks DELETE when org has child branches (deleted_at IS NULL)

Prevents accidental hierarchy destruction."
```

---

### Task 3: Update TypeScript types for new view fields

**Files:**
- Modify: `src/atomic-crm/types.ts`

**Step 1: Generate updated database types**

```bash
npx supabase gen types typescript --local > src/types/database.generated.ts
```

Expected: Regenerates types with updated organizations_summary view

**Step 2: Add computed fields to Organization interface**

In `src/atomic-crm/types.ts`, find the Organization import and update:

```typescript
// src/atomic-crm/types.ts (line 62-65)

// Organization type (imported from validation)
export type { Organization } from "./validation/organizations";

// Add computed hierarchy fields interface
export interface OrganizationWithHierarchy extends Organization {
  // Hierarchy fields from organizations_summary view
  child_branch_count?: number;
  parent_organization_name?: string;
  total_contacts_across_branches?: number;
  total_opportunities_across_branches?: number;
}

// Company is an alias for Organization for backward compatibility
export type Company = Organization;
```

**Step 3: Verify TypeScript compilation**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 4: Commit type updates**

```bash
git add src/atomic-crm/types.ts src/types/database.generated.ts
git commit -m "feat(types): add hierarchy fields to Organization interface

- Add OrganizationWithHierarchy interface
- Include child_branch_count, parent_organization_name
- Include rollup metrics: total_contacts/opportunities_across_branches
- Regenerate database types from updated view

Supports hierarchy UI components."
```

---

### Task 4: Update Zod validation schema - Add constants

**Files:**
- Modify: `src/atomic-crm/validation/organizations.ts`

**Step 1: Add parent-eligible types constant**

At the top of `src/atomic-crm/validation/organizations.ts` (after imports, before schemas):

```typescript
// src/atomic-crm/validation/organizations.ts (after line 6)

/**
 * Organization types that can be parents in a hierarchy.
 * Only distributor, customer, and principal organizations can have branches.
 * Prospects cannot have branches (not yet converted to customers).
 */
export const PARENT_ELIGIBLE_TYPES = [
  "distributor",
  "customer",
  "principal",
] as const;

export type ParentEligibleType = (typeof PARENT_ELIGIBLE_TYPES)[number];
```

**Step 2: Add helper functions**

After the constants, add helper functions:

```typescript
// src/atomic-crm/validation/organizations.ts (after PARENT_ELIGIBLE_TYPES)

/**
 * Check if an organization type can be a parent.
 */
export function isParentEligibleType(
  type: string,
): type is ParentEligibleType {
  return PARENT_ELIGIBLE_TYPES.includes(type as ParentEligibleType);
}

/**
 * Check if an organization can be a parent (eligible type + no parent itself).
 */
export function canBeParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
}): boolean {
  return (
    isParentEligibleType(org.organization_type) && !org.parent_organization_id
  );
}

/**
 * Check if an organization can have a parent (eligible type + no children + no existing parent).
 */
export function canHaveParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
  child_branch_count?: number;
}): boolean {
  return (
    isParentEligibleType(org.organization_type) &&
    !org.parent_organization_id &&
    (org.child_branch_count === 0 || org.child_branch_count === undefined)
  );
}
```

**Step 3: Verify TypeScript compilation**

```bash
npm run type-check
```

Expected: No errors

**Step 4: Commit helper functions**

```bash
git add src/atomic-crm/validation/organizations.ts
git commit -m "feat(validation): add hierarchy helper functions

- Add PARENT_ELIGIBLE_TYPES constant (distributor, customer, principal)
- Add isParentEligibleType() type guard
- Add canBeParent() - checks eligible type + no parent
- Add canHaveParent() - checks eligible type + no children + no parent

Supports validation logic in forms and business rules."
```

---

### Task 5: Write validation tests for helper functions

**Files:**
- Create: `src/atomic-crm/validation/__tests__/organizationHierarchy.test.ts`

**Step 1: Create test file**

```typescript
// src/atomic-crm/validation/__tests__/organizationHierarchy.test.ts

import { describe, it, expect } from "vitest";
import {
  PARENT_ELIGIBLE_TYPES,
  isParentEligibleType,
  canBeParent,
  canHaveParent,
} from "../organizations";

describe("organizationHierarchy", () => {
  describe("PARENT_ELIGIBLE_TYPES", () => {
    it("includes distributor, customer, principal", () => {
      expect(PARENT_ELIGIBLE_TYPES).toEqual([
        "distributor",
        "customer",
        "principal",
      ]);
    });
  });

  describe("isParentEligibleType", () => {
    it("returns true for distributor", () => {
      expect(isParentEligibleType("distributor")).toBe(true);
    });

    it("returns true for customer", () => {
      expect(isParentEligibleType("customer")).toBe(true);
    });

    it("returns true for principal", () => {
      expect(isParentEligibleType("principal")).toBe(true);
    });

    it("returns false for prospect", () => {
      expect(isParentEligibleType("prospect")).toBe(false);
    });

    it("returns false for unknown", () => {
      expect(isParentEligibleType("unknown")).toBe(false);
    });
  });

  describe("canBeParent", () => {
    it("returns true for standalone distributor", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
      };
      expect(canBeParent(org)).toBe(true);
    });

    it("returns false for distributor with parent", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: 123,
      };
      expect(canBeParent(org)).toBe(false);
    });

    it("returns false for prospect", () => {
      const org = {
        organization_type: "prospect",
        parent_organization_id: null,
      };
      expect(canBeParent(org)).toBe(false);
    });
  });

  describe("canHaveParent", () => {
    it("returns true for standalone distributor with no children", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(true);
    });

    it("returns false for distributor with children", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
        child_branch_count: 3,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns false for distributor with existing parent", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: 456,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns false for prospect", () => {
      const org = {
        organization_type: "prospect",
        parent_organization_id: null,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns true when child_branch_count is undefined", () => {
      const org = {
        organization_type: "customer",
        parent_organization_id: null,
      };
      expect(canHaveParent(org)).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they pass**

```bash
npm test -- src/atomic-crm/validation/__tests__/organizationHierarchy.test.ts
```

Expected: All 15 tests pass

**Step 3: Commit test file**

```bash
git add src/atomic-crm/validation/__tests__/organizationHierarchy.test.ts
git commit -m "test(validation): add hierarchy helper function tests

- Test PARENT_ELIGIBLE_TYPES constant
- Test isParentEligibleType() with eligible and non-eligible types
- Test canBeParent() with various org states
- Test canHaveParent() with children, parents, and type checks

15 tests passing, 100% coverage of helper functions."
```

---

## Phase 2: Core Components (Days 2-3)

### Task 6: Create HierarchyBreadcrumb component (write failing test)

**Files:**
- Create: `src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx`

**Step 1: Write failing test**

```typescript
// src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HierarchyBreadcrumb } from "../HierarchyBreadcrumb";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("HierarchyBreadcrumb", () => {
  it("renders nothing for parent organization", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      parent_organization_id: null,
      child_branch_count: 8,
    };

    renderWithRouter(<HierarchyBreadcrumb organization={org} />);

    // Should not render breadcrumb for parent orgs
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders breadcrumb for child organization", () => {
    const org: OrganizationWithHierarchy = {
      id: "2",
      name: "Sysco Denver",
      organization_type: "distributor",
      parent_organization_id: "1",
      parent_organization_name: "Sysco Corporate",
    };

    renderWithRouter(<HierarchyBreadcrumb organization={org} />);

    // Should show navigation breadcrumb
    expect(screen.getByRole("navigation")).toBeInTheDocument();

    // Should show parent as link
    const parentLink = screen.getByRole("link", { name: "Sysco Corporate" });
    expect(parentLink).toHaveAttribute("href", "/organizations/1");

    // Should show current org as text (not link)
    expect(screen.getByText("Sysco Denver")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sysco Denver" })).not.toBeInTheDocument();
  });

  it("shows Organizations link at start", () => {
    const org: OrganizationWithHierarchy = {
      id: "2",
      name: "Sysco Denver",
      organization_type: "distributor",
      parent_organization_id: "1",
      parent_organization_name: "Sysco Corporate",
    };

    renderWithRouter(<HierarchyBreadcrumb organization={org} />);

    const orgsLink = screen.getByRole("link", { name: "Organizations" });
    expect(orgsLink).toHaveAttribute("href", "/organizations");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx
```

Expected: FAIL - `Cannot find module '../HierarchyBreadcrumb'`

**Step 3: Commit failing test**

```bash
git add src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx
git commit -m "test(orgs): add failing tests for HierarchyBreadcrumb component

RED: Tests fail - component doesn't exist yet.

- Test renders nothing for parent orgs
- Test renders breadcrumb for child orgs with parent link
- Test shows Organizations link at start
- Test current org not clickable

TDD: Write test first, implement next."
```

---

### Task 7: Create HierarchyBreadcrumb component (implement)

**Files:**
- Create: `src/atomic-crm/organizations/HierarchyBreadcrumb.tsx`

**Step 1: Create component file**

```typescript
// src/atomic-crm/organizations/HierarchyBreadcrumb.tsx

import { Link } from "react-router-dom";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface HierarchyBreadcrumbProps {
  organization: OrganizationWithHierarchy;
}

/**
 * Breadcrumb navigation showing organization hierarchy.
 * Only displays for child organizations with a parent.
 */
export function HierarchyBreadcrumb({ organization }: HierarchyBreadcrumbProps) {
  // Don't render for parent orgs (no parent_organization_id)
  if (!organization.parent_organization_id) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/organizations">Organizations</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/organizations/${organization.parent_organization_id}`}>
              {organization.parent_organization_name || "Parent Organization"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage>{organization.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

**Step 2: Run tests to verify they pass**

```bash
npm test -- src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx
```

Expected: GREEN - All 3 tests pass

**Step 3: Commit implementation**

```bash
git add src/atomic-crm/organizations/HierarchyBreadcrumb.tsx
git commit -m "feat(orgs): implement HierarchyBreadcrumb component

GREEN: Tests pass - breadcrumb renders for child orgs.

- Renders navigation breadcrumb for child organizations
- Shows Organizations > Parent > Current hierarchy
- Parent name is clickable link to parent detail page
- Current org shown as text (not link)
- Returns null for parent orgs (no breadcrumb needed)

Uses shadcn/ui Breadcrumb components for consistent styling."
```

---

### Task 8: Create BranchLocationsSection component (write failing test)

**Files:**
- Create: `src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx`

**Step 1: Write failing test**

```typescript
// src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestMemoryRouter } from "@/test-utils";
import { BranchLocationsSection } from "../BranchLocationsSection";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

// Mock useDataProvider
const mockGetList = vi.fn();
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useDataProvider: () => ({
      getList: mockGetList,
    }),
  };
});

describe("BranchLocationsSection", () => {
  beforeEach(() => {
    mockGetList.mockReset();
  });

  it("renders nothing when org has no children", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Denver",
      organization_type: "distributor",
      child_branch_count: 0,
    };

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.queryByText(/Branch Locations/)).not.toBeInTheDocument();
  });

  it("renders section header with branch count", async () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 8,
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 8,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByText("Branch Locations (8)")).toBeInTheDocument();
  });

  it("fetches and displays branch organizations", async () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 3,
    };

    const branches = [
      {
        id: "2",
        name: "Sysco Denver",
        city: "Denver",
        nb_contacts: 12,
        nb_opportunities: 5,
      },
      {
        id: "3",
        name: "Sysco Colorado Springs",
        city: "Colorado Springs",
        nb_contacts: 8,
        nb_opportunities: 3,
      },
    ];

    mockGetList.mockResolvedValue({
      data: branches,
      total: 2,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sysco Denver")).toBeInTheDocument();
      expect(screen.getByText("Sysco Colorado Springs")).toBeInTheDocument();
      expect(screen.getByText("Denver")).toBeInTheDocument();
      expect(screen.getByText("Colorado Springs")).toBeInTheDocument();
    });

    // Verify getList was called with correct filter
    expect(mockGetList).toHaveBeenCalledWith("organizations", {
      filter: { parent_organization_id: "1" },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    });
  });

  it("shows Add Branch button", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 8,
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Add Branch/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx
```

Expected: FAIL - `Cannot find module '../BranchLocationsSection'`

**Step 3: Commit failing test**

```bash
git add src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx
git commit -m "test(orgs): add failing tests for BranchLocationsSection

RED: Tests fail - component doesn't exist yet.

- Test renders nothing when no children
- Test renders section header with count
- Test fetches and displays branch table
- Test shows Add Branch button
- Mock useDataProvider for controlled testing

TDD: Write test first, implement next."
```

---

### Task 9: Create BranchLocationsSection component (implement)

**Files:**
- Create: `src/atomic-crm/organizations/BranchLocationsSection.tsx`

**Step 1: Create component file**

```typescript
// src/atomic-crm/organizations/BranchLocationsSection.tsx

import { useDataProvider, Link } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

interface BranchLocationsSectionProps {
  organization: OrganizationWithHierarchy;
}

/**
 * Displays list of branch locations for a parent organization.
 * Only renders if organization has children (child_branch_count > 0).
 */
export function BranchLocationsSection({
  organization,
}: BranchLocationsSectionProps) {
  const dataProvider = useDataProvider();

  // Don't render if no branches
  if (!organization.child_branch_count || organization.child_branch_count === 0) {
    return null;
  }

  // Fetch branch organizations
  const { data: branches, isLoading } = useQuery({
    queryKey: ["organizations", "branches", organization.id],
    queryFn: () =>
      dataProvider.getList("organizations", {
        filter: { parent_organization_id: organization.id },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "name", order: "ASC" },
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Branch Locations ({organization.child_branch_count})
        </h3>
        <Button asChild size="sm" variant="outline">
          <Link
            to="/organizations/create"
            state={{ parent_id: organization.id }}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Branch Location
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading branches...</div>
      ) : branches && branches.data.length > 0 ? (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium">City</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Contacts</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Opportunities</th>
              </tr>
            </thead>
            <tbody>
              {branches.data.map((branch: any) => (
                <tr key={branch.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link to={`/organizations/${branch.id}`} className="text-blue-600 hover:underline">
                      {branch.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm">{branch.city || "-"}</td>
                  <td className="px-4 py-2 text-right text-sm">{branch.nb_contacts || 0}</td>
                  <td className="px-4 py-2 text-right text-sm">{branch.nb_opportunities || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">No branch locations found.</div>
      )}
    </div>
  );
}
```

**Step 2: Run tests to verify they pass**

```bash
npm test -- src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx
```

Expected: GREEN - All 4 tests pass

**Step 3: Commit implementation**

```bash
git add src/atomic-crm/organizations/BranchLocationsSection.tsx
git commit -m "feat(orgs): implement BranchLocationsSection component

GREEN: Tests pass - branch table displays correctly.

- Fetches branches using parent_organization_id filter
- Displays table with Name, City, Contacts, Opportunities columns
- Branch names link to detail pages
- Add Branch button pre-fills parent in create form
- Returns null when child_branch_count is 0
- Shows loading and empty states

Uses shadcn/ui components and React Query for data fetching."
```

---

### Task 10: Create ParentOrganizationSection component (write failing test)

**Files:**
- Create: `src/atomic-crm/organizations/__tests__/ParentOrganizationSection.test.tsx`

**Step 1: Write failing test**

```typescript
// src/atomic-crm/organizations/__tests__/ParentOrganizationSection.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestMemoryRouter } from "@/test-utils";
import { ParentOrganizationSection } from "../ParentOrganizationSection";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

// Mock useDataProvider
const mockGetList = vi.fn();
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useDataProvider: () => ({
      getList: mockGetList,
    }),
  };
});

describe("ParentOrganizationSection", () => {
  beforeEach(() => {
    mockGetList.mockReset();
  });

  it("renders nothing when org has no parent", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      parent_organization_id: null,
    };

    render(
      <TestMemoryRouter>
        <ParentOrganizationSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.queryByText(/Part of Organization/)).not.toBeInTheDocument();
  });

  it("renders parent link", () => {
    const org: OrganizationWithHierarchy = {
      id: "2",
      name: "Sysco Denver",
      organization_type: "distributor",
      parent_organization_id: "1",
      parent_organization_name: "Sysco Corporate",
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestMemoryRouter>
        <ParentOrganizationSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByText("Part of Organization")).toBeInTheDocument();

    const parentLink = screen.getByRole("link", { name: /Sysco Corporate/i });
    expect(parentLink).toHaveAttribute("href", "/organizations/1");
  });

  it("fetches and displays sister branches", async () => {
    const org: OrganizationWithHierarchy = {
      id: "2",
      name: "Sysco Denver",
      organization_type: "distributor",
      parent_organization_id: "1",
      parent_organization_name: "Sysco Corporate",
    };

    const sisters = [
      { id: "3", name: "Sysco Colorado Springs" },
      { id: "4", name: "Sysco Pueblo" },
      { id: "5", name: "Sysco Fort Collins" },
    ];

    mockGetList.mockResolvedValue({
      data: sisters,
      total: 3,
    });

    render(
      <TestMemoryRouter>
        <ParentOrganizationSection organization={org} />
      </TestMemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sister Branches (3)")).toBeInTheDocument();
      expect(screen.getByText("Sysco Colorado Springs")).toBeInTheDocument();
      expect(screen.getByText("Sysco Pueblo")).toBeInTheDocument();
      expect(screen.getByText("Sysco Fort Collins")).toBeInTheDocument();
    });

    // Verify getList called with correct filter (same parent, exclude self)
    expect(mockGetList).toHaveBeenCalledWith("organizations", {
      filter: {
        parent_organization_id: "1",
        id: { $ne: "2" },
      },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "name", order: "ASC" },
    });
  });

  it("shows Change Parent and Remove Parent buttons", () => {
    const org: OrganizationWithHierarchy = {
      id: "2",
      name: "Sysco Denver",
      organization_type: "distributor",
      parent_organization_id: "1",
      parent_organization_name: "Sysco Corporate",
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestMemoryRouter>
        <ParentOrganizationSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Change Parent/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove Parent/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/ParentOrganizationSection.test.tsx
```

Expected: FAIL - `Cannot find module '../ParentOrganizationSection'`

**Step 3: Commit failing test**

```bash
git add src/atomic-crm/organizations/__tests__/ParentOrganizationSection.test.tsx
git commit -m "test(orgs): add failing tests for ParentOrganizationSection

RED: Tests fail - component doesn't exist yet.

- Test renders nothing when no parent
- Test renders parent link
- Test fetches sister branches (same parent, exclude self)
- Test shows Change Parent and Remove Parent buttons

TDD: Write test first, implement next."
```

---

Due to length constraints, I'll continue with a summary of remaining tasks. The pattern continues with:

**Phase 2 (continued):**
- Task 11-12: Implement ParentOrganizationSection (TDD)
- Task 13-14: Create ParentOrganizationInput form field (TDD)

**Phase 3: Integration**
- Task 15-16: Update Show.tsx with breadcrumb + sections
- Task 17-18: Update Edit/Create with parent input
- Task 19-20: Update List.tsx with columns
- Task 21-22: Add filters to List.tsx
- Task 23: Add pre-delete validation

**Phase 4: E2E Testing**
- Tasks 24-29: Six E2E test scenarios from design doc

Would you like me to continue writing the complete plan with all remaining tasks, or should I proceed with this abbreviated version?
