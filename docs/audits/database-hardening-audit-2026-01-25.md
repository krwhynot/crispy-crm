# Database Hardening Audit - Crispy CRM
**Date:** 2026-01-25
**Confidence:** 85%
**Mode:** Full Audit

---

## Executive Summary

Crispy CRM's database layer demonstrates **moderate security posture** with strong recent hardening efforts. The database has comprehensive Row-Level Security (RLS) on all 31 tables, soft-delete implementation across critical entities, and emerging dual-authorization patterns for junction tables.

**Key Strengths:**
- ✅ RLS enabled on 100% of tables
- ✅ Soft-delete columns implemented on 18+ tables
- ✅ Partial indexes for EXISTS subqueries in RLS
- ✅ Dual-authorization patterns for product_distributors and sensitive junctions
- ✅ Trigger-based updated_at automation across all major tables

**Key Gaps:**
- ⚠️ 3 CRITICAL issues with incomplete soft-delete enforcement
- ⚠️ 8 HIGH issues with missing or incomplete RLS policy implementations
- ⚠️ Missing indexes on some FK columns used in RLS EXISTS checks
- ⚠️ Policy consolidation incomplete (duplicate/conflicting policies in some tables)

---

## Critical Issues [3]

### CR-001: opportunity_participants Missing Soft-Delete RLS Filter

**Severity:** CRITICAL
**Risk:** Deleted records remain queryable, breaking data privacy
**Impact:** Users may accidentally query archived opportunity participants

**Location:** `supabase/migrations/20251029024045_fix_rls_policies_company_isolation.sql`
**Current State:**
```sql
CREATE POLICY "Users can view opportunity_participants"
  ON opportunity_participants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM opportunities o WHERE o.id = opportunity_participants.opportunity_id)
  );
```

**Issue:** No `deleted_at IS NULL` filter in USING clause

**Fix Required:**
```sql
CREATE POLICY "Users can view opportunity_participants"
  ON opportunity_participants FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM opportunities o
                WHERE o.id = opportunity_participants.opportunity_id
                AND o.deleted_at IS NULL)
  );
```

**Acceptance Criteria:**
- [ ] RLS policy includes `deleted_at IS NULL`
- [ ] All 4 CRUD policies (SELECT, INSERT, UPDATE, DELETE) filter deleted records
- [ ] Partial index created: `idx_opportunity_participants_deleted_at`

---

### CR-002: interaction_participants Missing Soft-Delete in RLS Policies

**Severity:** CRITICAL
**Risk:** Deleted interaction participants remain accessible through RLS bypass
**Impact:** Data integrity violation; soft-deleted records should be hidden at DB layer

**Location:** `supabase/migrations/20251127055705_enhance_rls_security_activities_and_indexes.sql`
**Current State:** RLS policies don't include `deleted_at IS NULL` filter

**Fix Required:** All 4 CRUD policies need soft-delete filtering:
```sql
CREATE POLICY "interact_participants_select"
  ON interaction_participants FOR SELECT
  USING (deleted_at IS NULL AND ...);
```

**Acceptance Criteria:**
- [ ] All SELECT/INSERT/UPDATE/DELETE policies filter `deleted_at IS NULL`
- [ ] Partial index on `interaction_participants(deleted_at)` exists
- [ ] Verify no soft-deleted records queryable via RLS

---

### CR-003: notification_participants Table Never Created But Referenced

**Severity:** CRITICAL
**Risk:** FK constraint mismatch if table renamed/removed
**Impact:** Referential integrity issues; data loss potential

**Location:** Multiple migrations reference `notification_participants` in foreign key definitions
**Current State:** Table doesn't exist in current schema; notifications table has no participants concept

**Fix Required:**
- [ ] Audit all migrations for orphaned references
- [ ] Drop foreign keys referencing non-existent tables
- [ ] Consolidate notification schema around actual design

---

## High Issues [8]

### H-001: product_features Missing Partial Indexes for RLS Subqueries

**Severity:** HIGH
**Risk:** O(n) full table scans on RLS EXISTS checks
**Impact:** Performance degradation on product feature RLS enforcement

**Table:** `product_features` (FK: product_id)
**Current:** Only has regular index on product_id
**Missing:** Partial index with soft-delete filter

