# Workflow Gaps Audit Report - 2026-01-22

**Status:** CRITICAL - Multiple workflow enforcement gaps detected  
**Confidence:** 92% (database verified, code analyzed, patterns confirmed)  
**File:** `/docs/audits/workflow-gaps-audit-2026-01-22.json`

---

## Executive Summary

Crispy CRM has significant **workflow enforcement gaps** that prevent reliable deal progression tracking. Three critical issues create immediate risk:

1. **No Automatic Activity Logging** - Stage changes aren't recorded as activities
2. **Non-Atomic Close Operations** - Closing deals lacks transactional safety
3. **Silent Workflow Defaults** - Database defaults bypass validation

While **data integrity is strong** (no orphaned opportunities, proper FK constraints), **business logic enforcement is weak** (5/10 score).

---

## Critical Issues (P0 - Do First)

### WF-CRIT-001: Silent Status Defaults
**Risk:** Business logic relies on database DEFAULT clauses instead of API validation

**Evidence:**
- `opportunities.stage` defaults to `'new_lead'` 
- `opportunities.status` defaults to `'active'`
- `contacts.status` defaults to `'cold'`
- `product_distributors.status` defaults to `'pending'`

**Impact:** If UI fails to set a field, DB silently applies default without warning

**Fix:** Move defaults to Zod schemas, remove DB defaults for workflow fields, add NOT NULL constraints

---

### WF-CRIT-002: Opportunity Close Not Atomic
**Risk:** Closing deals (won/lost) lacks comprehensive transaction safety

**Evidence:**
- Validation enforces `win_reason` when `stage='closed_won'` ✅
- But uses generic `updateOpportunitySchema.partial()` which allows skip
- No dedicated `closeOpportunity()` method exists
- No trigger automatically logs stage change as activity

**Impact:** Race conditions possible, audit trail incomplete, loss reasons can disappear

**Fix:** Create `OpportunitiesService.closeOpportunity()` with atomic transaction + trigger

---

### WF-CRIT-003: Missing Stage Change Activity Logging
**Risk:** Deal progression is invisible - no automatic activity record created on stage change

**Evidence:**
```sql
-- Only 9 stage changes logged for 4+ opportunities
SELECT COUNT(*) FROM audit_trail 
WHERE table_name='opportunities' AND field_name='stage'
→ Result: 9 events
```

- No PostgreSQL trigger: `opportunities_stage_changed_log_activity`
- `activitiesExtension.ts` handles reads only, not write automation
- Dashboard metrics (`days_in_stage`) lack supporting activity context

**Impact:** Cannot trace deal progression, stakeholder visibility lost, metrics unreliable

**Fix:** Add PostgreSQL trigger to auto-log stage changes as activity records

---

## High-Priority Issues (P1)

### WF-HIGH-001: Hardcoded Stage Constants
**Risk:** Stage enum defined in DB AND code - risk of drift

**Evidence:**
- `opportunity_stage` enum in PostgreSQL schema
- `STAGE` constants in TypeScript code
- Zod schemas reference constants (lines 11, 286, 432)

**Fix:** Code-generate TypeScript types from DB enum at build time

### WF-HIGH-002: Required FKs Validation Not Consistent
**Risk:** API boundary validation weaker than database constraints

**Impact:** LOW - database schema is correct, but client-side bypass possible

**Fix:** Add CHECK constraint as defense-in-depth

### WF-HIGH-003: Task Migration Not Complete
**Risk:** 13 legacy `tasks_deprecated` records still active with 60-day rollback window

**Evidence:**
- Table exists until 2026-03-21
- `task_id_mapping` maintains mapping
- Application must query both tables or miss data

**Fix:** Complete migration, cleanup mapping table, hard-delete on schedule

### WF-HIGH-004: No State Machine Validation
**Risk:** Can transition directly `new_lead` → `closed_won` without intermediate stages

**Evidence:**
- `updateOpportunitySchema.refine()` only validates field presence, not transitions
- PRD Section 5.2 implies linear progression but code doesn't enforce

