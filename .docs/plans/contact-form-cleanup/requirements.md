# Contact Form Cleanup - Requirements

## Feature Summary
Remove legacy role, purchase influence, and decision authority fields from both the contacts table and contact_organizations junction table. These fields exist in the database but are either unused (contacts table) or add unnecessary complexity (contact_organizations table). This is a pure cleanup task with no new features.

## User Stories

**As a CRM user**
- I want a simpler contact-organization relationship form
- So that I can quickly link contacts to organizations without filling out unnecessary fields

**As a developer**
- I want to remove technical debt from the contacts schema
- So that the codebase is cleaner and easier to maintain

**As a database administrator**
- I want to drop unused columns from the database
- So that the schema accurately reflects what the application actually uses

## Technical Approach

### Database Changes

**Migration: `20250107HHMMSS_remove_contact_role_fields.sql`**

Drop columns from `contacts` table:
- `role` (contact_role enum type)
- `purchase_influence` (varchar(10))
- `decision_authority` (varchar(20))

Drop columns from `contact_organizations` table:
- `role` (contact_role enum type)
- `purchase_influence` (smallint)
- `decision_authority` (smallint)

**Note:** Data will be lost (user confirmed acceptable)

### Frontend Changes

**File: `src/atomic-crm/contacts/MultiOrganizationInput.tsx`**

Remove three SelectInput components (lines 106-137):
1. Role dropdown (8 choices: decision_maker, influencer, buyer, end_user, gatekeeper, champion, technical, executive)
2. Purchase Influence dropdown (High, Medium, Low, Unknown)
3. Decision Authority dropdown (Decision Maker, Influencer, End User, Gatekeeper)

Keep remaining fields:
- Organization selector
- `is_primary` boolean checkbox
- `is_primary_decision_maker` boolean checkbox

**Files that may need updates:**
- `src/atomic-crm/contacts/ContactInputs.tsx` (if any references exist)
- `src/atomic-crm/contacts/ContactCreate.tsx` (verify no dependencies)
- `src/atomic-crm/contacts/ContactEdit.tsx` (verify no dependencies)

### Validation Changes

**File: `src/atomic-crm/validation/contacts.ts`**

Remove:
- `contactRoleSchema` enum definition (lines 9-19)
- `purchaseInfluenceSchema` enum definition (lines 22-27)
- `decisionAuthoritySchema` enum definition (lines 30-35)
- References in `contactOrganizationSchema` (lines 80-82)
- Refine checks that block these fields at contact level (lines 144-168)

**Note:** Current validation already blocks these fields at the contact level, so removal should be straightforward.

### Data Provider

