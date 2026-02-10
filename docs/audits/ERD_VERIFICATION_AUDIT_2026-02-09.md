# ERD/Documentation Verification Audit

**Audit Date:** 2026-02-09
**Audit Type:** Independent Read-Only Verification
**Auditor:** Claude Code
**Confidence:** 95% (based on direct SQL queries against live database)

---

## 1. Environment Verified

| Property | Value |
|----------|-------|
| Database | Local Supabase PostgreSQL 17 |
| Host | 127.0.0.1:54322 |
| Container | supabase_db_crispy-crm |
| Schema | public |
| Verification Method | Direct SQL via `docker exec psql` |

**Note:** All measurements taken from live database catalog tables (`information_schema`, `pg_*`), not from generated artifacts.

---

## 2. Claim-by-Claim Verdicts

### Schema Statistics

| Claim | Doc Source | Doc Value | Measured Value | Verdict |
|-------|------------|-----------|----------------|---------|
| Total Base Tables | database-erd.md:12 | 28 | **28** | ✅ CONFIRMED |
| Total Views | (counted) | - | **26** | N/A |
| Total Foreign Keys | database-erd.md:13 | 78 | **84** | ⚠️ PARTIALLY CONFIRMED |
| Total Indexes | database-erd.md:14 | 192 | **192** | ✅ CONFIRMED |
| Total RLS Policies | database-erd.md:15 | 107 | **107** | ✅ CONFIRMED |

**FK Discrepancy:** Doc claims 78 relationships, catalog shows 84 FKs. Difference of 6 may be due to schema-metadata.json using SCIP extraction vs actual catalog query.

### Data Quality Claims

| Claim | Doc Source | Doc Value | Measured Value | Verdict |
|-------|------------|-----------|----------------|---------|
| contacts is empty | orphan-analysis.json:15, database-erd.md:48 | 0 rows | **2,007 rows** | ❌ NOT CONFIRMED |
| organizations is empty | orphan-analysis.json:16, database-erd.md:49 | 0 rows | **2,369 rows** | ❌ NOT CONFIRMED |
| opportunities is empty | orphan-analysis.json:17, database-erd.md:50 | 0 rows | **372 rows** | ❌ NOT CONFIRMED |
| activities is empty | orphan-analysis.json:19, database-erd.md:52 | 0 rows | **503 rows** | ❌ NOT CONFIRMED |
| products is empty | orphan-analysis.json:18, database-erd.md:51 | 0 rows | **0 rows** | ✅ CONFIRMED |
| tags is empty | orphan-analysis.json:20, database-erd.md:53 | 0 rows | **0 rows** | ✅ CONFIRMED |
| audit_trail | (not in orphan analysis) | - | **75,029 rows** | N/A (unchecked) |
| tasks_deprecated | (not in orphan analysis) | - | **6 rows** | N/A (unchecked) |
| sales | (not in orphan analysis) | - | **4 rows** | N/A (unchecked) |

**Critical Bug:** database-erd.md shows CONFLICTING data:
- Lines 48-53: Claims contacts, organizations, opportunities, activities are "Empty Tables"
- Line 158: Shows `contacts` (2007 rows)
- Line 192: Shows `organizations` (2369 rows)

The ERD doc merged stale orphan-analysis.json with fresh schema-metadata.json without reconciliation.

### UI Mapping Claims

| Claim | Doc Source | Doc Value | Measured Value | Verdict |
|-------|------------|-----------|----------------|---------|
| Mapped Resources | ui-mapping.json:4 | 21 | **14 with actual UI** | ⚠️ PARTIALLY CONFIRMED |
| Total Components | ui-mapping.json:5 | 75 | ~75 (not verified) | ⚠️ NOT VERIFIED |
| Total Database Tables | SUMMARY.md:14 | 34 | **28** | ❌ NOT CONFIRMED |
| Resources with UI | SUMMARY.md:15 | 14 | **14** (matches) | ✅ CONFIRMED |