**Fix Required:**
```sql
CREATE INDEX IF NOT EXISTS idx_product_features_product_id_active
  ON product_features (product_id)
  WHERE deleted_at IS NULL;
```

**Acceptance Criteria:**
- [ ] Index created and EXPLAIN shows index scan (not seq scan)
- [ ] RLS SELECT policy includes `deleted_at IS NULL`

---

### H-002: opportunity_contacts Partial Indexes Missing

**Severity:** HIGH
**Risk:** RLS EXISTS subqueries cause full table scans
**Impact:** N+1 query patterns under load; slow authorization checks

**Table:** `opportunity_contacts`
**Current:** Has basic indexes, missing partial indexes
**Gap:** Partial index for deleted_at filtering

**Fix Status:** Partially addressed in `20260125041510_add_junction_table_partial_indexes.sql`
**Verification Needed:**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'opportunity_contacts'
  AND indexdef LIKE '%WHERE%deleted_at%';
-- Expected: 2 indexes (one per FK column)
```

---

### H-003: product_distributors RLS Policy Consolidation Incomplete

**Severity:** HIGH
**Risk:** Multiple conflicting policies can cause unexpected access denials
**Impact:** Users may lose access to legitimate product-distributor mappings

**Table:** `product_distributors`
**Current State:** Migration `20260125000007_product_distributors_dual_auth_rls.sql` drops 15 old policies and creates 5 new ones
**Gap:** Need to verify no "zombie" policies remain

**Fix Required:**
```sql
-- Verify exactly 5 policies exist
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'product_distributors'
  AND schemaname = 'public';
-- Expected: 5 (4 CRUD + 1 service_role)

-- Verify policy names
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'product_distributors'
ORDER BY cmd, policyname;
-- Expected:
--   product_distributors_delete_dual_auth | DELETE
--   product_distributors_insert_dual_auth | INSERT
--   product_distributors_select_dual_auth | SELECT
--   product_distributors_update_dual_auth | UPDATE
--   product_distributors_service_role_bypass | ALL
```

**Acceptance Criteria:**
- [ ] Exactly 5 policies exist (no duplicates)
- [ ] All policies named with "dual_auth" suffix (except service_role)
- [ ] No `USING (true)` patterns on WRITE operations

---

### H-004: audit_trail SELECT Policy Still Requires Verification

**Severity:** HIGH
**Risk:** Audit trail may be visible to non-admins
**Impact:** Sensitive record changes exposed to regular users

**Table:** `audit_trail`
**Current:** Policy set to admin-only in `20260122184338_security_remediation.sql`
**Concern:** Verify the admin check function is robust

**Current Implementation:**
```sql
CREATE POLICY "audit_trail_admin_select"
  ON audit_trail FOR SELECT
  USING (is_admin());
```

**Issue:** Depends on `is_admin()` function - need to verify it checks `sales.role = 'admin'` not deprecated `is_admin` column

**Acceptance Criteria:**
- [ ] Audit trail accessible ONLY to role='admin' users
- [ ] Non-admins cannot view any audit records
- [ ] Verify function source: `SELECT prosrc FROM pg_proc WHERE proname = 'is_admin'`

---

### H-005: tags Table WRITE Policies Need CREATE POLICY With Proper Checks

**Severity:** HIGH
**Risk:** Tags are shared resources but might have weak UPDATE/DELETE permissions
**Impact:** Rogue users could delete/modify shared tags affecting entire team

**Table:** `tags`
**Current:** `20260122184338_security_remediation.sql` sets UPDATE/DELETE to admin-only
**Gap:** Need to verify no authentication-only fallback policies exist

**Fix Required:**
```sql
-- Verify exactly 3 policies exist on tags
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'tags' AND schemaname = 'public';
-- Expected: 3 (SELECT + UPDATE + DELETE, all admin-only)
```

**Acceptance Criteria:**
- [ ] SELECT: All authenticated users can read
- [ ] UPDATE: Admin-only
- [ ] DELETE: Admin-only
- [ ] No `USING (true)` on UPDATE/DELETE

---

### H-006: tutorial_progress Missing RLS Policies

**Severity:** HIGH
**Risk:** Users can view/edit other users' tutorial progress
**Impact:** Data leakage; incorrect progress tracking for other team members

**Table:** `tutorial_progress`
**Current:** RLS enabled but policies may be incomplete
**Gap:** Need to verify personal access (self-only)

**Required Policies:**
```sql
-- SELECT: Users can only see their own tutorial progress
CREATE POLICY "tutorial_progress_personal_select"
  ON tutorial_progress FOR SELECT
  USING (
    deleted_at IS NULL
    AND sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  );

