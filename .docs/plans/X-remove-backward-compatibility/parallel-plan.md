# Remove Backward Compatibility - Parallel Execution Plan (REVISED)

This plan orchestrates the removal of all backward compatibility fields and patterns from the Atomic CRM codebase following Engineering Constitution Principle #9: "Never maintain backward compatibility - fail fast". The system will transition from dual-pattern support (legacy fields + junction tables) to pure junction table relationships. This atomic breaking change is only appropriate because the system is NOT in production.

## ⚠️ CRITICAL REVISION NOTES
This plan has been revised after comprehensive validation revealed:
1. **Database dependencies** - Views, functions, triggers, and indexes must be handled in specific order
2. **Transaction integrity** - Must create RPC replacement BEFORE removing trigger
3. **Build sequence** - Components must be refactored BEFORE types to maintain working build
4. **Missing components** - Activity system, import utilities, dashboard components added
5. **Constitution compliance** - Ensures Principles #8 (transactions) and #21 (migration safety)

## Critically Relevant Files and Documentation

### Core Documentation
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/shared.md` - Comprehensive shared reference
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/requirements.md` - Success criteria and implementation strategy
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/validation-research.docs.md` - Validation schema details
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/data-provider-research.docs.md` - Data provider patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` - Component usage patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/junction-table-research.docs.md` - Junction table architecture

### Critical Files to Modify
- `/src/atomic-crm/types.ts` - Type definitions with backward compatibility fields
- `/src/atomic-crm/validation/contacts.ts` - Contact validation with 6 legacy fields
- `/src/atomic-crm/validation/opportunities.ts` - Opportunity validation with 2 legacy fields
- `/src/atomic-crm/contacts/MultiOrganizationInput.tsx` - Dual-mode form component
- `/src/atomic-crm/providers/supabase/dataProvider.ts` - Data provider with legacy field support

## Implementation Plan

### Phase 0: Transaction Management Setup

#### Task 0.1: Create RPC Function for Primary Organization Management - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql` (lines 877-892)
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/junction-table-research.docs.md` (lines 76-99)

**Instructions**

Files to create:
- `/supabase/migrations/[timestamp]_add_set_primary_organization_rpc.sql`

Create RPC function to replace trigger functionality BEFORE removing it:
```sql
CREATE OR REPLACE FUNCTION set_primary_organization(
  p_contact_id BIGINT,
  p_organization_id BIGINT
) RETURNS VOID AS $$
BEGIN
  -- Atomic transaction: clear all primary flags, then set the new one
  UPDATE contact_organizations
  SET is_primary = false
  WHERE contact_id = p_contact_id
  AND deleted_at IS NULL;

  UPDATE contact_organizations
  SET is_primary = true
  WHERE contact_id = p_contact_id
  AND organization_id = p_organization_id
  AND deleted_at IS NULL;

  -- Verify exactly one primary exists
  IF (SELECT COUNT(*) FROM contact_organizations
      WHERE contact_id = p_contact_id
      AND is_primary = true
      AND deleted_at IS NULL) != 1 THEN
    RAISE EXCEPTION 'Failed to set exactly one primary organization';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

This ensures transaction atomicity per Constitution Principle #8 before we remove the trigger.

### Phase 1: Component Refactoring (Do FIRST - Maintains Working Build)

#### Task 1.1: Refactor MultiOrganizationInput Component - Depends on [0.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/data-provider-research.docs.md` (lines 65-70)

**Instructions**

Files to modify:
- `/src/atomic-crm/types.ts`

Remove backward compatibility fields from type definitions:
- Remove `company_id` from Contact type (line 73)
- Remove `is_primary_contact` from Contact type (line 90)
- Remove `is_primary_contact` from ContactOrganization type (line 110)
- Remove `Company = Organization` type alias (line 57)
- Update Activity types to use `customer_organization_id` instead of `company_id` (lines 210-211, 251, 266)
- Remove `archived_at` from Opportunity type (line 211)

Ensure all TypeScript interfaces follow Constitution Principle #6 (interface for objects, type for unions).

#### Task 1.2: Update Validation Schemas - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/validation-research.docs.md` (lines 35-63)

**Instructions**

Files to modify:
- `/src/atomic-crm/validation/contacts.ts`
- `/src/atomic-crm/validation/opportunities.ts`

