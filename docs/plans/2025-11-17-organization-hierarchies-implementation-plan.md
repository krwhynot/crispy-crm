# Organization Hierarchies Implementation Plan

**Date:** 2025-11-17
**Status:** Planning
**Priority:** P0 (Blocking - Feature Non-Functional)

## Executive Summary

The underlying schema has the right foundation (self-referencing FK, roll-up view, partial indexes), but the implementation currently makes parent/branch relationships effectively unusable from the UI. Because the create/edit flows write to a fictitious `parent_id` field, no parent selection is ever persisted, so hierarchy data can only be manipulated manually or via SQL. Combined with missing cycle protection and UI-only "rules", the module is "risky" for real-world use: users can still build invalid trees, but cannot reliably build the valid ones intended.

On the presentation side, the Show page surfaces parent links, branch counts, and CTA buttons, yet the create/edit experiences don't respect that model (e.g., the "Add Branch" button does not pre-fill the parent, the dropdown shows every org including the current one, and there is no backend guard against loops). The current experience will confuse users and likely lead to inconsistent data if they resort to direct API calls.

---

## Schema & Data Model Assessment

### Working Well ✅

1. **Self-referencing FK with safe deletion**
   - `organizations.parent_organization_id` is a proper self-FK with `ON DELETE SET NULL`, so deleting a parent won't cascade and branches get orphaned safely
   - Reference: `supabase/migrations/20251018152315_cloud_schema_fresh.sql:1315-1347, 2719-2721`

2. **Performance indexes**
   - Partial indexes already exist for `parent_organization_id`, keeping parent/child queries performant even on large tables
   - Reference: `supabase/migrations/20251018152315_cloud_schema_fresh.sql:2287-2295, 2446-2455`

3. **Precomputed aggregates**
   - `organizations_summary` precomputes `parent_organization_name`, `child_branch_count`, and branch-level rollups, making list/detail pages fast
   - Reference: `supabase/migrations/20251110142654_add_organization_hierarchy_rollups.sql:5-44`

### Issues / Risks ⚠️

1. **❌ CRITICAL: Forms write to wrong field**
   - Forms and validators write to `parent_id`, but no transform ever maps that to `parent_organization_id`, so hierarchy edits never persist
   - **ALL occurrences of `parent_id`:**
     - Forms: `src/atomic-crm/organizations/OrganizationInputs.tsx:10-26`, `src/atomic-crm/organizations/ParentOrganizationInput.tsx:11-28`
     - Tests: `src/atomic-crm/organizations/__tests__/ParentOrganizationInput.test.tsx`, `src/atomic-crm/validation/__tests__/organizations/validation.test.ts`, `src/atomic-crm/validation/__tests__/organizations/edge-cases.test.ts`
     - CSV Import: `OrganizationImportSchema` does NOT include parent field - currently can't import hierarchies
     - Transform: `src/atomic-crm/providers/supabase/services/TransformService.ts:105-128` (no mapping exists)

2. **❌ CRITICAL: Broken parent selector filtering**
   - The parent selector sends `{ organization_type: { $in: … }, parent_organization_id: { $null: true } }`, which the PostgREST data provider doesn't understand, so filtering silently fails and the dropdown includes every organization
   - **Root cause:** MongoDB-style operators instead of PostgREST syntax
   - **Fix location:** `ParentOrganizationInput.tsx` filter prop - must use PostgREST operators that the data provider understands
   - **Note:** Filter registry already includes `parent_organization_id` (filterRegistry.ts:86), so no registry changes needed
   - Reference: `src/atomic-crm/organizations/ParentOrganizationInput.tsx:11-25`

3. **❌ CRITICAL: No cycle protection**
   - There is no database- or API-level constraint preventing self-parenting or cycles—only a UI warning—which means a user can set `parent = self` or `parent = descendant` via `ParentOrganizationSection` or direct API calls
   - **Current state:** Only client-side validation exists (validation/organizations.ts)
   - **Required:** Database trigger with recursive CTE to detect cycles before INSERT/UPDATE
   - References:
     - `supabase/migrations/20251018152315_cloud_schema_fresh.sql:1315-1347`
     - `src/atomic-crm/validation/organizations.ts:74-105`
     - `src/atomic-crm/organizations/ParentOrganizationSection.tsx:66-84`

