# Organization Hierarchies - Design Document

**Date:** November 10, 2025
**Status:** 🔵 APPROVED - Ready for Implementation
**Estimated Effort:** 6 days
**Priority:** HIGH - Critical for managing multi-branch distributors
**Industry Pattern:** Pipedrive parent-child relationship model

---

## Executive Summary

This design adds parent-child organization hierarchies to Atomic CRM, enabling management of multi-branch distributors (Sysco, GFS, US Foods) and restaurant chains. The implementation follows Pipedrive's proven patterns while maintaining simplicity through YAGNI principles.

**The Problem:** Sales reps manage relationships with distributor branches (Sysco Denver, Sysco Colorado Springs) but cannot see they belong to the same parent company. Finding all Sysco branches requires manual searching and tribal knowledge.

**The Solution:** Simple two-level parent-child hierarchies with:
- Visual breadcrumb navigation showing organizational structure
- Automatic rollup counts (branches, contacts, opportunities)
- List filters for finding all branches or parents
- Dedicated management section on detail pages

**Expected Impact:**
- **Faster branch lookup**: See all 8 Sysco branches from parent detail page
- **Better data quality**: Prevent duplicate parent entries through relationship linking
- **Clearer reporting**: Filter opportunities by "All Sysco branches"
- **Improved context**: Understand relationships at a glance

---

## Business Context

### Current Workflow (Before)

Sales rep needs to find Sysco branches:
1. Navigate to Organizations list
2. Search for "Sysco" manually
3. Scan results to identify which are branches vs. parent
4. Open multiple tabs to compare branch details
5. Rely on memory or notes to know branch relationships

**Total: 5+ steps, multiple page loads, error-prone**

### New Workflow (After)

Sales rep needs to find Sysco branches:
1. Navigate to Sysco Corporate organization
2. See "Branch Locations (8)" section with full table
3. Click any branch to view details
4. Breadcrumb shows parent context

**Total: 3 steps, clear hierarchy, zero guesswork**

### Industry Research: Pipedrive Pattern

Pipedrive uses a **relationship-based model** with four types:
- **Parent**: Corporate HQ or main entity
- **Daughter (Child)**: Branch or subsidiary
- **Sister**: Siblings with shared parent (computed automatically)
- **Related**: Non-hierarchical associations (partnerships, competitors)

**Key Features:**
- Relationships defined explicitly between Organization records
- Detail view shows "Related Organizations" panel
- Org-chart visualizations available via integrations
- Relationships cannot be edited—only created or deleted (audit-safe)
- No automatic data aggregation from child to parent

**Our Approach:**
- Implement Parent-Child only (YAGNI: skip Sister/Related for MVP)
- Sister relationships computed automatically (shared parent query)
- Basic rollup counts (branches, contacts, opportunities)
- Two-level maximum depth (prevents complexity)

---

## Design Details

### 1. Data Model

**Existing Foundation** (already in database):
```sql
-- organizations table already has:
parent_organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL
```

**New Validation Rules:**

```typescript
// Two-level maximum depth validation
const canHaveParent = (org: Organization) => {
  return !org.parent_organization_id; // Only standalone orgs can become children
};

// Type restrictions: only these types can be parents
const PARENT_ELIGIBLE_TYPES = ['distributor', 'customer', 'principal'];

// Circular reference prevention
const isNotCircular = (childId: number, parentId: number) => {
  return childId !== parentId; // Can't be your own parent
};
```

**Business Rules:**

| Rule | Enforcement | Reason |
|------|-------------|--------|
| Two-level maximum | Application validation | Prevents UI complexity, matches real-world distributor structures |
| Type restrictions | Zod schema | Only distributor/customer/principal can be parents (prospects don't have branches) |
| No grandchildren | Application validation | Branch cannot have sub-branches |
| No circular references | Database + application | Prevents A → B → A loops |
| Block parent deletion | Database trigger | Prevents accidental hierarchy destruction |

### 2. Database Changes

**Migration 1: Update organizations_summary view**

```sql
-- File: supabase/migrations/YYYYMMDD_add_organization_hierarchy_rollups.sql

DROP VIEW IF EXISTS organizations_summary;

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

GRANT SELECT ON organizations_summary TO authenticated;
```

**Migration 2: Add deletion protection trigger**

```sql
-- Prevent deleting parent orgs with children
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

CREATE TRIGGER check_parent_deletion
  BEFORE DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_parent_org_deletion();
```

**Performance Considerations:**

Existing indexes already support hierarchy queries:
- `idx_companies_parent_company_id` on `parent_organization_id`
- `idx_organizations_parent_company_id` on `parent_organization_id WHERE deleted_at IS NULL`

No additional indexes required for MVP.

### 3. UI Components - Organization Detail Page

**A) Breadcrumb Navigation**