Contact validation changes:
- Remove `is_primary_contact` from contactOrganizationSchema (line 75)
- Remove `company_id` from contactSchema (line 90)
- Remove entire "Primary organization fields (backward compatibility)" section (lines 104-109)
- Update createContactSchema and updateContactSchema to reflect base schema changes

Opportunity validation changes:
- Remove entire "Backward compatibility fields" section (lines 117-120)
- Remove `company_id` field (line 118)
- Remove `archived_at` field (line 119)

Add helpful error messages for removed fields that guide users to new patterns.

#### Task 1.3: Configure ESLint Prevention Rules - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.eslintrc.js`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/requirements.md` (lines 194-219)

**Instructions**

Files to modify:
- `/.eslintrc.js`

Add no-restricted-properties rules to prevent reintroduction of legacy fields:
- Restrict `Contact.company_id` with migration message
- Restrict `Contact.is_primary_contact` with migration message
- Restrict `Opportunity.company_id` with migration message
- Restrict `Opportunity.archived_at` with migration message

This follows Constitution Principle #16 (ESLint rules prevent architecture violations).

### Phase 2: Contact Module Refactoring

#### Task 2.1: Refactor MultiOrganizationInput Component - Depends on [1.1, 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/MultiOrganizationInput.tsx`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` (lines 27-37)

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/MultiOrganizationInput.tsx`

Major refactoring to remove dual-mode support:
- Remove primary organization card (lines 96-135)
- Remove company_id/is_primary_contact sync logic (lines 52-87)
- Remove useWatch hooks for legacy fields (lines 45, 49)
- Make organizations array the single source of truth
- Update to use `is_primary` field consistently (not `is_primary_organization`)
- Ensure validation that exactly one organization has `is_primary = true`

#### Task 2.2: Update Contact Display Components - Depends on [1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListContent.tsx`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` (lines 39-69)

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/ContactShow.tsx`
- `/src/atomic-crm/contacts/ContactListContent.tsx`

ContactShow changes:
- Remove legacy company_id display logic (lines 38-48, 68-76)
- Remove is_primary_contact badge logic (lines 61-65, 81-85)
- Use only junction table data for all organization displays
- Find primary organization via `organizations?.find(org => org.is_primary)`

ContactListContent changes:
- Replace company_id organization display with primary organization from array (lines 66-75)
- Remove is_primary_contact badge logic (lines 81-85)
- Add logic to find primary organization from organizations array

#### Task 2.3: Update Contact List and Export - Depends on [1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` (lines 51-59)

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/ContactList.tsx`

Remove legacy field handling from CSV export:
- Remove company_id from fetchRelatedRecords (line 73)
- Update exporter to use organizations array for company name (lines 83-84)
- Replace is_primary_contact export with primary organization lookup (line 109)

#### Task 2.4: Update Contact Filters - Depends on [1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` (lines 71-77)

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/ContactListFilter.tsx`

Remove legacy filter options:
- Remove is_primary_contact filter entirely (line 142)
- Consider adding new filter for "Primary Contact at Any Organization" using junction table query

#### Task 2.5: Update Contact Form Inputs - Depends on [1.1, 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx`

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/ContactInputs.tsx`

Remove any legacy field inputs if present:
- Remove company_id field references
- Remove is_primary_contact field references
- Ensure forms only use organizations array with junction table pattern

### Phase 3: Opportunity Module Updates

#### Task 3.1: Update Opportunity Components - Depends on [1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`

**Instructions**

Files to modify (if they contain legacy fields):
- `/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`

Remove any references to:
- `company_id` field (use `customer_organization_id` instead)
- `archived_at` field (use `deleted_at` for soft deletes)

Note: Research indicates opportunity components may already follow new patterns.

### Phase 4: Data Provider Updates

#### Task 4.1: Update Data Provider Legacy Field Handling - Depends on [1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/data-provider-research.docs.md` (lines 65-79)

**Instructions**

Files to modify:
- `/src/atomic-crm/providers/supabase/dataProvider.ts`

Remove legacy field handling:
- Remove is_primary_contact parameter handling (line 262)
- Update contact creation to automatically create junction table entries
- Ensure proper is_primary flag management in junction table operations
- Remove any backward compatibility field transformations

