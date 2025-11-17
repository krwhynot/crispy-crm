# Migration Test Plan: fix_referential_integrity

**Migration:** `20251117032253_fix_referential_integrity.sql`
**Date:** 2025-11-17
**Status:** Ready for Testing

## Overview

This migration adds critical foreign key constraints and fixes cascade behaviors. Testing is **mandatory** before production deployment to verify data integrity enforcement.

---

## Pre-Migration Checks

### 1. Verify Existing Data Integrity

Run these queries **BEFORE** applying migration to identify potential FK violations:

```sql
-- Check for opportunities with invalid customer_organization_id
SELECT o.id, o.name, o.customer_organization_id
FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
WHERE org.id IS NULL
  AND o.deleted_at IS NULL;

-- Expected: 0 rows (no orphaned opportunities)

-- Check for opportunities with invalid principal_organization_id
SELECT o.id, o.name, o.principal_organization_id
FROM opportunities o
LEFT JOIN organizations org ON o.principal_organization_id = org.id
WHERE o.principal_organization_id IS NOT NULL
  AND org.id IS NULL
  AND o.deleted_at IS NULL;

-- Expected: 0 rows

-- Check for opportunities with invalid distributor_organization_id
SELECT o.id, o.name, o.distributor_organization_id
FROM opportunities o
LEFT JOIN organizations org ON o.distributor_organization_id = org.id
WHERE o.distributor_organization_id IS NOT NULL
  AND org.id IS NULL
  AND o.deleted_at IS NULL;

-- Expected: 0 rows
```

**Action if violations found:**
- Fix data inconsistencies before migration
- Update invalid IDs to existing organizations
- Soft-delete orphaned records

---

## Post-Migration Tests

### Test 1: Opportunities → Organizations FK Constraints

#### 1a. Prevent Invalid Customer Organization Insert

```sql
-- Test: Insert opportunity with non-existent customer org
INSERT INTO opportunities (
  name,
  customer_organization_id,
  stage,
  account_manager_id
) VALUES (
  'Test Opportunity',
  99999,  -- Non-existent org ID
  'new_lead',
  (SELECT id FROM sales LIMIT 1)
);

-- Expected Result: ERROR - violates foreign key constraint
-- Error Message: insert or update on table "opportunities" violates foreign key constraint "opportunities_customer_organization_id_fkey"
```

**✅ Pass:** Foreign key constraint prevents invalid data
**❌ Fail:** Insert succeeds (constraint not working)

#### 1b. Prevent Customer Organization Deletion with Opportunities

```sql
-- Setup: Create test organization with opportunity
DO $$
DECLARE
  test_org_id BIGINT;
  test_sales_id BIGINT;
BEGIN
  -- Create test organization
  INSERT INTO organizations (name, organization_type, created_by)
  VALUES ('Test Restaurant', 'customer', (SELECT id FROM sales LIMIT 1))
  RETURNING id INTO test_org_id;

  -- Create opportunity using this org
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    stage,
    account_manager_id
  ) VALUES (
    'Test Opportunity',
    test_org_id,
    'new_lead',
    (SELECT id FROM sales LIMIT 1)
  );

  -- Attempt to delete organization
  DELETE FROM organizations WHERE id = test_org_id;
END $$;

-- Expected Result: ERROR - update or delete on table "organizations" violates foreign key constraint
-- Error Message: Key (id)=(X) is still referenced from table "opportunities"
```

**✅ Pass:** Cannot delete organization with opportunities
**❌ Fail:** Organization deletes (opportunities orphaned)

#### 1c. Clear Principal/Distributor on Organization Deletion