At the top of any organization detail view:

```
For parent orgs:
┌─────────────────────────────────┐
│  Organizations > Sysco Corporate│
└─────────────────────────────────┘

For child branches:
┌────────────────────────────────────────────┐
│  Organizations > Sysco Corporate > Sysco Denver │
│                  ↑ clickable     ↑ current     │
└────────────────────────────────────────────┘
```

**Implementation:**
- Component: `HierarchyBreadcrumb.tsx`
- Location: Top of Show/Edit views
- Navigation: Each parent level is clickable link
- Styling: Current org bold, parents normal weight

**B) Branch Locations Section (Parent View)**

When viewing a parent organization:

```
┌─────────────────────────────────────────────────┐
│ Branch Locations (8)                            │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Name              City            Contacts  Opps│
│ Sysco Denver      Denver          12        5   │
│ Sysco Colo Spgs   Colorado Spgs  8         3   │
│ Sysco Pueblo      Pueblo          5         2   │
│ ... (5 more)                                    │
│                                                 │
│ [+ Add Branch Location]                         │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Component: `BranchLocationsSection.tsx`
- Shows: Table of child organizations
- Columns: Name (link), City, Contact count, Opportunity count
- Action: "Add Branch Location" → Create form with pre-filled parent
- Empty state: "No branch locations yet. Add one to get started."

**C) Parent Organization Section (Child View)**

When viewing a child branch:

```
┌─────────────────────────────────────────────────┐
│ Part of Organization                            │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Parent: Sysco Corporate [View →]               │
│                                                 │
│ Sister Branches (7):                            │
│ • Sysco Colorado Springs [View →]              │
│ • Sysco Pueblo [View →]                         │
│ • Sysco Fort Collins [View →]                  │
│ • ... (4 more) [Show all →]                     │
│                                                 │
│ [Change Parent] [Remove Parent]                 │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Component: `ParentOrganizationSection.tsx`
- Shows: Parent link + first 3 sister branches
- Sister query: `SELECT * FROM organizations WHERE parent_organization_id = :parent_id AND id != :current_id LIMIT 3`
- Actions: Change parent (opens Edit), Remove parent (confirmation dialog)

### 4. UI Components - Organizations List View

**A) New Columns**

Add two columns to Organizations table:

| Name | Type | Parent Org | # Branches | Priority |
|------|------|------------|------------|----------|
| Sysco Corporate | Distributor | - | 8 | A |
| Sysco Denver | Distributor | Sysco Corporate | - | B |
| US Foods Corp | Distributor | - | 12 | A |

**Column Specifications:**

**"Parent Organization"** column:
- Type: Reference field (clickable link)
- Shows: Parent name or "-" for standalone orgs
- Sortable: Alphabetically by parent name
- Width: 200px

**"# Branches"** column:
- Type: Numeric
- Shows: Count for parents, "-" for children/standalone
- Sortable: Numerically
- Click count: Filters list to show those branches
- Width: 100px

**B) New Filters**

Add to existing filter panel:

**"Hierarchy Type"** (radio buttons):
```
○ All Organizations (default)
○ Parent Organizations Only
○ Branch Locations Only
○ Standalone Only
```

**"Parent Organization"** (autocomplete dropdown):
```
[Search for parent organization...]
  • Sysco Corporate (8 branches)
  • US Foods Corp (12 branches)
  • Restaurant ABC (3 locations)
```

**"Has Branches"** (checkbox):
```
☐ Show only organizations with branches
```

**Filter Logic:**

