# Database Issues Analysis - Atomic CRM

## Overview

Comprehensive analysis of database-related issues in the Atomic CRM codebase, identifying field mismatches, permission errors, and schema inconsistencies between the code and actual database schema.

## Summary of Critical Issues

1. **Field Schema Mismatches**: Generated database types contain fields that don't exist in actual schema
2. **Legacy Field References**: Code references fields that were removed during migration
3. **Permission Issues**: Potential RLS policy problems (though not confirmed from current analysis)
4. **View Dependencies**: Code correctly references summary views that do exist

## Detailed Issues by Category

### 1. Field Schema Mismatches

#### 1.1 Tasks Table - Missing `archived_at` Field
- **Issue**: Generated types include `archived_at` field, but actual database schema lacks this field
- **Files**: `/src/types/database.generated.ts` lines 1654, 1670, 1686
- **Database Reality**: Tasks table only has: id, name, description, due_date, reminder_date, completed, completed_at, priority, contact_id, opportunity_id, sales_id, created_at, updated_at
- **Impact**: Code expecting `archived_at` field will fail at runtime
- **Validation Reference**: `/src/atomic-crm/validation/opportunities.ts:169-171` validates against `archived_at` but mentions it's no longer supported

#### 1.2 Organizations Table - Legacy `parent_company_id` References
- **Issue**: Generated types and test files reference `parent_company_id` but actual schema uses `parent_organization_id`
- **Files**:
  - `/src/types/database.generated.ts` lines 894, 928, 962, 982-983, 996-997
  - `/src/atomic-crm/organizations/OrganizationType.spec.ts` multiple lines using `parent_company_id`
- **Database Reality**: Organizations table uses `parent_organization_id`
- **Impact**: Tests and type references will fail

### 2. Legacy Field References in Active Code

#### 2.1 `company_id` Field References
- **Issue**: Multiple components reference non-existent `company_id` field
- **Critical Files**:
  - `/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx:81`
  - `/src/atomic-crm/providers/commons/activity.ts:34, 92-93, 111, 145-146, 164`
  - `/src/atomic-crm/notes/Note.tsx:92`
  - `/src/atomic-crm/activity/` multiple files
  - `/src/atomic-crm/contacts/` multiple files
  - `/src/atomic-crm/opportunities/OpportunityWorkflows.spec.tsx:53, 60`
- **Database Reality**: No `company_id` field exists; should use `customer_organization_id`, `principal_organization_id`, or `distributor_organization_id`
- **Impact**: Runtime errors when accessing these fields
- **Validation**: Code at `/src/atomic-crm/validation/` correctly validates against this but active UI code still uses it

#### 2.2 Searchable Field Mismatches
- **Issue**: Search configuration references fields that don't exist in database schema
- **File**: `/src/atomic-crm/providers/supabase/resources.ts`
- **Missing Fields in Organizations**:
  - `phone_number` (lines 44, 54) - database has `phone`
  - `zipcode` (lines 46, 56) - database has `postal_code`
  - `stateAbbr` (lines 48, 58) - database has `state`
- **Missing Fields in Contacts**:
  - `company_name` (lines 65) - no such field exists
  - `background` (lines 69) - no such field exists
- **Used in Search**: `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:262, 267` references `email_fts` and `phone_fts` which may not exist
- **Impact**: Search functionality will fail for these fields

### 3. Summary Views Status (RESOLVED)

#### 3.1 Summary Views Exist Correctly
- **Status**: ✅ CONFIRMED EXISTS
- **Views Found**:
  - `organizations_summary`
  - `contacts_summary`
  - `opportunities_summary`
- **Files Using**: `/src/atomic-crm/providers/supabase/resources.ts:15-17`
- **Impact**: No issues - views exist as expected

### 4. Table Access and Permissions

#### 4.1 Core Tables Exist and Accessible
- **Status**: ✅ CONFIRMED EXISTS
- **Tables**: `tasks`, `contactNotes`, `opportunityNotes` all exist with proper RLS policies
- **Files Using**: Multiple throughout `/src/atomic-crm/root/CRM.tsx:149-151`
- **Impact**: No permission issues detected in basic table access

### 5. Deprecated References (Informational)

#### 5.1 Cleaned Up References
- **Status**: ✅ PROPERLY HANDLED
- **Patterns**: Code correctly avoids `dealNotes`, `deal_id`, `deal_summary` references
- **Files**: `/src/atomic-crm/providers/supabase/resources.ts` contains proper comments about removed resources
- **Impact**: No issues - properly migrated

## Recommended Fixes

### High Priority (Runtime Failures)

1. **Regenerate Database Types**:
   ```bash
   npm run generate:types
   ```
   - Fix `archived_at` field in tasks table types
   - Fix `parent_company_id` vs `parent_organization_id` mismatch

2. **Fix Active `company_id` References**:
   - Update `/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx:81` to use correct organization field
   - Update `/src/atomic-crm/providers/commons/activity.ts` organization field references
   - Update all UI components in `/src/atomic-crm/activity/`, `/src/atomic-crm/contacts/`, `/src/atomic-crm/notes/`

3. **Fix Search Configuration**:
   - Update `/src/atomic-crm/providers/supabase/resources.ts` searchable fields:
     - `phone_number` → `phone`
     - `zipcode` → `postal_code`
     - `stateAbbr` → `state`
     - Remove `company_name` and `background` fields

### Medium Priority (Test Failures)

4. **Update Test Files**:
   - Fix `/src/atomic-crm/organizations/OrganizationType.spec.ts` to use `parent_organization_id`
   - Update `/src/atomic-crm/opportunities/OpportunityWorkflows.spec.tsx` company_id references

### Low Priority (Future Maintenance)

5. **Validation Cleanup**:
   - Review validation files to ensure all field references are current
   - Update any remaining legacy field validation messages

## Testing Verification

After fixes, verify with:
```bash
# Run type checking
npm run build

# Run tests
npm run test

# Test search functionality
# Test organization hierarchy (parent_organization_id)
# Test task creation/editing (no archived_at)
```

## Database Schema Reference

### Confirmed Field Names
- **Organizations**: `phone`, `postal_code`, `state`, `parent_organization_id`
- **Tasks**: No `archived_at` field exists
- **Contacts**: No `company_name` or `background` fields
- **All Tables**: Use `opportunity_id` not `deal_id`, `customer_organization_id` not `company_id`