4. **⚠️ RLS policy consideration**
   - **CRITICAL:** Organizations UPDATE is admin-only (migration 20251116124147_fix_permissive_rls_policies.sql:52-57)
   - Non-admin users CANNOT update `parent_organization_id` via API even after field naming fix
   - **Decision required:** Should non-admin users be able to set parent relationships? If yes, RLS policy must be updated
   - **Current policy:** `USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true)`
   - **Options:**
     - Keep admin-only (safest - prevents unauthorized hierarchy changes)
     - Allow specific fields for non-admins (e.g., parent_organization_id only)
     - Create separate policy for hierarchy updates with additional checks

5. **⚠️ Artificial depth limitation**
   - UI limits parents to organizations without a parent, blocking legitimate multi-level hierarchies (e.g., HQ → region → store) even though the schema could support them
   - Reference: `src/atomic-crm/organizations/ParentOrganizationInput.tsx:14-17`

6. **⚠️ Redundant indexes**
   - Two separate partial indexes on the same column (`idx_companies_parent_company_id` and `idx_organizations_parent_company_id`) create redundant write overhead
   - Reference: `supabase/migrations/20251018152315_cloud_schema_fresh.sql:2287, 2451`

7. **⚠️ Limited roll-up depth**
   - The roll-up view only counts direct children; breadcrumbs and reports can never show more than one ancestor, so hierarchy navigation will not scale beyond a single level
   - Reference: `supabase/migrations/20251110142654_add_organization_hierarchy_rollups.sql:17-35`

### Suggestions

- **Rename** the form/validation field to `parent_organization_id` (or map it during transformation) so React Admin sends the correct column
- **Add server-side protection**: at minimum a `CHECK` to forbid `parent_organization_id = id`, plus a trigger or recursive query to reject cycles and enforce allowed parent types
- **Replace** the `$in`/`$null` filter objects with PostgREST operators (`organization_type@in`, `parent_organization_id@is`) and extend filters to exclude the current record
- **Decide** whether multi-level hierarchies are in scope; if yes, drop the "parent must have no parent" filter and enhance the summary view to surface full ancestry/descendancy
- **Consolidate** the duplicate parent indexes to reduce write overhead

---

## Forms & UX Assessment

### Working Well ✅

1. **Clear form organization**
   - General tab groups critical fields (name, type, parent, account owner) with clear labels and helper text
   - Reference: `src/atomic-crm/organizations/OrganizationGeneralTab.tsx:14-65`

2. **Visual hierarchy navigation**
   - Show view surfaces breadcrumbs, branch tables, and parent/sister sections so users can visually traverse the hierarchy
   - References:
     - `src/atomic-crm/organizations/OrganizationShow.tsx:31-126`
     - `src/atomic-crm/organizations/ParentOrganizationSection.tsx:24-156`

3. **Convenient branch management**
   - The Branch Locations card exposes counts and an "Add Branch Location" CTA close to the table
   - Reference: `src/atomic-crm/organizations/BranchLocationsSection.tsx:74-120`

### Missing / Confusing ⚠️

1. **❌ Parent selection never saves**
   - Selecting a parent never saves because the field is bound to `parent_id`, so users think they set a parent but the database never changes
   - Reference: `src/atomic-crm/organizations/OrganizationInputs.tsx:10-26`

2. **❌ "Add Branch" doesn't pre-fill parent**
   - The "Add Branch Location" link passes `state.record.parent_organization_id`, but `OrganizationCreate` ignores router state, so branches are not pre-filled
   - References:
     - `src/atomic-crm/organizations/BranchLocationsSection.tsx:82-93`
     - `src/atomic-crm/organizations/OrganizationCreate.tsx:27-55`

3. **❌ Self-parenting possible**
   - Parent selector filtering relies on unsupported operators, so invalid candidates (including the record itself) remain selectable, making self-parent loops trivial
   - Reference: `src/atomic-crm/organizations/ParentOrganizationInput.tsx:11-25`

4. **⚠️ UI-only validation**
   - The UI advertises "Maximum 2-level depth" but only enforces it via copy; server mutations can still create deeper trees or cycles
   - Reference: `src/atomic-crm/organizations/slideOverTabs/OrganizationHierarchyTab.tsx:42-71`