| Filter Selection | SQL WHERE Clause |
|-----------------|------------------|
| Parent Organizations Only | `child_branch_count > 0` |
| Branch Locations Only | `parent_organization_id IS NOT NULL` |
| Standalone Only | `parent_organization_id IS NULL AND child_branch_count = 0` |
| Parent: Sysco Corporate | `parent_organization_id = :sysco_id` |
| Has Branches (checked) | `child_branch_count > 0` |

### 5. Creation & Editing Workflows

**A) Creating Organizations with Parent**

Add "Parent Organization" field to Create form:

```
┌─────────────────────────────────────────────────┐
│ Create Organization                             │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Name: [Sysco Denver________________] *          │
│                                                 │
│ Organization Type: [Distributor ▼] *            │
│                                                 │
│ Parent Organization: (optional)                 │
│ [Search for parent organization...___________]  │
│ └─ Shows only parent-eligible orgs             │
│    (distributor, customer, principal)          │
│                                                 │
│ Priority: [B ▼]                                 │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Component: `ParentOrganizationInput.tsx`
- Field type: ReferenceInput with AutocompleteInput
- Filter: Only show orgs without parents + matching types
- Validation: Check parent doesn't have parent (async)

**B) Linking Existing Organizations**

Same field appears in Edit form:

```
┌─────────────────────────────────────────────────┐
│ Edit Organization - Sysco Denver                │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Parent Organization:                            │
│ [None________________________] ▼                │
│                                                 │
│ → Search: [Sysco Corp____________]              │
│   • Sysco Corporate (Distributor)               │
│   • US Foods Corp (Distributor)                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Unlinking:**
- Clear field value → removes parent relationship
- Save → organization becomes standalone

**C) Deletion Protection**

When attempting to delete parent with branches:

```
┌─────────────────────────────────────────────────┐
│ ⚠️  Cannot Delete Organization                   │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Sysco Corporate cannot be deleted because it   │
│ has 8 branch locations.                         │
│                                                 │
│ To delete this organization:                    │
│ 1. Remove parent relationship from all branches │
│    (or delete branches individually)            │
│ 2. Try deleting again                           │
│                                                 │
│ [View Branches] [Cancel]                        │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Pre-delete check: `if (org.child_branch_count > 0) throw error`
- Error modal: Show actionable guidance
- "View Branches" → Navigate to filtered list: `?filter={"parent_id": <org_id>}`

### 6. Validation Rules

**Zod Schema Updates:**

```typescript
// src/atomic-crm/validation/organizations.ts

export const organizationSchema = z.object({
  // ... existing fields ...

  parent_id: z.union([z.string(), z.number()])
    .optional()
    .nullable()
    .refine(async (parentId, ctx) => {
      if (!parentId) return true;

      // Check current org type is eligible
      const currentType = ctx.parent?.organization_type;
      if (!PARENT_ELIGIBLE_TYPES.includes(currentType)) {
        throw new Error("Only distributor, customer, or principal organizations can have a parent");
      }

      // Fetch parent to check if it has a parent (no grandchildren)
      const parent = await fetchOrganization(parentId);
      if (parent.parent_organization_id) {
        return false;
      }
      return true;
    }, {
      message: "Branches cannot have their own branches. Select a parent organization without a parent."
    })
    .refine((parentId, ctx) => {
      // Prevent self-reference
      const currentId = ctx.parent?.id;
      return !currentId || parentId !== currentId;
    }, {
      message: "Organization cannot be its own parent"
    }),
});

// Type eligibility
export const PARENT_ELIGIBLE_TYPES: OrganizationType[] = [
  'distributor',
  'customer',
  'principal'
];

export function canBeParent(org: Organization): boolean {
  return PARENT_ELIGIBLE_TYPES.includes(org.organization_type) &&
         !org.parent_organization_id; // Parents can't have parents
}