**Count Discrepancy Analysis:**
- ui-mapping.json `summary.total_resources`: 21
- ui-mapping.json `resources` array length: 34 entries (includes unmapped)
- SUMMARY.md claims 14 "Resources with UI": **Correct**
- SUMMARY.md claims 34 "Total Database Tables": **Incorrect** (actual: 28)

### Object Type Claims

| Object | Claimed Type | Actual Type | Verdict |
|--------|--------------|-------------|---------|
| tasks | TABLE | **Does not exist** | ❌ NOT CONFIRMED |
| tasks_deprecated | TABLE | **TABLE** | ✅ CONFIRMED |
| entity_timeline | TABLE (implied) | **VIEW** | ⚠️ MISLEADING |
| tasks_v | VIEW | **VIEW** | ✅ CONFIRMED |
| priority_tasks | VIEW | **VIEW** | ✅ CONFIRMED |

**Critical Issue:** The `tasks` table does not exist. UI mapping references `tasks` resource but should map to `tasks_deprecated`.

### exec_sql Security Function

| Claim | Migration File | Actual Database | Verdict |
|-------|----------------|-----------------|---------|
| Function exists | Yes (20260209000001) | **NOT APPLIED** | ❌ NOT CONFIRMED |
| Owner | postgres (expected) | N/A | N/A |
| SECURITY DEFINER | Yes | N/A | N/A |
| Grants | service_role only (code check) | N/A | N/A |

**Evidence:**
```sql
SELECT proname FROM pg_proc WHERE proname='exec_sql';
-- Result: 0 rows
```

The migration file exists at `supabase/migrations/20260209000001_add_exec_sql_function.sql` but has not been applied to the database.

---

## 3. Orphan Analysis Reliability Assessment

### Coverage Gaps

| Metric | Value |
|--------|-------|
| Total base tables in database | 28 |
| Tables checked by orphan-analysis.ts | **7** |
| Tables NOT checked | **21** |
| Non-existent tables in script | **11** |

### Tables NOT Checked by Orphan Analysis

```
audit_trail, contact_notes, dashboard_snapshots,
distributor_principal_authorizations, interaction_participants,
migration_history, notifications, opportunity_contacts,
opportunity_notes, opportunity_participants, opportunity_products,
organization_distributors, organization_notes,
product_distributor_authorizations, sales, segments,
task_id_mapping, tasks_deprecated, test_user_metadata,
tutorial_progress, user_favorites
```

### Non-Existent Tables Referenced in Script

```
companies, users, principals, distributors, product_categories,
tasks, contact_tags, opportunity_tags, organization_tags,
contact_organizations, sales_reps
```

### Root Causes

1. **Hardcoded table list** (orphan-analysis.ts:100-119) - script uses static list instead of querying catalog
2. **Anon key access** - uses `VITE_SUPABASE_ANON_KEY` which respects RLS, may hide data
3. **Stale table names** - references legacy/removed tables
4. **No catalog validation** - doesn't verify tables exist before querying

### Verdict

**Orphan Analysis: UNRELIABLE**

The "0 orphaned records" claim cannot be trusted because:
- 75% of tables (21/28) are never checked
- The script silently fails on non-existent tables
- RLS may filter out records that are actually visible to service_role

---

## 4. Major Risks

### Priority 1 (Critical)

1. **Data Integrity Blind Spot**: Only 7 of 28 tables are checked for orphans. Unknown orphan count for 21 tables including `opportunity_notes`, `contact_notes`, `tasks_deprecated`.

2. **exec_sql Migration Not Applied**: SECURITY DEFINER function exists in migration but not in database. If applied later with `search_path` vulnerabilities, could enable SQL injection.

3. **tasks Table Phantom**: UI references `tasks` resource but table doesn't exist. Could cause runtime errors if not mapped correctly to `tasks_deprecated`.

