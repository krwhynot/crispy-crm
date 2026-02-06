# Activity Timeline RLS Audit

**Date:** 2026-02-05 (Updated after consolidation)
**Auditor:** Claude
**Database:** Local Supabase
**Status:** ✅ CONSOLIDATED

---

## 1. User Roles in System

| ID | Email | Role | Name |
|----|-------|------|------|
| 3 | admin@test.com | **admin** | Admin User |
| 5 | manager@mfbroker.com | **manager** | Manager Test |
| 1 | sue@mfbroker.com | **rep** | Sue Martinez |
| 2 | bramsy@masterfoodbokers.com | **rep** | (unnamed) |
| 7 | rep@mfbroker.com | **rep** | Rep Test |

---

## 2. Activity Types in Database

| activity_type | type | Count | Description |
|---------------|------|-------|-------------|
| `activity` | call | 1 | Logged phone calls |
| `activity` | email | 1 | Logged emails |
| `activity` | meeting | 1 | Logged meetings |
| `activity` | follow_up | 1 | Follow-up activities |
| `activity` | note | 121 | Notes on contacts/orgs |
| `task` | call | 6 | Tasks to make calls |

---

## 3. RLS Policies on `activities` Table

### 3.1 SELECT Policy (Read Access)

**Policy Name:** `activities_select_unified`

```sql
USING (deleted_at IS NULL)
```

| User Role | Can Read Activities? | Can Read Tasks? | Notes |
|-----------|---------------------|-----------------|-------|
| **Admin** | ✅ All | ✅ All | Full visibility |
| **Manager** | ✅ All | ✅ All | Full visibility |
| **Rep** | ✅ All | ✅ All | Full visibility |
| **Unauthenticated** | ❌ None | ❌ None | Policy requires `authenticated` role |

**Current Status:** ✅ All authenticated users can see all activities and tasks (after fix applied 2026-02-05)

---

### 3.2 INSERT Policy (Create Access)

**Policy Name:** `activities_insert_policy`

```sql
WITH CHECK (
  (is_manager_or_admin() OR created_by = current_sales_id() OR sales_id = current_sales_id())
  AND (opportunity_id IS NULL OR EXISTS (SELECT 1 FROM opportunities WHERE id = opportunity_id AND deleted_at IS NULL))
  AND (organization_id IS NULL OR EXISTS (SELECT 1 FROM organizations WHERE id = organization_id AND deleted_at IS NULL))
)
```

| User Role | Can Create for Self? | Can Create for Others? | Notes |
|-----------|---------------------|------------------------|-------|
| **Admin** | ✅ Yes | ✅ Yes | Can assign to anyone |
| **Manager** | ✅ Yes | ✅ Yes | Can assign to anyone |
| **Rep** | ✅ Yes | ❌ No | Can only create where `created_by` or `sales_id` = self |

**Validation:**
- ✅ Opportunity must exist (if linked)
- ✅ Organization must exist (if linked)
- ✅ Soft-deleted records rejected

---

### 3.3 UPDATE Policies (Edit Access)

**Policy 1:** `activities_update_unified`

```sql
USING/WITH CHECK (
  deleted_at IS NULL
  AND CASE
    WHEN activity_type = 'task' THEN (is_admin_or_manager() OR sales_id = current_sales_id())
    ELSE true
  END
)
```

**Policy 2:** `activities_update_owner_or_privileged`

```sql
USING/WITH CHECK (is_owner_or_privileged(created_by))
```

| User Role | Can Update Own Activities? | Can Update Others' Activities? | Can Update Own Tasks? | Can Update Others' Tasks? |
|-----------|---------------------------|-------------------------------|----------------------|--------------------------|
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Manager** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Rep** | ✅ Yes | ❌ No | ✅ Yes (if assigned) | ❌ No |

**Notes:**
- Non-task activities: Open to all authenticated users (may need review)
- Tasks: Restricted to assignee (sales_id) or admin/manager

---

### 3.4 DELETE Policies (Remove Access)

**Policy 1:** `activities_delete_unified`

```sql
USING (
  deleted_at IS NULL
  AND (is_admin() OR created_by = current_sales_id() OR (activity_type = 'task' AND sales_id = current_sales_id()))
)
```

**Policy 2:** `delete_activities`

```sql
USING (is_admin() OR is_manager_or_admin() OR created_by = current_sales_id())
```

| User Role | Can Delete Own Activities? | Can Delete Others' Activities? | Can Delete Own Tasks? | Can Delete Others' Tasks? |
|-----------|---------------------------|-------------------------------|----------------------|--------------------------|
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Manager** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Rep** | ✅ Yes (created_by) | ❌ No | ✅ Yes (if assigned) | ❌ No |

---

## 4. Helper Functions Summary

| Function | Purpose | Admin | Manager | Rep |
|----------|---------|-------|---------|-----|
| `is_admin()` | Checks if user has admin role | ✅ true | ❌ false | ❌ false |
| `is_manager_or_admin()` | Checks if user has admin or manager role | ✅ true | ✅ true | ❌ false |
| `is_admin_or_manager()` | Same as above (alias) | ✅ true | ✅ true | ❌ false |
| `current_sales_id()` | Returns user's sales.id | 3 | 5 | 1, 2, or 7 |
| `is_owner_or_privileged(owner_id)` | Checks if user owns record or is privileged | ✅ always | ✅ always | Only if owner |

---

## 5. Entity Timeline View

**View Name:** `entity_timeline`
**Security:** `SECURITY INVOKER = true` (RLS policies apply)

```sql
SELECT ... FROM activities
WHERE deleted_at IS NULL
  AND (activity_type != 'task' OR snooze_until IS NULL OR snooze_until <= NOW());
```

**What shows in timeline:**

