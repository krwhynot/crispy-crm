# Workflow Gaps Audit - Phase 3: Database Consistency Checks

**Date:** 2026-01-10
**Mode:** Full Audit
**Status:** ⚠️ REQUIRES MANUAL EXECUTION (Docker not running)

---

## Executive Summary

Phase 3 of the workflow gaps audit checks for **data consistency issues** at the database layer that could indicate:
- Business logic gaps (missing constraints)
- Silent defaults creating invalid states
- Orphaned records from missing cascade rules
- State transition anomalies

**Execution Status:** Docker daemon is not running, preventing local Supabase database access. All SQL queries are documented below for manual execution once Docker is available.

---

## Prerequisites

Before running these checks:

```bash
# 1. Start Docker daemon (requires sudo)
sudo service docker start

# 2. Start Supabase local stack
npx supabase start

# 3. Verify database is running
docker ps | grep supabase_db
```

---

## Database Consistency Checks

### 3.1 Opportunities Without Principal

**Issue:** Opportunities should always be linked to a Principal (manufacturer). Missing principal_id indicates a business logic gap.

**SQL Query:**
```sql
SELECT id, name, stage, created_at
FROM opportunities
WHERE principal_id IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Expected Result:** 0 records
**Severity:** HIGH (if > 0 records found)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT id, name, stage, created_at
FROM opportunities
WHERE principal_id IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
"
```

---

### 3.2 Orphaned Pipeline Stages

**Issue:** Opportunities with stages outside the 7 valid values indicate data corruption or missing validation.

**Valid Stages:**
1. `new_lead`
2. `initial_outreach`
3. `sample_visit_offered`
4. `feedback_logged`
5. `demo_scheduled`
6. `closed_won`
7. `closed_lost`

**SQL Query:**
```sql
SELECT stage, COUNT(*) as count
FROM opportunities
WHERE stage NOT IN (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
)
AND deleted_at IS NULL
GROUP BY stage
ORDER BY count DESC;
```

**Expected Result:** 0 records
**Severity:** CRITICAL (if any records found)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT stage, COUNT(*) as count
FROM opportunities
WHERE stage NOT IN (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
)
AND deleted_at IS NULL
GROUP BY stage
ORDER BY count DESC;
"
```

---

### 3.3 Contacts Without Organization

**Issue:** Contacts should always be linked to at least one Organization via the `contact_organizations` junction table.

**SQL Query:**
```sql
SELECT c.id, c.first_name, c.last_name, c.created_at
FROM contacts c
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM contact_organizations co
  WHERE co.contact_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 20;
```

**Expected Result:** 0 records (or <5% of total contacts)
**Severity:** MEDIUM (if > 5% of contacts affected)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT c.id, c.first_name, c.last_name, c.created_at
FROM contacts c
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM contact_organizations co
  WHERE co.contact_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 20;
"
```

---

### 3.4 Closed Opportunities Without Reason

**Issue:** Opportunities marked as won/lost should have a `close_reason` explaining the outcome.

**SQL Query:**
```sql
SELECT id, name, stage, closed_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND close_reason IS NULL
AND deleted_at IS NULL
ORDER BY closed_at DESC
LIMIT 20;
```

**Expected Result:** 0 records
**Severity:** MEDIUM (business intelligence gap)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT id, name, stage, closed_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND close_reason IS NULL
AND deleted_at IS NULL
ORDER BY closed_at DESC
LIMIT 20;
"
```

---

### 3.5 Activities Without Type

**Issue:** All activities should have an `activity_type` (call, email, sample, etc.).

**SQL Query:**
```sql
SELECT id, created_at, opportunity_id
FROM activities
WHERE activity_type IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Expected Result:** 0 records
**Severity:** MEDIUM (reporting gap)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT id, created_at, opportunity_id
FROM activities
WHERE activity_type IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
"
```

---

### 3.6 State Transition Anomalies

**Issue:** Opportunities that went from creation to closed_won/closed_lost with no intermediate updates suggest:
- Bulk import with incorrect data
- Missing state transition tracking
- Bypassed business logic

**SQL Query:**
```sql
SELECT id, name, stage, created_at, updated_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND created_at = updated_at
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:** 0 records
**Severity:** HIGH (indicates bypassed workflow)

**Execution:**
```bash
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "
SELECT id, name, stage, created_at, updated_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND created_at = updated_at
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
"
```