#### Task 4.2: Remove Tag Color Migration System - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/tag-colors.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 512-546)
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/data-provider-research.docs.md` (lines 71-75)

**Instructions**

Files to modify:
- `/src/atomic-crm/tags/tag-colors.ts`
- `/src/atomic-crm/providers/supabase/dataProvider.ts`

Remove hex color migration utilities:
- Remove `migrateHexToSemantic()` function
- Remove `isLegacyHexColor()` function
- Remove `getHexFallback()` function
- Remove `HEX_TO_SEMANTIC_MAP` constant
- Remove hex color migration logic from tag lifecycle callbacks (dataProvider lines 512-546)

This enforces Constitution Principle #12 (semantic CSS variables only, no hex).

### Phase 5: Test Updates

#### Task 5.1: Update Contact Tests - Depends on [2.1, 2.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md` (lines 131-140)

**Instructions**

Files to modify:
- `/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`
- Any other contact test files

Remove backward compatibility test scenarios:
- Remove tests for legacy field behavior (lines 12, 14, 349, 358, 360, 369, 376)
- Remove entire backward compatibility test section (lines 347-414)
- Update tests to focus on pure junction table patterns
- Add tests for primary organization validation (exactly one is_primary: true)
- Create tests that validate rejection of legacy fields with helpful errors

#### Task 5.2: Update Integration Tests - Depends on [1.1, 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/tests/performance/junction-table-performance.spec.ts`
- `/home/krwhynot/Projects/atomic/src/tests/e2e/opportunity-lifecycle.test.ts`
- `/home/krwhynot/Projects/atomic/src/tests/e2e/user-journey.test.ts`

**Instructions**

Files to modify:
- Any integration or E2E tests referencing legacy fields

Update test fixtures and assertions:
- Remove any references to company_id in contact tests
- Remove any references to is_primary_contact
- Remove any references to archived_at in opportunity tests
- Update fixtures to use only new junction table patterns
- Verify all E2E journeys work with new patterns

### Phase 6: Cleanup and Migration

#### Task 6.1: Remove Migration Scripts - Depends on [all previous tasks]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/scripts/migration-dry-run.js`
- `/home/krwhynot/Projects/atomic/scripts/migration-transform.js`

**Instructions**

Files to delete:
- `/scripts/migration-dry-run.js`
- `/scripts/migration-transform.js`
- Any other backward compatibility migration scripts

These scripts are no longer needed as we're removing backward compatibility entirely.

#### Task 6.2: Database Migration Script - Depends on [all previous tasks]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`
- `/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/junction-table-research.docs.md` (lines 76-99)

**Instructions**

Files to create:
- `/supabase/migrations/[timestamp]_remove_backward_compatibility.sql`

Create migration to remove backward compatibility from database:
- Drop `company_id` column from contacts table
- Drop `is_primary_contact` column from contact_organizations table
- Drop `archived_at` column from opportunities table
- Remove `sync_primary_organization()` trigger and function
- Update any views that reference legacy fields

Note: Use timestamp format YYYYMMDDHHMMSS per Constitution Principle #5.

#### Task 6.3: Apply Boy Scout Rule - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (Constitution principles)

**Instructions**

Files to modify:
- Any files touched during the refactoring

While updating files, apply Constitution principles:
- Fix TypeScript interface/type usage (Principle #6)
- Replace hex colors with semantic CSS variables (Principle #12)
- Ensure admin form layer usage (Principle #11)
- Consolidate to unified data provider (Principle #1)
- Remove unnecessary comments (Principle #10)

## Advice

- **Primary Relationship Logic**: The system uses `is_primary` in the database but components may use `is_primary_organization` in the UI. Ensure consistency when refactoring to avoid breaking the primary relationship enforcement.

- **Junction Table Constraints**: The database uses EXCLUDE constraints to prevent duplicate active relationships. Don't try to insert duplicate contact-organization pairs - soft delete the old one first.

- **Performance Considerations**: Junction table queries are already optimized with indexes (150-250ms for complex queries). Don't add additional indexes unless you measure performance issues first (Constitution Principle #18).

- **Transaction Integrity**: Multi-table operations (like setting a primary organization) must be atomic. Use database transactions or triggers, not sequential API calls.

- **Error Messages**: When validation rejects removed fields, provide helpful migration messages like "Field 'company_id' is no longer supported. Use contact_organizations relationship instead."

- **Testing Strategy**: Create tests that specifically validate the rejection of legacy fields before deleting the old backward compatibility tests. This ensures the new validation is working correctly.

- **Type Safety**: After removing fields from types.ts, TypeScript will immediately flag all usage sites. Use this to ensure you haven't missed any references.

- **No Partial Deployment**: This is an atomic breaking change. All tasks must be completed before merging. The system cannot function with partial backward compatibility removal.