export function canHaveParent(org: Organization): boolean {
  return PARENT_ELIGIBLE_TYPES.includes(org.organization_type) &&
         !org.parent_organization_id && // No existing parent
         (org.child_branch_count === 0 || org.child_branch_count === undefined); // No children
}
```

**Validation Matrix:**

| Scenario | Valid? | Error Message |
|----------|--------|---------------|
| Distributor → Distributor | ✅ | - |
| Customer → Customer | ✅ | - |
| Principal → Principal | ✅ | - |
| Prospect → Distributor | ❌ | "Only distributor, customer, or principal organizations can have a parent" |
| Branch → Branch | ❌ | "Branches cannot have their own branches" |
| Org → Self | ❌ | "Organization cannot be its own parent" |
| Parent with children → Become child | ❌ | "Remove branches before setting a parent" |

### 7. Contact & Opportunity Ownership

**Policy: Strict Separation**

Contacts and opportunities belong ONLY to their specific branch organization. They do NOT roll up to the parent.

**Rationale:**
- Reflects real-world relationships (you know "Joe at Sysco Denver", not "Joe at Sysco in general")
- Keeps data model simple
- Avoids ambiguous ownership
- Use reporting/filters to see "all Sysco contacts" when needed

**Implementation:**
- No changes to contacts/opportunities tables
- Parent detail page shows rollup COUNTS only (not actual records)
- To view all branch contacts: Use list filter "Parent: Sysco Corporate" on Contacts list

---

## Component Architecture

### New Components

```
src/atomic-crm/organizations/
  ├── HierarchyBreadcrumb.tsx          (Breadcrumb navigation)
  ├── BranchLocationsSection.tsx       (Parent view: list of branches)
  ├── ParentOrganizationSection.tsx    (Child view: parent + sisters)
  ├── ParentOrganizationInput.tsx      (Form field with validation)
  └── __tests__/
      ├── HierarchyBreadcrumb.test.tsx
      ├── BranchLocationsSection.test.tsx
      ├── ParentOrganizationSection.test.tsx
      └── ParentOrganizationInput.test.tsx