5. **⚠️ Mismatched required fields**
   - Required labels do not match backend rules: `organization_type` is marked required in the form but defaults to "unknown" in validation, so the API will silently accept missing data
   - References:
     - `src/atomic-crm/organizations/OrganizationGeneralTab.tsx:35-47`
     - `src/atomic-crm/validation/organizations.ts:93-104`

### Suggestions

- **Bind** the inputs and validation schema directly to `parent_organization_id`, ensuring create/edit/save use the real column name
- **Read** `location.state.record` (or `useLocation`) inside `OrganizationCreate` and merge it into `defaultValues` so "Add Branch" opens with the parent locked in
- **Update** the parent selector filter to PostgREST syntax, add `not.eq` of the current id, and surface validation errors when a user attempts to create a loop
- **Move** the hierarchy warnings into a reusable validation hook or custom mutation guard so the slide-over, edit page, and sidebar actions share the same business rules
- **Align** frontend "required" labels with backend requirements—either make `organization_type` required in Zod or relax the UI copy

---

## Implementation To-Do List

### P0 - Critical (Blocking Feature)

1. **Align field naming**
   - Rename `parent_id` to `parent_organization_id` across forms, validation, and tests
   - Update the `TransformService` (or mutation payload) so Supabase receives the correct column
   - Files to modify:
     - `src/atomic-crm/organizations/OrganizationInputs.tsx`
     - `src/atomic-crm/organizations/ParentOrganizationInput.tsx`
     - `src/atomic-crm/validation/organizations.ts`
     - `src/atomic-crm/providers/supabase/services/TransformService.ts`

2. **Add cycle protection**
   - Create a trigger/RPC (`prevent_organization_cycle`) that rejects self-parenting and ancestor loops
   - Enforce allowed parent types server-side
   - Create new migration: `npx supabase migration new add_organization_cycle_protection`

3. **Fix parent selector filter/mapping**
   - Use supported PostgREST operators (`organization_type@in`, `parent_organization_id@is`)
   - Exclude the current record from parent selection
   - Wire `BranchLocationsSection`'s router state into `OrganizationCreate` defaults
   - Files to modify:
     - `src/atomic-crm/organizations/ParentOrganizationInput.tsx`
     - `src/atomic-crm/organizations/OrganizationCreate.tsx`
     - `src/atomic-crm/organizations/BranchLocationsSection.tsx`

### P1 - High Priority

1. **Decide on hierarchy depth support**
   - Either truly enforce 2 levels or enable multi-level breadcrumbs + queries
   - Adjust the selector/view filters accordingly
   - Document decision in this plan

2. **Extend organizations_summary for deeper hierarchies**
   - Add recursive CTE view to compute ancestor paths
   - Enable breadcrumbs and reports to show deeper hierarchies
   - Create new migration if multi-level support is approved

3. **Consolidate redundant indexes**
   - Drop the redundant `parent_organization_id` index
   - Keep a single partial index with the desired predicate
   - Create migration: `npx supabase migration new consolidate_parent_org_indexes`

### P2 - Nice to Have

1. **Improve UX feedback**
   - Display a chip or read-only field showing the current parent on the edit form
   - Surface inline errors if validation rejects a parent change
   - Files to modify:
     - `src/atomic-crm/organizations/OrganizationGeneralTab.tsx`

2. **Replace full page reloads**
   - Replace `window.location.reload` in `ParentOrganizationSection` with `useRefresh`/query invalidation
   - Avoid full page reloads after removing a parent
   - File to modify:
     - `src/atomic-crm/organizations/ParentOrganizationSection.tsx`

---

## Testing Requirements

### Unit Tests

- [ ] Validation schema tests for `parent_organization_id` field
- [ ] Cycle detection logic tests
- [ ] Transform service tests for parent mapping
- [ ] Filter generation tests for PostgREST operators

### Integration Tests

- [ ] Create organization with parent
- [ ] Edit organization to change parent
- [ ] Remove parent from organization
- [ ] Attempt to create self-parent (should fail)
- [ ] Attempt to create cycle (should fail)
- [ ] "Add Branch" pre-fills parent correctly

### E2E Tests

- [ ] Complete hierarchy creation workflow (parent → branches)
- [ ] Navigate hierarchy via breadcrumbs
- [ ] View branch locations table
- [ ] Edit parent relationship
- [ ] Verify cycle protection in UI