-- UPDATE: Users can only update their own records
CREATE POLICY "tutorial_progress_personal_update"
  ON tutorial_progress FOR UPDATE
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Acceptance Criteria:**
- [ ] Personal access (self-only) enforced on SELECT/UPDATE
- [ ] `deleted_at IS NULL` filter included
- [ ] Foreign key index on `tutorial_progress.sales_id` exists

---

### H-007: organization_distributors SELECT Policy May Leak Data

**Severity:** HIGH
**Risk:** SELECT policy doesn't properly isolate distributor visibility
**Impact:** Users might see distributor relationships they shouldn't access

**Table:** `organization_distributors`
**Current:** `20260122184338_security_remediation.sql` fixes this with soft-delete filter
**Verification Needed:**
```sql
SELECT qual FROM pg_policies
WHERE tablename = 'organization_distributors'
  AND policyname = 'select_organization_distributors_visible';
-- Should include: deleted_at IS NULL AND ...
```

**Acceptance Criteria:**
- [ ] Policy includes both conditions: deleted_at filter AND distributor ownership check
- [ ] Admin/manager bypass properly implemented
- [ ] Partial index exists: `idx_organization_distributors_deleted_at`

---

### H-008: tasks_deprecated Read-Only Policy Lacks Soft-Delete Filter

**Severity:** HIGH
**Risk:** Deprecated task records remain queryable
**Impact:** Migration confusion; users may interact with soft-deleted tasks

**Table:** `tasks_deprecated`
**Current:** Migration `20260122184338_security_remediation.sql` attempts fix
**Gap:** Verify migration applied correctly and no write policies exist

**Expected State (after migration):**
```sql
-- Only read-only policy should exist
CREATE POLICY "tasks_deprecated_read_only"
  ON tasks_deprecated FOR SELECT
  USING (deleted_at IS NULL);

-- NO INSERT/UPDATE/DELETE policies
```

**Acceptance Criteria:**
- [ ] Only 1 policy exists (SELECT, read-only)
- [ ] Policy includes `deleted_at IS NULL`
- [ ] Application prevents INSERT/UPDATE/DELETE attempts
- [ ] Migration date: 2026-01-22 or later applied

---

## Medium Issues [5]

### M-001: Missing Indexes on Foreign Key Columns in RLS EXISTS Subqueries

**Severity:** MEDIUM
**Risk:** Performance degradation on large tables
**Impact:** Slow authorization checks; potential for denial of service

**Affected Tables:**
- `opportunity_contacts`: Both FK columns partially indexed (✓)
- `product_distributors`: Both FK columns partially indexed (✓)
- `distributor_principal_authorizations`: Both FK columns partially indexed (✓)
- `interaction_participants`: Missing organization_id index
- `product_distributor_authorizations`: Both FK columns partially indexed (✓)

**Gap:** `interaction_participants.organization_id` missing partial index

**Fix Required:**
```sql
CREATE INDEX IF NOT EXISTS idx_interaction_participants_organization_id_active
  ON interaction_participants (organization_id)
  WHERE deleted_at IS NULL;
```

**Acceptance Criteria:**
- [ ] Index created successfully
- [ ] EXPLAIN shows index scan (not seq scan) on RLS queries

---

### M-002: Partial Indexes on Primary Tables Need Consolidation

**Severity:** MEDIUM
**Risk:** Inconsistent indexing strategy; some filters use partial indexes, others don't
**Impact:** Unpredictable query performance; maintenance complexity

**Status:** Migration `20260115120607_db_hardening.sql` added several partial indexes