### Priority 2 (High)

4. **ERD Doc Self-Contradictory**: Same document claims tables are "empty" while showing non-zero row counts. Undermines trust in documentation.

5. **UI Mapping Count Inflation**: Claims 34 "Total Database Tables" but only 28 exist. Claims 21 "Mapped Resources" but only 14 have actual UI components.

---

## 5. Confidence Level

**Overall Confidence: MEDIUM (65%)**

**Reasons:**
- ✅ Schema statistics (tables, indexes, RLS) are accurate
- ❌ Row count claims are demonstrably false
- ❌ Orphan analysis has 75% coverage gap
- ❌ exec_sql function not yet deployed
- ⚠️ UI mapping counts inconsistent across documents
- ⚠️ entity_timeline treated as table but is a view

---

## 6. Recommended Next Actions

### Immediate (Non-Destructive)

1. **Regenerate orphan-analysis.json** after fixing script to:
   - Query `information_schema.tables` for actual table list
   - Use service_role key (not anon) to bypass RLS
   - Remove hardcoded table list

2. **Reconcile ERD doc** - regenerate after fixing orphan-analysis to eliminate "empty tables" contradiction

3. **Update UI mapping** - change `tasks` references to `tasks_deprecated` or verify handler routing

4. **Document entity_timeline** - clarify it's a VIEW in all references

### Before Applying exec_sql Migration

5. **Security review** of exec_sql function:
   - Verify `SET search_path = public` in function definition
   - Add rate limiting or audit logging
   - Consider using `pg_read_all_data` role instead of dynamic SQL

### Database Validation

6. **Run comprehensive FK orphan check** using service_role:
   ```sql
   -- Example for each FK relationship
   SELECT 'opportunity_notes' as table_name, count(*)
   FROM opportunity_notes n
   LEFT JOIN opportunities o ON n.opportunity_id = o.id
   WHERE o.id IS NULL AND n.deleted_at IS NULL;
   ```

---

## 7. Evidence Commands Used

```bash
# Environment
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "..."

# Base tables
SELECT count(*) FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE';
-- Result: 28

# Views
SELECT count(*) FROM information_schema.views WHERE table_schema='public';
-- Result: 26

# Foreign keys
SELECT count(*) FROM information_schema.table_constraints
WHERE table_schema='public' AND constraint_type='FOREIGN KEY';
-- Result: 84

# Indexes
SELECT count(*) FROM pg_indexes WHERE schemaname='public';
-- Result: 192

# RLS policies
SELECT count(*) FROM pg_policies WHERE schemaname='public';
-- Result: 107

# Core row counts
SELECT 'contacts', count(*) FROM public.contacts
UNION ALL SELECT 'organizations', count(*) FROM public.organizations
-- contacts: 2007, organizations: 2369, opportunities: 372, activities: 503

# Object types
SELECT relname, relkind FROM pg_class WHERE relname IN ('tasks','tasks_deprecated','entity_timeline');
-- tasks: not found, tasks_deprecated: TABLE (r), entity_timeline: VIEW (v)

# exec_sql existence
SELECT proname FROM pg_proc WHERE proname='exec_sql' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');
-- Result: 0 rows
```

---

## Appendix: Verified Views (26 total)

```
activities_summary, activities_with_task_details, authorization_status,
campaign_choices, contactNotes, contacts_summary, contacts_with_account_manager,
dashboard_pipeline_summary, dashboard_principal_summary, distinct_opportunities_campaigns,
distinct_product_categories, entity_timeline, opportunities_summary, opportunityNotes,
opportunity_stage_changes, organizationNotes, organization_primary_distributor,
organizations_summary, organizations_with_account_manager, principal_opportunities,
principal_pipeline_summary, priority_tasks, product_distributors_summary,
products_summary, tasks_summary, tasks_v
```

---

*Audit completed 2026-02-09. All findings based on read-only database queries.*