---

## Migration Strategy

### Database Migrations Required

1. **Add cycle protection trigger** (P0)
   ```sql
   -- Function to detect cycles in organization hierarchy
   CREATE OR REPLACE FUNCTION prevent_organization_cycle()
   RETURNS TRIGGER AS $$
   DECLARE
     v_current_parent_id BIGINT;
     v_depth INTEGER := 0;
     v_max_depth INTEGER := 10; -- Prevent infinite loops
   BEGIN
     -- Skip if parent is not being set
     IF NEW.parent_organization_id IS NULL THEN
       RETURN NEW;
     END IF;

     -- Prevent self-parenting
     IF NEW.parent_organization_id = NEW.id THEN
       RAISE EXCEPTION 'Organization cannot be its own parent (ID: %)', NEW.id;
     END IF;

     -- Walk up the parent chain to detect cycles
     v_current_parent_id := NEW.parent_organization_id;

     WHILE v_current_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
       -- If we encounter our own ID while walking up, there's a cycle
       IF v_current_parent_id = NEW.id THEN
         RAISE EXCEPTION 'Cycle detected: Organization % would create a circular parent relationship', NEW.id;
       END IF;

       -- Move up to the next parent
       SELECT parent_organization_id
       INTO v_current_parent_id
       FROM organizations
       WHERE id = v_current_parent_id;

       v_depth := v_depth + 1;
     END LOOP;

     -- If we hit max depth, the hierarchy is too deep (likely a cycle we didn't catch)
     IF v_depth >= v_max_depth THEN
       RAISE EXCEPTION 'Maximum hierarchy depth exceeded (% levels). Possible cycle.', v_max_depth;
     END IF;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Trigger to check for cycles before insert or update
   CREATE TRIGGER check_organization_cycle
     BEFORE INSERT OR UPDATE OF parent_organization_id ON organizations
     FOR EACH ROW
     EXECUTE FUNCTION prevent_organization_cycle();
   ```

   **Algorithm explanation:**
   - Uses iterative parent-walking instead of recursive CTE for better performance
   - Prevents self-parenting as first check (fastest rejection)
   - Walks up parent chain, checking if we encounter the current organization ID
   - Includes max-depth guard (10 levels) to prevent infinite loops from data corruption
   - Only fires when `parent_organization_id` is actually changing (performance optimization)
   - Error messages include organization ID for debugging

2. **Consolidate indexes** (P1)
   ```sql
   DROP INDEX IF EXISTS idx_companies_parent_company_id;
   -- Keep idx_organizations_parent_company_id
   ```

3. **Add ancestor path view** (P1, if multi-level approved)
   ```sql
   CREATE OR REPLACE VIEW organization_ancestry AS
   WITH RECURSIVE ancestors AS (
     -- Base case: all organizations
     SELECT id, parent_organization_id, name, 0 AS depth,
            ARRAY[id] AS path
     FROM organizations

     UNION ALL

     -- Recursive case: parent chain
     SELECT o.id, o.parent_organization_id, o.name, a.depth + 1,
            a.path || o.id
     FROM organizations o
     INNER JOIN ancestors a ON o.id = a.parent_organization_id
   )
   SELECT * FROM ancestors;
   ```

### Data Migration & Backfill Strategy

**Problem:** Users may have attempted to set parent relationships before this fix. Those selections were silently lost because forms wrote to `parent_id` instead of `parent_organization_id`.

**Audit Query:**
```sql
-- Check if any organizations are missing expected parent relationships
-- (This would require manual verification against user expectations)
SELECT id, name, organization_type, parent_organization_id
FROM organizations
WHERE parent_organization_id IS NULL
  AND organization_type IN ('customer', 'distributor', 'principal')
ORDER BY created_at DESC
LIMIT 100;
```

**Backfill Options:**

1. **No automatic backfill** (recommended)
   - Lost parent selections cannot be recovered without user input
   - **Action:** Communicate to users that parent relationships must be re-set
   - **Mitigation:** Create admin report showing orgs without parents that might need review

2. **Manual review + CSV import** (if data exists elsewhere)
   - Export current orgs to CSV
   - Users review and add parent_organization_id column
   - Re-import with updated schema that includes parent field
   - **Risk:** Requires users to have external source of truth for hierarchies