**Fix:** Define `VALID_TRANSITIONS` map, add refinement to schema

---

## Medium Issues (P2)

### WF-MED-001: Contact Status Silent Default
**Risk:** New contacts silently marked as `'cold'` (disengaged) by default

### WF-MED-002: Product-Distributor Pending Status
**Risk:** New product-distributor links invisible until admin activates

---

## Scoring

| Category | Score | Notes |
|----------|-------|-------|
| **Data Integrity** | 9/10 | No orphaned records, proper constraints |
| **Database Design** | 8/10 | Correct NOT NULL on key FKs, but silent defaults on status |
| **Validation** | 6/10 | Field-level validation exists, no state machine |
| **Audit Trail** | 4/10 | Only 9 stage changes for 4+ opportunities |
| **Business Logic** | 5/10 | Close operation not atomic, missing stage validation |

---

## Remediation Roadmap

### Week 1: Critical Fixes (3 PRs)
1. **PR: Add Stage Change Activity Trigger** (2 hours)
   - Create PostgreSQL trigger `opportunities_stage_changed_log_activity`
   - Insert activity on stage changes
   - Backfill audit_trail → activities
   
2. **PR: Atomic Opportunity Close** (4 hours)
   - Create `OpportunitiesService.closeOpportunity()`
   - Wrap update + activity + audit in transaction
   - Add database CHECK constraints

3. **PR: Remove Silent Defaults** (2 hours)
   - Remove DB DEFAULT for `stage`, `status`, `contact.status`
   - Add Zod defaults to schemas
   - Update migrations

### Week 2: High-Priority Fixes (2 PRs)
4. **PR: State Machine Validation** (3 hours)
   - Define `VALID_TRANSITIONS` constant
   - Add schema refinement for stage transitions
   - Add tests for invalid paths

5. **PR: Task Migration Cleanup** (2 hours)
   - Verify all queries use `activities` not `tasks_deprecated`
   - Schedule hard delete migration for 2026-03-22
   - Add CI validation

### Week 3: Medium-Priority (1 PR)
6. **PR: Update Status Defaults** (1 hour)
   - Change `contact.status` to NULL
   - Add form field for initial status
   - Backfill logic

---

## Files Involved

**Database/Migrations:**
- `supabase/migrations/20260102180656_remove_operator_org_type.sql`
- `supabase/migrations/20251106185819_add_stage_changed_at_to_opportunities.sql`

**Validation Schemas:**
- `/src/atomic-crm/validation/opportunities/opportunities-operations.ts` (lines 147-423)
- `/src/atomic-crm/validation/opportunities/opportunities-core.ts`

**Handlers/Services:**
- `/src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts`
- `/src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
- `/src/services/OpportunitiesService.ts` (needs enhancement)

**Views/Computation:**
- `opportunities_summary` view
- `activity_log` table

---

## Testing Checklist

- [ ] Create opportunity with stage=new_lead, verify stage_changed_at set
- [ ] Transition opportunity through all valid stage paths
- [ ] Attempt invalid transition new_lead→demo_scheduled, expect validation error
- [ ] Close opportunity as won with win_reason=other, requires close_reason_notes
- [ ] Close without win_reason, expect validation error
- [ ] Close opportunity, verify activity record created automatically
- [ ] Close opportunity, verify audit_trail entry created
- [ ] Query activities WHERE opportunity_id=X AND type LIKE 'Stage Changed%', expect results

---

## References

- Full audit JSON: `/docs/audits/workflow-gaps-audit-2026-01-22.json`
- PRD Section 5.2: Pipeline Stages
- PRD Section 5.3: MVP #12 (Win/Loss Reasons)
- Engineering Constitution: Fail-Fast principle, Zod at boundary
- PROVIDER_RULES.md: Service Layer Encapsulation

---

**Generated:** 2026-01-22  
**Audit Confidence:** 92%  
**Next Review:** 2026-02-22