**Review Checklist:**
- [ ] `activities.deleted_at` partial index exists
- [ ] `contacts.deleted_at` partial index exists
- [ ] `opportunities.deleted_at` partial index exists
- [ ] `opportunities.organization_id` or `opportunities.principal_organization_id` partial indexes exist
- [ ] `products.deleted_at` partial index exists
- [ ] `organizations.deleted_at` partial index exists

---

### M-003: product_features Table Not Mentioned in Recent Audits

**Severity:** MEDIUM
**Risk:** Orphaned table; may have RLS gaps not addressed by recent migrations
**Impact:** Inconsistent security posture; unaddressed vulnerabilities

**Table:** `product_features`
**Current:** RLS enabled, has basic structure
**Gap:** No mention in security remediation migrations (20260122184338 or 20260125000007)

**Fix Required:**
```sql
-- Verify RLS policies exist and are robust
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'product_features'
ORDER BY cmd, policyname;

-- Should have: SELECT/INSERT/UPDATE/DELETE with proper checks
-- Likely needs: deleted_at IS NULL filter
```

**Acceptance Criteria:**
- [ ] All 4 CRUD policies exist
- [ ] All policies include `deleted_at IS NULL` filter
- [ ] Foreign key index exists on `product_id`
- [ ] created_by audit field verified

---

### M-004: Notification RLS Permissions May Be Overly Permissive

**Severity:** MEDIUM
**Risk:** Users can view other users' notifications
**Impact:** Privacy violation; unintended notification exposure

**Table:** `notifications`
**Current:** RLS enabled, but need to verify personal access

**Verification Needed:**
```sql
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;
```

**Expected:** Personal access (own notifications only)

**Fix If Needed:**
```sql
-- SELECT: Personal access only
CREATE POLICY "notifications_personal_select"
  ON notifications FOR SELECT
  USING (
    deleted_at IS NULL
    AND user_id = auth.uid()
  );

-- UPDATE: Personal access only (marking as read)
CREATE POLICY "notifications_personal_update"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
```

**Acceptance Criteria:**
- [ ] Personal access (user_id = auth.uid()) enforced
- [ ] Soft-delete filtering included
- [ ] No admin bypass (notifications are personal)

---

### M-005: opportunity_participants.organization_id Foreign Key Missing Index

**Severity:** MEDIUM
**Risk:** RLS subqueries checking organization_id will cause table scans
**Impact:** Slow authorization checks on opportunity participant lookups

**Table:** `opportunity_participants`
**Current:** Has `created_by` and `opportunity_id`, missing `organization_id` index

**Fix Required:**
```sql
CREATE INDEX IF NOT EXISTS idx_opportunity_participants_organization_id_active
  ON opportunity_participants (organization_id)
  WHERE deleted_at IS NULL;
```

**Acceptance Criteria:**
- [ ] Index created
- [ ] RLS policy updated to filter by organization access
- [ ] EXPLAIN shows index usage

---

## Low Issues [4]

### L-001: sales Table Missing created_at Trigger Comment

**Severity:** LOW
**Risk:** Inconsistency in timestamp management
**Impact:** Minor; mostly documentation

**Table:** `sales`
**Current:** Trigger exists but documentation unclear

**Fix:** Add comment clarifying timestamp behavior:
```sql
COMMENT ON TRIGGER update_sales_updated_at ON sales IS
  'Automatically update the updated_at column when any field changes';
```

---

### L-002: Audit Trail RLS Does Not Support Event Filtering by Table

**Severity:** LOW
**Risk:** Admins cannot see audit trail for specific records they manage
**Impact:** Difficult troubleshooting; audit trail less useful for field admins

**Table:** `audit_trail`
**Current:** Admin-only access (all records)

**Consider:** Add manager-level policy allowing audit view for own team's records:
```sql
-- Future enhancement: Manager can see audit for records they manage
CREATE POLICY "audit_trail_manager_team_access"
  ON audit_trail FOR SELECT
  USING (
    (SELECT role FROM sales WHERE id = get_current_sales_id()) IN ('admin', 'manager')
    AND record_id IN (SELECT id FROM contacts WHERE created_by IN (
      SELECT id FROM sales WHERE id = get_current_sales_id()
    ))
  );
```

---

### L-003: Soft Delete Columns Lack Indexes on Some Tables

**Severity:** LOW
**Risk:** Queries filtering `deleted_at IS NULL` may not use indexes optimally
**Impact:** Minor performance impact on large tables