**File: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`**

Verify no field transformations or special handling exists for:
- `role`
- `purchase_influence`
- `decision_authority`

If found, remove transformation logic.

## UI/UX Flow

### Before (Current State)
1. User opens contact edit form
2. User expands organization relationships section
3. User sees 5 fields per organization:
   - Organization selector
   - Role dropdown (8 options)
   - Purchase Influence dropdown (4 options)
   - Decision Authority dropdown (4 options)
   - is_primary checkbox
4. User must fill out or accept defaults for role/influence/authority

### After (Simplified State)
1. User opens contact edit form
2. User expands organization relationships section
3. User sees 3 fields per organization:
   - Organization selector
   - is_primary checkbox
   - is_primary_decision_maker checkbox
4. User simply selects organization and flags (no dropdowns)

## Success Metrics

### Database Validation
- [ ] `contacts` table no longer has `role`, `purchase_influence`, `decision_authority` columns
- [ ] `contact_organizations` table no longer has `role`, `purchase_influence`, `decision_authority` columns
- [ ] Migration applies cleanly without errors
- [ ] Existing contacts and relationships remain intact (except for dropped columns)

### Frontend Validation
- [ ] `MultiOrganizationInput.tsx` renders only 3 fields per organization relationship
- [ ] Contact create form loads without errors
- [ ] Contact edit form loads without errors
- [ ] User can create new contact-organization relationships
- [ ] User can edit existing contact-organization relationships
- [ ] No console errors related to missing fields

### Code Validation
- [ ] All references to `role`, `purchase_influence`, `decision_authority` removed from validation schemas
- [ ] TypeScript compiles without errors
- [ ] Tests pass (if any exist for contact forms)
- [ ] No unused enum types remain in codebase

## Out of Scope

**NOT included in this task:**
- ❌ Adding new fields (no pronouns, no replacement fields)
- ❌ Data migration or archival (data will be dropped)
- ❌ Backward compatibility (breaking change is acceptable)
- ❌ API versioning (no need to support old field names)
- ❌ Historical data preservation
- ❌ Removing `contact_role` enum type from database (may be used elsewhere, verify separately)

## Implementation Notes

### Current State Analysis
Based on research, the following was discovered:

1. **Validation already blocks these fields at contact level** (lines 144-168 in `src/atomic-crm/validation/contacts.ts`)
2. **Fields exist in database but not rendered in main contact form** (only in MultiOrganizationInput)
3. **Data type inconsistency exists:**
   - `contacts` table: varchar fields
   - `contact_organizations` table: smallint fields
4. **This appears to be an incomplete migration** - suggests previous attempt to move these fields from contacts to junction table

### Risk Assessment
**Low Risk** - These are isolated fields with clear boundaries:
- No foreign key dependencies
- Validation already exists to prevent usage at contact level
- Used only in one component (MultiOrganizationInput.tsx)
- User confirmed data loss is acceptable

### Testing Checklist
1. Create a new contact with organization relationship
2. Edit an existing contact's organization relationships
3. Verify form displays correctly (no dropdown fields)
4. Verify data saves without validation errors
5. Check database schema matches expected state
6. Run full test suite to catch any unexpected dependencies

## Complete File Inventory

### Database Changes (2 files)

**Primary Migration:**
- `supabase/migrations/20250107HHMMSS_remove_contact_role_fields.sql` (NEW - to be created)
  - Drop 6 columns total (3 from contacts, 3 from contact_organizations)
  - Consider dropping `contact_role` enum type

**Database Function Update:**
- `supabase/migrations/20251006000000_fix_companies_to_organizations_refs.sql`
  - Update `get_contact_organizations()` function (lines 21-46)
  - Remove `role` from return type signature

### Type Definitions (3 files)

**Manual Types:**
- `src/atomic-crm/types.ts`
  - Line 99-108: Remove fields from `Contact` interface (role, purchase_influence, decision_authority)
  - Line 122-131: Remove fields from `ContactOrganization` interface

**Generated Types (auto-update after migration):**
- `src/types/database.generated.ts`
  - Will auto-regenerate via `npm run supabase:generate-types` after migration

### Frontend Components (8 files)

**Critical Changes:**

1. **`src/atomic-crm/contacts/MultiOrganizationInput.tsx`**
   - Lines 15-24: Remove `roleChoices` constant
   - Lines 26-32: Remove `purchaseInfluenceChoices` constant
   - Lines 33-38: Remove `decisionAuthorityChoices` constant
   - Lines 107-137: Remove 3 SelectInput components (role, purchase_influence, decision_authority)

2. **`src/atomic-crm/contacts/ContactMultiOrg.tsx`**
   - Lines 17-26: Remove `contactRoleChoices` constant
   - Lines 28-34: Remove `purchaseInfluenceChoices` constant
   - Lines 35-41: Remove `decisionAuthorityChoices` constant
   - Lines 73-95: Remove 3 SelectInput components

3. **`src/atomic-crm/contacts/ContactShow.tsx`**
   - Lines 54-72: Remove legacy field display (role, purchase_influence, decision_authority from contact record)
   - Lines 115-135: Remove field display from organizations array

4. **`src/atomic-crm/contacts/ContactListContent.tsx`**
   - Lines 84-91: Remove role badge display

5. **`src/atomic-crm/contacts/ContactList.tsx`**
   - Lines 145-146: Remove field mapping (purchase_influence, decision_authority)

6. **`src/atomic-crm/contacts/ContactListFilter.tsx`**
   - Lines 149-161: Remove purchase_influence filter options

**Minor/Verification:**
- `src/atomic-crm/contacts/ContactInputs.tsx` (verify no references)
- `src/atomic-crm/contacts/ContactCreate.tsx` (verify no dependencies)

### Validation Layer (1 file)

**`src/atomic-crm/validation/contacts.ts`**
- Lines 9-19: Remove `contactRoleSchema` definition
- Lines 22-27: Remove `purchaseInfluenceSchema` definition
- Lines 30-35: Remove `decisionAuthoritySchema` definition
- Lines 80-82: Remove fields from `contactOrganizationSchema`
- Lines 144-168: Remove refine validation blocks (legacy field rejection)

### Services (1 file)

**`src/atomic-crm/services/junctions.service.ts`**
- Line 84: Remove `purchase_influence` assignment
- Line 85: Remove `decision_authority` assignment
- Line 86: Remove `role` assignment

### Test Files (6 files)

**`src/atomic-crm/contacts/ContactMultiOrg.spec.ts`**
- Lines 41-43, 50-52, 59-61: Remove test data fields
- Lines 166-173: Remove/update validation tests
- Lines 239-241, 262-264: Update test expectations
- Lines 317-333, 425-427: Update test scenarios
- Lines 463-486, 517-519, 537-539: Update assertions
- Lines 555, 573-580: Update validation tests
- Lines 607-609, 625-627, 636-638: Update test data
- Lines 716, 721, 738-740: Update expectations

**`src/atomic-crm/contacts/ContactList.spec.tsx`**
- Lines 24, 37, 54: Remove field references
- Lines 163, 166: Remove assertions
- Line 362: Remove field reference

**`src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx`**
- Lines 78-79: Remove field assertions
- Lines 224-228: Update test data
- Lines 272-273, 275, 281: Update expectations

**`src/atomic-crm/contacts/__tests__/ContactList.test.tsx`**
- Lines 93-97, 105-124, 125, 139: Update test data and expectations

**`src/atomic-crm/opportunities/opportunityUtils.spec.ts`**
- Lines 250-251, 260-261: Update contact organization test data

**`src/atomic-crm/tests/unifiedDataProvider.test.ts`**
- Lines 154-155: Remove fields from test array

### Data Provider (verify only)

**`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`**
- Verify no special transformation logic for these fields
- No changes expected (fields handled generically)

### Seed/Test Data Files (optional cleanup)

**`scripts/seed-fake-data.ts`**
- Line 258: Remove role assignment (optional)

**`src/atomic-crm/contacts/useContactImport.tsx`**
- Line 168: Remove default role (optional)

### Summary Statistics

**Files Requiring Changes:** 20 files
- 2 database files (1 new migration, 1 function update)
- 3 type definition files (1 manual, 2 auto-generated)
- 8 frontend component files
- 1 validation file
- 1 service file
- 6 test files

**Lines of Code to Remove/Modify:** ~350 lines
- ~30 lines database SQL
- ~15 lines type definitions
- ~150 lines frontend UI code
- ~60 lines validation schemas
- ~5 lines service code
- ~90 lines test code

**Estimated Effort:** 3-4 hours
- 30 min: Write and test migration
- 60 min: Update all source files
- 60 min: Update test files
- 30 min: Manual testing and verification

## Questions Resolved

1. ✅ Remove from both tables? **YES** - contacts AND contact_organizations
2. ✅ Add pronouns field? **NO** - pure removal, no new features
3. ✅ Simplified roles field? **NO** - complete removal
4. ✅ Data migration? **NO** - acceptable to drop data
5. ✅ Which tables affected? **Both contacts and contact_organizations**