---

## Execution Instructions

### Option 1: Execute All Checks (Recommended)

```bash
# Save all queries to a file
cat > /tmp/workflow-gaps-phase3.sql <<'EOF'
-- 3.1 Opportunities Without Principal
SELECT '=== 3.1 Opportunities Without Principal ===' as check;
SELECT id, name, stage, created_at
FROM opportunities
WHERE principal_id IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3.2 Orphaned Pipeline Stages
SELECT '=== 3.2 Orphaned Pipeline Stages ===' as check;
SELECT stage, COUNT(*) as count
FROM opportunities
WHERE stage NOT IN (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
)
AND deleted_at IS NULL
GROUP BY stage
ORDER BY count DESC;

-- 3.3 Contacts Without Organization
SELECT '=== 3.3 Contacts Without Organization ===' as check;
SELECT c.id, c.first_name, c.last_name, c.created_at
FROM contacts c
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM contact_organizations co
  WHERE co.contact_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 20;

-- 3.4 Closed Opportunities Without Reason
SELECT '=== 3.4 Closed Opportunities Without Reason ===' as check;
SELECT id, name, stage, closed_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND close_reason IS NULL
AND deleted_at IS NULL
ORDER BY closed_at DESC
LIMIT 20;

-- 3.5 Activities Without Type
SELECT '=== 3.5 Activities Without Type ===' as check;
SELECT id, created_at, opportunity_id
FROM activities
WHERE activity_type IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3.6 State Transition Anomalies
SELECT '=== 3.6 State Transition Anomalies ===' as check;
SELECT id, name, stage, created_at, updated_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND created_at = updated_at
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
EOF

# Execute all checks
docker exec -i supabase_db_crispy-crm psql -U postgres -d postgres < /tmp/workflow-gaps-phase3.sql
```

### Option 2: Execute Individual Checks

Use the individual docker exec commands provided in each section above.

---

## Interpreting Results

### Severity Assessment

| Records Found | Severity | Action Required |
|---------------|----------|-----------------|
| 0 | ✅ PASS | No action needed |
| 1-5 | ⚠️ LOW | Review records manually |
| 6-20 | ⚠️ MEDIUM | Investigate root cause |
| 21-50 | 🔴 HIGH | Fix business logic gaps |
| 50+ | 🔴 CRITICAL | Data integrity compromised |

### Root Cause Analysis

For each check that finds records:

1. **Identify Pattern:**
   - Recent records (created in last 7 days) → Active bug
   - Old records (created >30 days ago) → Historical data issue
   - Specific user/source → Import or migration problem

2. **Check Business Logic:**
   - Review Zod schemas for missing required fields
   - Check database constraints (NOT NULL, CHECK)
   - Verify form validation rules

3. **Fix Strategy:**
   - **Data Fix:** UPDATE records to valid state
   - **Schema Fix:** Add database constraints
   - **Code Fix:** Update Zod schemas to prevent future occurrences

---

## Next Steps

1. **Start Docker:** `sudo service docker start`
2. **Start Supabase:** `npx supabase start`
3. **Run Checks:** Execute Option 1 (all checks) from above
4. **Report Results:** Document findings in this file under "Results" section (below)
5. **Create Fixes:** Generate TODOs for any issues found

---

## Results

*This section will be populated after executing the checks.*

### Summary Table

| Check | Records Found | Severity | Status |
|-------|---------------|----------|--------|
| 3.1 Opportunities Without Principal | - | - | ⏳ Pending |
| 3.2 Orphaned Pipeline Stages | - | - | ⏳ Pending |
| 3.3 Contacts Without Organization | - | - | ⏳ Pending |
| 3.4 Closed Opportunities Without Reason | - | - | ⏳ Pending |
| 3.5 Activities Without Type | - | - | ⏳ Pending |
| 3.6 State Transition Anomalies | - | - | ⏳ Pending |

### Detailed Findings

*Paste output from each check here.*

---

## References

- **Full Audit Report:** `/home/krwhynot/projects/crispy-crm/docs/audits/2026-01-09-full-audit.md`
- **Provider Audit Report:** `/home/krwhynot/projects/crispy-crm/docs/PROVIDER_AUDIT_REPORT.md`
- **Engineering Constitution:** `.claude/skills/engineering-constitution/skill.md`
- **Supabase CLI Reference:** `.claude/skills/supabase-cli/skill.md`