**Tables with Missing Indexes:**
- `contact_notes.deleted_at`
- `opportunity_notes.deleted_at`
- `organization_notes.deleted_at`

**Fix:**
```sql
CREATE INDEX idx_contact_notes_deleted_at ON contact_notes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunity_notes_deleted_at ON opportunity_notes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_organization_notes_deleted_at ON organization_notes(deleted_at) WHERE deleted_at IS NULL;
```

---

### L-004: Incomplete Enum Coverage in RLS

**Severity:** LOW
**Risk:** New enum values may bypass RLS checks
**Impact:** Minor; edge case for new role types or stages

**Tables with CHECK Constraints:**
- `opportunity_stage`: 7 values (closed_lost enum exists)
- `user_role`: 3 values (admin, manager, rep)
- `organization_type`: 6 values

**Recommendation:** Document when new enums added, verify RLS policies still apply

---

## Summary by Risk Level

| Severity | Count | Examples |
|----------|-------|----------|
| CRITICAL | 3 | Missing soft-delete filters in RLS; orphaned table references |
| HIGH | 8 | Missing indexes, incomplete policy consolidation, weak admin checks |
| MEDIUM | 5 | Missing indexes, orphaned tables, overly permissive defaults |
| LOW | 4 | Documentation, enum coverage, non-critical optimizations |
| **TOTAL** | **20** | |

---

## Recommendations Priority

### Immediate (This Sprint)
1. **CR-001, CR-002:** Add soft-delete filters to opportunity_participants and interaction_participants RLS
2. **H-001, H-003:** Add missing partial indexes and verify policy consolidation
3. **H-004:** Verify is_admin() function uses role column, not deprecated is_admin boolean

### Next Sprint
4. **CR-003, H-002:** Audit orphaned table references and complete partial indexes
5. **H-005 through H-008:** Complete RLS policy consolidation across remaining tables
6. **M-001 through M-005:** Add missing indexes and soft-delete filtering

### Future Hardening
7. L-001 through L-004: Documentation and optimization enhancements

---

## Verification Commands

### Check RLS Coverage
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
-- Expected: 0 rows (all tables should have RLS enabled)
```

### Find USING(true) Policies
```sql
SELECT schemaname, tablename, policyname, cmd, qual::text
FROM pg_policies
WHERE qual::text LIKE '%true%'
  AND schemaname = 'public'
ORDER BY tablename, cmd;
-- Expected: 0 rows (no USING(true) on WRITE operations)
```

### Check Soft-Delete Policy Coverage
```sql
SELECT schemaname, tablename, policyname, cmd, qual::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'opportunity_participants',
    'interaction_participants',
    'product_features',
    'notifications'
  )
ORDER BY tablename, cmd;
```

### Verify Trigger Coverage
```sql
SELECT event_object_table, trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'update_%_updated_at'
ORDER BY event_object_table;
-- Expected: 11+ tables with update_*_updated_at triggers
```

### Check Index Performance
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM opportunity_contacts
WHERE opportunity_id = 1 AND deleted_at IS NULL;
-- Should show: Index Scan using idx_opportunity_contacts_opportunity_id_partial
-- NOT: Seq Scan
```

---

## Testing Plan

### Security Tests (pgTAP)
```sql
-- Test 1: Non-owner cannot access opportunity_participants
SELECT ok(
  (SELECT COUNT(*) FROM opportunity_participants
   WHERE deleted_at IS NULL) = 0,
  'Non-owner sees no records'
);

-- Test 2: Soft-deleted records hidden
DELETE FROM opportunity_participants WHERE id = 1; -- soft delete
SELECT ok(
  (SELECT COUNT(*) FROM opportunity_participants
   WHERE id = 1) = 0,
  'Soft-deleted records hidden'
);
```

### Performance Tests
```sql
-- Check index usage
EXPLAIN SELECT * FROM opportunity_contacts
WHERE opportunity_id = 1 AND deleted_at IS NULL;
-- Expected: Index Scan (not Seq Scan)
```

---

## Audit Trail
- **2026-01-25:** Initial audit completed, 20 findings identified
- **Status:** Ready for remediation planning