```sql
-- Test: Delete principal organization, verify opportunity field SET NULL
DO $$
DECLARE
  test_principal_id BIGINT;
  test_customer_id BIGINT;
  test_opp_id BIGINT;
BEGIN
  -- Create principal and customer orgs
  INSERT INTO organizations (name, organization_type, created_by)
  VALUES ('Test Principal', 'principal', (SELECT id FROM sales LIMIT 1))
  RETURNING id INTO test_principal_id;

  INSERT INTO organizations (name, organization_type, created_by)
  VALUES ('Test Customer', 'customer', (SELECT id FROM sales LIMIT 1))
  RETURNING id INTO test_customer_id;

  -- Create opportunity with principal
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    account_manager_id
  ) VALUES (
    'Test Opportunity',
    test_customer_id,
    test_principal_id,
    'new_lead',
    (SELECT id FROM sales LIMIT 1)
  )
  RETURNING id INTO test_opp_id;

  -- Delete principal organization
  DELETE FROM organizations WHERE id = test_principal_id;

  -- Verify principal_organization_id was set to NULL
  IF (SELECT principal_organization_id FROM opportunities WHERE id = test_opp_id) IS NOT NULL THEN
    RAISE EXCEPTION 'FK constraint failed: principal_organization_id should be NULL';
  END IF;

  -- Cleanup
  DELETE FROM opportunities WHERE id = test_opp_id;
  DELETE FROM organizations WHERE id = test_customer_id;
END $$;

-- Expected Result: Success (no errors)
-- Expected Behavior: principal_organization_id SET NULL, opportunity preserved
```

**✅ Pass:** Principal cleared from opportunity
**❌ Fail:** Deletion blocked or opportunity deleted

---

### Test 2: Activities Cascade Behavior

#### 2a. Cascade Delete Activities on Contact Deletion

```sql
-- Test: Delete contact cascades activities
DO $$
DECLARE
  test_contact_id BIGINT;
  test_activity_count INTEGER;
BEGIN
  -- Create test contact
  INSERT INTO contacts (first_name, last_name, email, sales_id, organization_id)
  VALUES (
    'Test',
    'Contact',
    '[{"email": "test@example.com", "type": "Work"}]'::jsonb,
    (SELECT id FROM sales LIMIT 1),
    (SELECT id FROM organizations LIMIT 1)
  )
  RETURNING id INTO test_contact_id;

  -- Create activity for contact
  INSERT INTO activities (
    type,
    activity_type,
    contact_id,
    created_by,
    activity_date
  ) VALUES (
    'email',
    'interaction',
    test_contact_id,
    (SELECT id FROM sales LIMIT 1),
    now()
  );

  -- Count activities before deletion
  SELECT COUNT(*) INTO test_activity_count
  FROM activities WHERE contact_id = test_contact_id;

  IF test_activity_count = 0 THEN
    RAISE EXCEPTION 'Activity not created';
  END IF;

  -- Delete contact
  DELETE FROM contacts WHERE id = test_contact_id;

  -- Verify activities were cascade deleted
  SELECT COUNT(*) INTO test_activity_count
  FROM activities WHERE contact_id = test_contact_id;

  IF test_activity_count != 0 THEN
    RAISE EXCEPTION 'CASCADE DELETE failed: activities still exist';
  END IF;
END $$;

-- Expected Result: Success (activities deleted with contact)
```

**✅ Pass:** Activities cascade deleted
**❌ Fail:** Deletion blocked or activities orphaned

#### 2b. Preserve Activities on Opportunity Deletion (SET NULL)

```sql
-- Test: Delete opportunity preserves activities with NULL opportunity_id
DO $$
DECLARE
  test_opp_id BIGINT;
  test_activity_id BIGINT;
  activity_opp_id BIGINT;
BEGIN
  -- Create test opportunity
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    stage,
    account_manager_id
  ) VALUES (
    'Test Opportunity',
    (SELECT id FROM organizations WHERE organization_type = 'customer' LIMIT 1),
    'new_lead',
    (SELECT id FROM sales LIMIT 1)
  )
  RETURNING id INTO test_opp_id;

  -- Create activity for opportunity
  INSERT INTO activities (
    type,
    activity_type,
    opportunity_id,
    created_by,
    activity_date
  ) VALUES (
    'email',
    'interaction',
    test_opp_id,
    (SELECT id FROM sales LIMIT 1),
    now()
  )
  RETURNING id INTO test_activity_id;

  -- Delete opportunity
  DELETE FROM opportunities WHERE id = test_opp_id;

  -- Verify activity still exists with NULL opportunity_id
  SELECT opportunity_id INTO activity_opp_id
  FROM activities WHERE id = test_activity_id;

  IF activity_opp_id IS NOT NULL THEN
    RAISE EXCEPTION 'SET NULL failed: opportunity_id should be NULL';
  END IF;

  -- Cleanup
  DELETE FROM activities WHERE id = test_activity_id;
END $$;

-- Expected Result: Success (activity preserved, opportunity_id = NULL)
```