```

### Updated Components

```
src/atomic-crm/organizations/
  ├── Show.tsx                 (Add HierarchyBreadcrumb + hierarchy sections)
  ├── Edit.tsx                 (Add ParentOrganizationInput field)
  ├── Create.tsx               (Add ParentOrganizationInput field)
  ├── List.tsx                 (Add columns: Parent Org, # Branches + filters)
  └── OrganizationInputs.tsx   (Add parent input to form)
```

### Component Hierarchy

```typescript
<OrganizationShow>
  <HierarchyBreadcrumb organization={org} />

  {/* Existing sections */}
  <BasicInfoSection />
  <ContactsSection />
  <OpportunitiesSection />

  {/* New hierarchy sections */}
  {org.child_branch_count > 0 && (
    <BranchLocationsSection organization={org} />
  )}

  {org.parent_organization_id && (
    <ParentOrganizationSection organization={org} />
  )}
</OrganizationShow>
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**File: `src/atomic-crm/organizations/__tests__/HierarchyBreadcrumb.test.tsx`**

Test cases:
1. ✅ Renders parent → child navigation for branch org
2. ✅ Parent link is clickable and navigates correctly
3. ✅ Shows single level for parent orgs (no breadcrumb)
4. ✅ Current org is bold, parents are normal weight
5. ✅ Handles orgs without parent gracefully

**File: `src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx`**

Test cases:
1. ✅ Displays branch table with correct columns
2. ✅ Shows accurate branch count in header
3. ✅ "Add Branch" button present and functional
4. ✅ Branch rows are clickable (navigate to branch detail)
5. ✅ Empty state shows when no branches exist
6. ✅ Sorts by name by default

**File: `src/atomic-crm/organizations/__tests__/ParentOrganizationSection.test.tsx`**

Test cases:
1. ✅ Shows parent link when org has parent
2. ✅ Displays first 3 sister branches
3. ✅ "Show all" link appears when >3 sisters
4. ✅ "Change Parent" and "Remove Parent" buttons present
5. ✅ Sister branches computed correctly (shared parent)

**File: `src/atomic-crm/organizations/__tests__/ParentOrganizationInput.test.tsx`**

Test cases:
1. ✅ Only shows parent-eligible org types in dropdown
2. ✅ Filters out orgs that already have parents (no grandchildren)
3. ✅ Validates against self-reference
4. ✅ Shows error message for invalid selections
5. ✅ Allows clearing parent (set to null)

**File: `src/atomic-crm/validation/__tests__/organizations.test.ts`**

Test cases:
1. ✅ Two-level depth enforcement (no grandchildren)
2. ✅ Type restrictions (only distributor/customer/principal)
3. ✅ Circular reference prevention
4. ✅ Self-reference prevention
5. ✅ Parent with children cannot become child

**Target Coverage:** 80%+ for new components

### E2E Tests (Playwright)

**File: `tests/e2e/organization-hierarchies.spec.ts`**

**Test 1: Create distributor with parent relationship**
```typescript
test('create distributor with parent relationship', async ({ page }) => {
  await page.goto('/organizations/create');

  // Fill form
  await page.fill('input[name="name"]', 'Sysco Denver');
  await page.selectOption('select[name="organization_type"]', 'distributor');

  // Search and select parent
  await page.fill('input[name="parent_id"]', 'Sysco Corporate');
  await page.click('text=Sysco Corporate (Distributor)');

  // Submit
  await page.click('button[type="submit"]');

  // Verify breadcrumb
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Sysco Corporate');
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Sysco Denver');
});
```

**Test 2: View parent organization with branches**
```typescript
test('view parent organization with branches', async ({ page }) => {
  await page.goto('/organizations/1'); // Sysco Corporate

  // Verify "Branch Locations" section exists
  await expect(page.locator('h3:has-text("Branch Locations")')).toBeVisible();

  // Verify branch count
  await expect(page.locator('h3:has-text("Branch Locations (8)")')).toBeVisible();

  // Verify branch table has rows
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(8);

  // Click first branch
  await page.click('table tbody tr:first-child a');

  // Verify navigates to branch detail
  await expect(page).toHaveURL(/\/organizations\/\d+/);
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Sysco Corporate');
});
```

**Test 3: Cannot delete parent with branches**
```typescript
test('cannot delete parent with branches', async ({ page }) => {
  await page.goto('/organizations/1'); // Sysco Corporate with 8 branches

  // Click delete button
  await page.click('button:has-text("Delete")');

  // Verify error modal appears
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('dialog')).toContainText('Cannot Delete Organization');
  await expect(page.locator('dialog')).toContainText('8 branch locations');

  // Click "View Branches"
  await page.click('dialog button:has-text("View Branches")');

  // Verify navigates to filtered list
  await expect(page).toHaveURL(/\/organizations\?filter=/);
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(8);
});
```

**Test 4: Filter organizations by parent**
```typescript
test('filter organizations by parent', async ({ page }) => {
  await page.goto('/organizations');

  // Open filters
  await page.click('button:has-text("Filters")');

  // Select parent organization
  await page.fill('input[name="parent_id"]', 'Sysco Corporate');
  await page.click('text=Sysco Corporate (8 branches)');

  // Apply filter
  await page.click('button:has-text("Apply")');

  // Verify list shows only Sysco branches
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(8);

  // Verify parent is NOT in list
  await expect(page.locator('table')).not.toContainText('Sysco Corporate');

  // Verify all rows show parent in column
  for (let i = 0; i < 8; i++) {
    await expect(rows.nth(i).locator('td:nth-child(3)')).toContainText('Sysco Corporate');
  }
});
```

**Test 5: Link existing organization as branch**
```typescript
test('link existing organization as branch', async ({ page }) => {
  // Create standalone org first
  await page.goto('/organizations/create');
  await page.fill('input[name="name"]', 'Sysco Phoenix');
  await page.selectOption('select[name="organization_type"]', 'distributor');
  await page.click('button[type="submit"]');

  const orgUrl = page.url();
  const orgId = orgUrl.match(/\/organizations\/(\d+)/)[1];

  // Edit to add parent
  await page.goto(`/organizations/${orgId}/edit`);
  await page.fill('input[name="parent_id"]', 'Sysco Corporate');
  await page.click('text=Sysco Corporate (Distributor)');
  await page.click('button[type="submit"]');

  // Verify breadcrumb appears
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Sysco Corporate');
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Sysco Phoenix');

  // Verify parent org now shows 9 branches
  await page.goto('/organizations/1');
  await expect(page.locator('h3:has-text("Branch Locations (9)")')).toBeVisible();
});
```

**Test 6: Validation prevents grandchildren**
```typescript
test('validation prevents grandchildren', async ({ page }) => {
  await page.goto('/organizations/create');

  await page.fill('input[name="name"]', 'Sysco Denver North');
  await page.selectOption('select[name="organization_type"]', 'distributor');

  // Try to select branch (not parent) as parent
  await page.fill('input[name="parent_id"]', 'Sysco Denver');

  // Verify dropdown is empty or shows error
  await expect(page.locator('text=Sysco Denver')).toHaveCount(0);
  // OR verify validation error appears
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Branches cannot have their own branches')).toBeVisible();
});
```

---

## Implementation Plan

### Phase 1: Database & Validation (1 day)

**Day 1:**
- ✅ Write migration for organizations_summary view update
- ✅ Write migration for deletion protection trigger
- ✅ Test migrations locally (`npm run db:local:reset`)
- ✅ Update Zod schema in `validation/organizations.ts`
- ✅ Add helper functions: `canBeParent()`, `canHaveParent()`
- ✅ Write validation unit tests
- ✅ Update `types.ts` with new computed fields

**Deliverables:**
- `supabase/migrations/YYYYMMDD_add_organization_hierarchy_rollups.sql`
- `supabase/migrations/YYYYMMDD_add_organization_deletion_protection.sql`
- Updated `src/atomic-crm/validation/organizations.ts`
- 10+ validation tests passing

### Phase 2: Core Components (2 days)

**Day 2: Breadcrumb & Parent Section**
- ✅ Create `HierarchyBreadcrumb.tsx` component
- ✅ Create `ParentOrganizationSection.tsx` component
- ✅ Wire up data fetching (parent + sisters query)
- ✅ Write unit tests for both components
- ✅ Test with real data (Sysco example)

**Day 3: Branch Section & Input**
- ✅ Create `BranchLocationsSection.tsx` component
- ✅ Create `ParentOrganizationInput.tsx` form field
- ✅ Implement autocomplete with filtering logic
- ✅ Add "Add Branch" workflow
- ✅ Write unit tests for both components

**Deliverables:**
- 4 new components with full test coverage
- Storybook stories (optional, for design review)

### Phase 3: Integration (1.5 days)

**Day 4: Update Existing Components**
- ✅ Update `Show.tsx` to include breadcrumb + hierarchy sections
- ✅ Update `Edit.tsx` to include ParentOrganizationInput
- ✅ Update `Create.tsx` to include ParentOrganizationInput
- ✅ Update `List.tsx` to add new columns
- ✅ Update `List.tsx` to add new filters
- ✅ Wire up data provider for new view queries

**Day 5 Morning: Deletion Protection**
- ✅ Add pre-delete validation in data provider
- ✅ Create deletion error modal component
- ✅ Test deletion workflows

**Deliverables:**
- All existing org components updated
- Full CRUD workflows functional
- Deletion protection working

### Phase 4: Testing & Polish (1.5 days)

**Day 5 Afternoon: E2E Tests**
- ✅ Write 6 E2E test scenarios (Playwright)
- ✅ Run E2E suite and fix failures
- ✅ Test on local Supabase with seed data

**Day 6: Polish & Performance**
- ✅ Test on iPad viewport (768px)
  - Touch targets minimum 44x44px
  - Breadcrumb doesn't wrap awkwardly
  - Branch table scrolls horizontally on small screens
- ✅ Performance test with 100+ organizations
  - View renders in <500ms
  - List filter/sort responds in <200ms
- ✅ Review and polish spacing/styling
- ✅ Add loading states and skeletons
- ✅ Test error states (network failure, validation errors)

**Deliverables:**
- Complete E2E test suite passing
- Responsive design verified on iPad
- Performance benchmarks met

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline | Target | Measurement Period |
|--------|----------|--------|-------------------|
| Branch lookup time | 60+ seconds (manual search) | <10 seconds | 7 days |
| Hierarchy adoption | 0% | 70% of multi-branch orgs | 30 days |
| Orphaned branches | Unknown | <5% of branch orgs | 30 days |
| User satisfaction | N/A | 8/10+ rating | 30 days |

**How to measure:**
- **Branch lookup time**: User test with 5 sales reps (find all Sysco branches)
- **Hierarchy adoption**: `SELECT COUNT(*) FROM organizations WHERE parent_organization_id IS NOT NULL`
- **Orphaned branches**: Manual audit + user reports of "should be linked but isn't"
- **User satisfaction**: In-app survey: "Easier to manage multi-branch accounts? 1-10"

### Qualitative Feedback (Goal: 7/10 users agree)

- "I can see all distributor branches at a glance"
- "Finding the right Sysco location is much faster"
- "The parent-child relationships are clear and obvious"

### Technical Metrics

| Metric | Target |
|--------|--------|
| Component render time | <200ms |
| List view filter time | <300ms |
| View query performance | <500ms (with 100+ orgs) |
| Test coverage | 80%+ for new components |

---

## Risks & Mitigations

### Risk 1: Performance Degradation with Large Hierarchies

**Problem:** View with rollup subqueries might be slow with 1000+ organizations and 100+ branches per parent.

**Likelihood:** Medium
**Impact:** High

**Mitigations:**
1. Existing indexes already support parent lookups
2. Use `EXPLAIN ANALYZE` to profile view query
3. If needed: Add composite index on `(parent_organization_id, deleted_at)`
4. If still slow: Convert to materialized view with 5-minute refresh
5. Pagination on branch table (React Admin built-in)

**Monitoring:** Track `organizations_summary` view query time in production logs

### Risk 2: Users Create Incorrect Hierarchies

**Problem:** Sales reps link wrong organizations as parent/child (e.g., "Sysco Denver" as parent of "US Foods Phoenix").

**Likelihood:** Medium
**Impact:** Medium

**Mitigations:**
1. Clear field labels: "Parent Organization (Corporate HQ or main entity)"
2. Autocomplete shows org type: "Sysco Corporate (Distributor)"
3. Admin can fix via Edit form (change/remove parent)
4. Audit report: "Organizations with mismatched parent types"
5. Training: Quick-start guide with screenshots

**Monitoring:** Weekly review of new parent-child relationships for first 30 days

### Risk 3: Deletion Protection Too Strict

**Problem:** Admins need to delete parent with branches (e.g., distributor out of business).

**Likelihood:** Low
**Impact:** Medium

**Mitigations:**
1. Error message provides clear steps to unlink branches first
2. "View Branches" button → quick access to all branches for bulk unlinking
3. If truly needed: Admin can soft-delete parent (deleted_at) without unlinking
4. Future: Add "Force Delete" option for admins with confirmation dialog

**Workaround:** Soft-delete parent keeps record but hides from UI

### Risk 4: Grandchildren Already Exist in Data

**Problem:** Database might already have grandchildren (A → B → C) from manual entry.

**Likelihood:** Low (new system, unlikely existing data has this)
**Impact:** Low

**Mitigations:**
1. Pre-migration audit: `SELECT COUNT(*) FROM organizations o1 JOIN organizations o2 ON o1.parent_organization_id = o2.id WHERE o2.parent_organization_id IS NOT NULL`
2. If found: Generate report for manual cleanup before rollout
3. Validation prevents NEW grandchildren going forward
4. Admin dashboard shows "Data quality issues" with fix actions

**Resolution:** One-time cleanup before feature launch

### Risk 5: Sister Branch Logic Confuses Users

**Problem:** Users don't understand why some branches appear as "sisters" automatically.

**Likelihood:** Low
**Impact:** Low

**Mitigations:**
1. Clear section heading: "Sister Branches (same parent)"
2. Tooltip: "Organizations that share the same parent company"
3. Help docs: Explain hierarchy relationships
4. Training: Include in onboarding materials

**Fallback:** Remove sister section if users find it confusing (can always add later)

---

## Future Enhancements (Post-MVP)

After initial launch and user feedback, consider:

### 1. Related Organizations (Non-Hierarchical)

Add "Related" relationship type for:
- Partnerships (co-packers, shared distributors)
- Competitors in same market
- Acquired companies (historical relationship)

**Implementation:** New `organization_relationships` table with type field

### 2. Org-Chart Visualization

Add visual hierarchy diagram similar to Vizrm for Pipedrive:
- Tree layout showing parent → children
- Color-coded by organization type
- Click nodes to navigate
- Export as PNG/PDF

**Implementation:** Use D3.js or React Flow library

### 3. Bulk Branch Import

Add CSV import for creating multiple branches at once:
- Upload CSV with columns: Branch Name, City, Parent Name
- Auto-match parent by name
- Batch create all branches

**Implementation:** Extend existing CSV import with parent matching logic

### 4. Territory Assignment by Branch

Add territory/region field to organizations:
- Group branches by territory (West, Mountain, etc.)
- Assign sales reps by territory
- Filter/report by territory

**Implementation:** Add `territory` enum field + filters

### 5. Rollup Reporting

Add parent-level reports that aggregate branch data:
- "Sysco Total Pipeline" (sum of all branch opportunities)
- "Branch Performance Comparison" (table showing all branches side-by-side)
- "Corporate Contact Directory" (all contacts across branches)

**Implementation:** New report views with parent filter + aggregation queries

### 6. Multi-Level Hierarchies (3+ Levels)

If user feedback demands deeper hierarchies:
- Allow grandchildren (A → B → C)
- Recursive breadcrumb rendering
- Performance optimization for deep queries

**Implementation:** Remove 2-level restriction, add recursive CTE queries

---

## Appendix A: Industry Research Summary

### Pipedrive Pattern Deep-Dive

**Relationship Types:**
- **Parent**: Corporate HQ or main entity
- **Daughter (Child)**: Branch, subsidiary, or location
- **Sister**: Automatically computed from shared parent
- **Related**: Non-hierarchical association (partnerships, competitors)

**UI Patterns:**
- "Related Organizations" panel on detail page
- Cannot edit relationships—only create or delete (audit-safe)
- Vizrm integration provides org-chart visualization
- No automatic data rollup from child to parent

**Data Model:**
- Relationships stored as explicit links between Organization records
- Each relationship has a type (Parent/Daughter/Sister/Related)
- Relationships cannot form loops (enforced by Pipedrive)

**Our Implementation vs. Pipedrive:**

| Feature | Pipedrive | Our Implementation | Rationale |
|---------|-----------|-------------------|-----------|
| Relationship types | 4 (Parent/Daughter/Sister/Related) | 2 (Parent/Child, Sister computed) | YAGNI: Start simple, add Related later if needed |
| Data rollup | No automatic rollup | Basic counts (branches, contacts, opps) | Show value immediately, expand later |
| Org-chart viz | Via integration | Not in MVP | Nice-to-have, focus on core workflows |
| Depth limit | Unlimited | 2 levels max | Prevents UI complexity, matches real-world |
| Deletion protection | Unknown | Block with guidance | Fail-fast, prevent data loss |

### Other CRM Patterns Reviewed

**HubSpot:**
- Uses "Company Hierarchy" with parent company field
- Shows hierarchy in left sidebar
- Rollup reporting available via custom reports
- No limit on depth

**Salesforce:**
- "Account Hierarchy" with parent account field
- Tree view shows up to 5 levels
- Complex relationship types (direct/indirect parent)
- Heavy enterprise focus

**Monday Sales CRM:**
- Simpler approach: "Parent Account" field only
- No special hierarchy UI
- Relies on board filters to show related accounts

**Our Choice:**
Pipedrive's pattern balances simplicity with power. HubSpot/Salesforce are too complex for pre-launch startup. Monday is too simple (no rollup metrics). Pipedrive's explicit relationships + panel-based UI fits our needs perfectly.

---

## Appendix B: Database Schema Reference

### organizations Table (Relevant Fields)

```sql
CREATE TABLE organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  organization_type organization_type DEFAULT 'unknown',
  parent_organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  ...
);

-- Existing indexes:
CREATE INDEX idx_companies_parent_company_id
  ON organizations(parent_organization_id)
  WHERE parent_organization_id IS NOT NULL;

CREATE INDEX idx_organizations_parent_company_id
  ON organizations(parent_organization_id)
  WHERE deleted_at IS NULL;
```

### organizations_summary View (After Migration)

```sql
CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name as parent_organization_name,

  -- NEW: Rollup counts
  child_branch_count INTEGER,
  total_contacts_across_branches INTEGER,
  total_opportunities_across_branches INTEGER,

  -- Existing: Direct counts
  nb_contacts INTEGER,
  nb_opportunities INTEGER,
  ...
FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;
```

---

## Approval & Sign-off

**Reviewed by:**
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] Sales Manager (representing end users)

**Approval Date:** _____________

**Implementation Start Date:** _____________

**Target Completion:** 6 days from start

---

**End of Design Document**