3. **Audit log analysis** (if audit logging exists)
   - Check audit_trail table for attempted parent changes
   - Reconstruct intended relationships from user actions
   - **Risk:** Complex, may not capture all attempts

**Recommendation:** Option 1 (No automatic backfill) + admin notification
- Create one-time notification for admins about parent relationship reset
- Provide "Orgs Without Parent" report filtered to likely candidates
- Document in release notes that hierarchies need to be re-established

### Code Changes Required

**Phase 1 - P0 Fixes:**
1. Field renaming (`parent_id` → `parent_organization_id`) in:
   - Forms: `OrganizationInputs.tsx`, `ParentOrganizationInput.tsx`
   - Validation: `organizations.ts` schema
   - Tests: `ParentOrganizationInput.test.tsx`, `validation.test.ts`, `edge-cases.test.ts`
   - CSV Import: Add to `OrganizationImportSchema` interface
2. Filter syntax fixes:
   - Replace MongoDB operators with PostgREST in `ParentOrganizationInput.tsx`
   - Add `id@neq` filter to exclude current record
3. Router state handling:
   - Read `location.state` in `OrganizationCreate.tsx`
   - Merge into form defaults for "Add Branch" flow
4. Database migration:
   - Create cycle protection trigger
   - Add function tests to migration

**Phase 2 - P1 Enhancements:**
1. Multi-level hierarchy support (if approved)
2. Enhanced summary views with ancestor paths
3. Index consolidation
4. RLS policy decision + implementation (if needed)

**Phase 3 - P2 Polish:**
1. UX feedback improvements (parent field chip/read-only display)
2. Replace page reloads with React Admin patterns
3. Inline error messages for validation failures

---

## Success Criteria

- [ ] Parent selection persists correctly in database
- [ ] "Add Branch Location" pre-fills parent field
- [ ] Self-parenting is prevented (UI + backend)
- [ ] Cycle creation is prevented (UI + backend)
- [ ] Parent selector excludes current organization
- [ ] Parent selector shows only eligible parent types
- [ ] All existing tests pass
- [ ] New tests cover P0 scenarios (70%+ coverage)
- [ ] No console errors or warnings
- [ ] Documentation updated in CLAUDE.md

---

## Risk Assessment

### High Risk

- **Field naming mismatch**: Complete blocker for feature functionality
- **No cycle protection**: Data integrity risk, can corrupt hierarchy tree
- **Broken filters**: Users can create invalid relationships

### Medium Risk

- **Router state ignored**: Poor UX, but workaround exists (manual parent selection)
- **Redundant indexes**: Performance overhead, but not breaking

### Low Risk

- **Limited depth support**: Artificial limitation, but doesn't break existing functionality
- **Page reloads**: Poor UX, but functional

---

## References

### Files

**Schema:**
- `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- `supabase/migrations/20251110142654_add_organization_hierarchy_rollups.sql`

**Components:**
- `src/atomic-crm/organizations/OrganizationInputs.tsx`
- `src/atomic-crm/organizations/OrganizationGeneralTab.tsx`
- `src/atomic-crm/organizations/OrganizationCreate.tsx`
- `src/atomic-crm/organizations/OrganizationShow.tsx`
- `src/atomic-crm/organizations/ParentOrganizationInput.tsx`
- `src/atomic-crm/organizations/ParentOrganizationSection.tsx`
- `src/atomic-crm/organizations/BranchLocationsSection.tsx`

**Services:**
- `src/atomic-crm/providers/supabase/services/TransformService.ts`
- `src/atomic-crm/validation/organizations.ts`

### Documentation

- [Organization Hierarchies Design Plan](2025-11-10-organization-hierarchies-design.md)
- [Engineering Constitution](../claude/engineering-constitution.md)
- [Database Schema](../architecture/database-schema.md)

---

## Next Steps

1. **Review and approve** this plan with stakeholders
2. **Create feature branch**: `git checkout -b fix/organization-hierarchies-p0`
3. **Execute P0 tasks** in order
4. **Test thoroughly** with unit + integration + E2E tests
5. **Review and merge** with code review
6. **Plan P1 work** based on multi-level hierarchy decision