**✅ Pass:** Activity preserved with NULL opportunity_id
**❌ Fail:** Deletion blocked or activity deleted

---

### Test 3: Contacts → Organizations Constraint

#### 3a. Prevent Organization Deletion with Contacts

```sql
-- Test: Cannot delete organization with contacts
DO $$
DECLARE
  test_org_id BIGINT;
BEGIN
  -- Create test organization
  INSERT INTO organizations (name, organization_type, created_by)
  VALUES ('Test Company', 'customer', (SELECT id FROM sales LIMIT 1))
  RETURNING id INTO test_org_id;

  -- Create contact at organization
  INSERT INTO contacts (first_name, last_name, organization_id, sales_id)
  VALUES (
    'Test',
    'Contact',
    test_org_id,
    (SELECT id FROM sales LIMIT 1)
  );

  -- Attempt to delete organization
  DELETE FROM organizations WHERE id = test_org_id;
END $$;

-- Expected Result: ERROR - Key is still referenced from table "contacts"
```

**✅ Pass:** Deletion blocked by RESTRICT constraint
**❌ Fail:** Organization deletes (contacts orphaned)

---

### Test 4: RLS Policy Verification

#### 4a. Verify Duplicate Policies Removed

```sql
-- Check for remaining 'authenticated_*' prefixed policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'authenticated_%';

-- Expected Result: 0 rows (all duplicates removed)
```

**✅ Pass:** No authenticated_* policies found
**❌ Fail:** Duplicate policies still exist

#### 4b. Verify Core Policies Still Work

```sql
-- Test SELECT policy as authenticated user
SET ROLE authenticated;

SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL;

RESET ROLE;

-- Expected Result: Queries succeed, return counts
```

**✅ Pass:** All queries succeed
**❌ Fail:** Permission denied errors

---

## Performance Verification

### Index Usage Check

```sql
-- Verify contacts organization index excludes soft-deleted
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'contacts'
  AND indexname = 'idx_contacts_organization_id';

-- Expected: Index definition includes WHERE deleted_at IS NULL
```

---

## Rollback Plan

If migration causes issues, rollback with:

```sql
-- Rollback: Remove added FK constraints
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_customer_organization_id_fkey;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_principal_organization_id_fkey;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_distributor_organization_id_fkey;

-- Rollback: Restore original activities constraints
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_contact_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_opportunity_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id);
ALTER TABLE activities
  ADD CONSTRAINT activities_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);

-- Rollback: Restore original contacts constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_organization_id_fkey;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
```

---

## Sign-Off Checklist

- [ ] All pre-migration integrity checks passed (0 violations)
- [ ] Test 1a passed (invalid insert blocked)
- [ ] Test 1b passed (customer org deletion blocked)
- [ ] Test 1c passed (principal/distributor SET NULL)
- [ ] Test 2a passed (activities cascade on contact delete)
- [ ] Test 2b passed (activities preserved on opportunity delete)
- [ ] Test 3a passed (org deletion with contacts blocked)
- [ ] Test 4a passed (duplicate policies removed)
- [ ] Test 4b passed (core policies work)
- [ ] Performance check passed (index optimized)
- [ ] Rollback plan tested and documented
- [ ] Product team notified of breaking changes

---

## Breaking Changes Summary

**User-Facing Changes:**
1. **Cannot delete organizations with contacts** (must reassign contacts first)
2. **Cannot delete customer organizations with opportunities** (must close/transfer first)
3. **Deleting contacts removes their activities** (activity history lost)

**Recommended UI Improvements:**
- Organization delete: Show contact count warning + bulk reassignment tool
- Contact delete: Show activity count warning + confirm dialog
- Opportunity closure: Add "Transfer to another org" option before deletion

---

## Post-Deployment Monitoring

Monitor these metrics for 24 hours after deployment:

1. **Error rate spike** - Watch for FK constraint violation errors
2. **Delete operation failures** - Track blocked deletions
3. **User support tickets** - Monitor for deletion-related issues
4. **Database query performance** - Verify no regression from new indexes

---

**Tested By:** _______________
**Date:** _______________
**Approved By:** _______________
**Deployed On:** _______________