| Entry Type | Filter Applied | Visible To |
|------------|----------------|------------|
| Activities (calls, emails, meetings, notes) | `deleted_at IS NULL` | All authenticated users |
| Tasks | `deleted_at IS NULL AND (snooze_until IS NULL OR snooze_until <= NOW())` | All authenticated users |

**Snoozed Tasks:** Hidden until `snooze_until` date passes

---

## 6. Access Matrix (Complete)

### READ Access

| Data Type | Admin | Manager | Rep (Own) | Rep (Others) |
|-----------|-------|---------|-----------|--------------|
| Activities (calls, emails, meetings) | ✅ | ✅ | ✅ | ✅ |
| Notes | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ |
| Snoozed Tasks | Hidden | Hidden | Hidden | Hidden |

### CREATE Access

| Data Type | Admin | Manager | Rep (Own) | Rep (For Others) |
|-----------|-------|---------|-----------|------------------|
| Activities | ✅ | ✅ | ✅ | ❌ |
| Notes | ✅ | ✅ | ✅ | ❌ |
| Tasks | ✅ | ✅ | ✅ | ❌ |

### UPDATE Access

| Data Type | Admin | Manager | Rep (Own) | Rep (Others) |
|-----------|-------|---------|-----------|--------------|
| Activities (non-task) | ✅ | ✅ | ✅ | ⚠️ Maybe* |
| Tasks | ✅ | ✅ | ✅ (if assigned) | ❌ |

*Note: `activities_update_unified` allows all users to update non-task activities. This may be too permissive.

### DELETE Access

| Data Type | Admin | Manager | Rep (Own) | Rep (Others) |
|-----------|-------|---------|-----------|--------------|
| Activities | ✅ | ✅ | ✅ (if creator) | ❌ |
| Tasks | ✅ | ✅ | ✅ (if assigned) | ❌ |

---

## 7. Potential Issues Found

### Issue 1: ⚠️ Overlapping UPDATE Policies

Two UPDATE policies exist:
1. `activities_update_unified` - Task-specific logic
2. `activities_update_owner_or_privileged` - Owner/privilege check

**Risk:** For non-task activities, `activities_update_unified` returns `true` for all users, potentially bypassing ownership checks.

**Recommendation:** Review if non-task activities should be editable by anyone or only by creator/privileged users.

### Issue 2: ⚠️ Overlapping DELETE Policies

Two DELETE policies exist:
1. `activities_delete_unified`
2. `delete_activities`

**Risk:** Policy overlap may cause confusion. In PostgreSQL, permissive policies use OR logic (if any policy allows, access is granted).

**Recommendation:** Consolidate into single policy for clarity.

### Issue 3: ✅ SELECT Policy Now Permissive

After today's fix, all authenticated users can see all activities and tasks. This aligns with the business requirement for full team visibility.

---

## 8. Recommended RLS Policy Structure

### Simplified Policy Set

```sql
-- SELECT: All authenticated users see all (soft-delete filtered)
CREATE POLICY "activities_select" ON activities FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: Creator must be self, or be admin/manager to assign to others
CREATE POLICY "activities_insert" ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    is_manager_or_admin()
    OR created_by = current_sales_id()
    OR sales_id = current_sales_id()
  );

-- UPDATE: Creator/assignee can edit own, admin/manager can edit all
CREATE POLICY "activities_update" ON activities FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (is_manager_or_admin() OR created_by = current_sales_id() OR sales_id = current_sales_id())
  )
  WITH CHECK (
    is_manager_or_admin() OR created_by = current_sales_id() OR sales_id = current_sales_id()
  );

-- DELETE: Admin/manager can delete all, creator/assignee can delete own
CREATE POLICY "activities_delete" ON activities FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (is_admin() OR created_by = current_sales_id() OR sales_id = current_sales_id())
  );
```

---

## 9. Summary

| Operation | Current State | Recommendation |
|-----------|--------------|----------------|
| **SELECT** | ✅ All users see all | Keep as-is |
| **INSERT** | ✅ Proper ownership enforcement | Keep as-is |
| **UPDATE** | ⚠️ Two overlapping policies | Consolidate |
| **DELETE** | ⚠️ Two overlapping policies | Consolidate |

---

## 10. Final Consolidated State (After Fix)

**Migration Applied:** `20260205000002_consolidate_activities_rls_policies.sql`

### Consolidated Policies (4 total)

| Policy | Command | Rule |
|--------|---------|------|
| `activities_select` | SELECT | `deleted_at IS NULL` |
| `activities_insert` | INSERT | Admin/Manager for anyone, Reps for self only |
| `activities_update` | UPDATE | Admin/Manager for all, Reps for own only |
| `activities_delete` | DELETE | Admin/Manager for all, Reps for own only |

### Final Access Matrix

| Operation | Admin | Manager | Rep (Own) | Rep (Others) |
|-----------|-------|---------|-----------|--------------|
| **View all activities** | ✅ | ✅ | ✅ | ✅ |
| **View all tasks** | ✅ | ✅ | ✅ | ✅ |
| **Create for self** | ✅ | ✅ | ✅ | - |
| **Create for others** | ✅ | ✅ | ❌ | - |
| **Edit own activities** | ✅ | ✅ | ✅ | - |
| **Edit others' activities** | ✅ | ✅ | ❌ | - |
| **Edit own tasks** | ✅ | ✅ | ✅ | - |
| **Edit others' tasks** | ✅ | ✅ | ❌ | - |
| **Delete own** | ✅ | ✅ | ✅ | - |
| **Delete others'** | ✅ | ✅ | ❌ | - |

### Ownership Definition

A rep "owns" an activity/task if:
- `created_by = current_sales_id()` (they created it), OR
- `sales_id = current_sales_id()` (they are assigned to it)

---

**Audit Complete**
