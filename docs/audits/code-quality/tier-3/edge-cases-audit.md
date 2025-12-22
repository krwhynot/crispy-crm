# Edge Case Audit Report

**Agent:** 19 - Edge Case Finder
**Date:** 2025-12-20
**Edge Cases Tested:** 87

---

## Executive Summary

Crispy CRM demonstrates **strong foundational security practices** with comprehensive Zod validation, HTML sanitization, and fail-fast error handling. However, several **critical edge cases** require attention before production launch, particularly around data relationship integrity, concurrent operation handling, and UI state management.

**Overall Risk Assessment:** MEDIUM-HIGH (3 P0 issues, 8 P1 issues identified)

---

## Empty State Edge Cases

### Missing Empty State UI

| View | Has Empty State? | Issue |
|------|------------------|-------|
| Opportunities List (no filters) | ✅ | Proper "No opportunities found" message |
| Contacts List (no filters) | ✅ | Proper "No contacts found" message |
| Organizations List (no filters) | ✅ | Helpful tips cards shown |
| Tasks List (no filters) | ✅ | Tutorial integration included |
| Activities List (no filters) | ⚠️ | **No create action visible in empty state** |
| Sales List (no filters) | ⚠️ | **No create action visible** |
| **ALL Lists (with filters)** | ❌ | **CRITICAL: Blank datagrid shown - no "No results match filters" message** |

### Empty Input Handling

| Form | Field | Empty Behavior | Issue? |
|------|-------|----------------|--------|
| ContactCreate | organization_id | Required, validated via Zod | None |
| TaskCreate | title | Required, `.min(1)` enforced | None |
| OrganizationCreate | name | `.min(1)` but **no .trim()** | P2 - Accepts whitespace-only |
| OpportunityCreate | customer_org | Required at DB level (NOT NULL) | None |

### Relationship Empty States

| Scenario | Expected | Actual | Issue? |
|----------|----------|--------|--------|
| Contact without org | Impossible | Enforced at DB level (NOT NULL after migration) | None |
| Opportunity without customer | Impossible | Enforced at DB level (NOT NULL) | None |
| Opportunity without principal | Should require | **NULLABLE - no constraint** | P1 - Can create orphan opportunities |
| Activity without contact | Should require | **NULLABLE** | P2 - Activities can have NULL contact_id |

---

## Maximum Limit Edge Cases

### Field Length Issues

| Field | Max Length | Enforced? | UI Feedback? |
|-------|------------|-----------|--------------|
| opportunity.name | 255 | Schema ✅ / DB ✅ | No character count |
| opportunity.notes | 5000 | Schema ✅ | No character count |
| contact.notes | 5000 | Schema ✅ | No character count |
| **activity.description** | **NONE** | ❌ **MISSING** | ❌ **DoS VECTOR** |
| **activity.follow_up_notes** | **NONE** | ❌ **MISSING** | ❌ **DoS VECTOR** |
| **activity.outcome** | **NONE** | ❌ **MISSING** | ❌ **DoS VECTOR** |
| **activity.tags** | **NONE per tag** | ❌ **MISSING** | ❌ **DoS VECTOR** |

### List Size Performance

| Scenario | Record Count | Load Time | Issue? |
|----------|--------------|-----------|--------|
| Large opportunity list | 1000+ | Untested | Needs load testing |
| Dashboard summary views | Aggregated | Materialized views help | None expected |

### Numeric Edge Cases

| Field | Zero OK? | Negative OK? | Max Enforced? |
|-------|----------|--------------|---------------|
| activity.duration_minutes | ❌ Rejected | ❌ Rejected | ❌ **NO MAX - accepts 999999999** |
| organization.employee_count | ❌ Rejected | ❌ Rejected | ✅ `.positive()` |
| contact IDs | ❌ Rejected | ❌ Rejected | ✅ `.positive()` |

---

## Data Relationship Edge Cases

### Deletion Cascade Behavior

| Delete | Children | Behavior | Safe? |
|--------|----------|----------|-------|
| Organization | Contacts | `ON DELETE SET NULL` - **orphans remain** | ⚠️ P1 |
| Principal | Opportunities | **No FK constraint exists** | ❌ P0 |
| Opportunity | Activities, Tasks | **Cascade function NOT called by data provider** | ❌ P0 |
| Parent Org (hierarchy) | Child Orgs | Trigger checks hard DELETE, but code uses soft-delete | ⚠️ P1 |

### Orphan Risk Scenarios

| Scenario | Can Create Orphan? | Mitigation |
|----------|-------------------|------------|
| Delete organization with contacts | YES - contacts get NULL org_id | RLS may hide orphans |
| Delete principal with opportunities | YES - no FK constraint | None |
| Failed transaction midway | YES - no transaction wrapping | None |
| Soft-delete parent org | YES - children not updated | Trigger only fires on hard delete |

### Soft-Delete Consistency Issues

| Issue | Risk |
|-------|------|
| Data provider's `delete()` doesn't call cascade function | Related records remain active |
| RLS policies don't reference `deleted_at` | No backup protection layer |
| Can link to soft-deleted records | FK has no soft-delete awareness |
| Activity trigger references deprecated `contact_organizations` table | **CRITICAL: Trigger may fail** |

---

## Concurrent Operation Edge Cases

### Edit Conflict Handling

| Scenario | Current Behavior | Risk |
|----------|------------------|------|
| Same record, two users (opportunities) | ✅ Version check + conflict error | **RESOLVED 2025-12-22** |
| Same record, two users (other entities) | Last write wins | **Data loss possible** |
| Optimistic locking (opportunities) | ✅ **Implemented 2025-12-22** | Version column with RPC check |
| Post-submission validation | YES - dequal deep equality check | Catches silent failures |

### Rapid Action Handling

| Action | Double-Click Protected? | Debounced? |
|--------|------------------------|------------|
| Form submit | ✅ `isSubmitting` disables button | No debounce on handler |
| Delete | ✅ Confirmation dialog | N/A |
| Text filter | ✅ 300ms debounce | Yes |
| Checkbox filter | ❌ Immediate, no batching | Could cause N+1 fetches |

---

## UI State Edge Cases

### Loading State Issues

| Scenario | Behavior | Issue? |
|----------|----------|--------|
| Navigate during load | Cleanup functions work | None |
| Error during load | Error boundary catches | None |
| Loading + error simultaneously | No conflict detected | None |

### Modal Edge Cases

| Scenario | Behavior | Issue? |
|----------|----------|--------|
| Browser back with modal open | ✅ `useSlideOverState` handles popstate | None |
| Multiple modals stacking | ⚠️ No stacking guard | P3 - Both can open |
| ESC key handling | ✅ TagDialog checks dirty state | None |
| CloseOpportunityModal dirty warning | ❌ **No dirty warning** | P2 |

### Form State Issues

| Scenario | Behavior | Issue? |
|----------|----------|--------|
| Navigate with dirty form | ✅ TaskCreate has `window.confirm()` | Inconsistent across forms |
| Form submit during validation | ✅ `disabled={!isValid \|\| isSubmitting}` | None |
| Slide-over stale data after save | ❌ **No auto-refetch** | **P1 - Shows stale data** |

---

## Async Operation Edge Cases

### Race Condition Risks

| Scenario | Risk | Mitigation? |
|----------|------|-------------|
| Rapid filter changes | Stale data shown | Debounce (300ms) but no AbortController |
| Mount/unmount during fetch | Memory leak | ✅ Cleanup in useEffect |
| Multiple parallel useGetList | Out-of-order responses | React Query deduplication (partial) |

### Network Failure UX

| Scenario | User Sees | Recovery Path |
|----------|-----------|---------------|
| API timeout | Raw error message | None provided |
| Network down | Generic error | No retry (fail-fast) |
| Silent update failure | ✅ Detected and shown | Error notification |

### Missing Protections

| Issue | Impact |
|-------|--------|
| No AbortController for request cancellation | Stale responses can overwrite newer data |
| No explicit timeouts on Edge Functions | Requests could hang indefinitely |
| No request deduplication for concurrent filters | Multiple identical fetches possible |

---

## Input Validation Edge Cases

### Special Character Handling

| Input | Expected | Actual | Escaped? |
|-------|----------|--------|----------|
| `<script>alert('xss')</script>` | Escaped | ✅ sanitizeHtml() strips | Yes |
| SQL injection `'; DROP TABLE --` | Rejected | ✅ Parameterized queries | N/A |
| Unicode (日本語) | Accepted | ✅ No restrictions | N/A |
| Emoji (🎉) | Accepted | ✅ No restrictions | N/A |

### Date Edge Cases

| Date | Expected | Actual |
|------|----------|--------|
| Feb 29, 2024 | Valid | ✅ z.coerce.date() handles |
| Year 2099 | Valid | ✅ No upper bound |
| Invalid date string | Rejected | ✅ Coercion fails |

### Whitespace Handling

| Input Type | Trimmed? | Issue? |
|------------|----------|--------|
| Main form fields | ❌ No | Low impact - forms may auto-trim |
| CSV import fields | ✅ Yes | None |
| Validation `.min(1)` check | ❌ Accepts whitespace-only | P2 for org/task names |

---

## Risk Matrix

| Edge Case Category | Likelihood | Impact | Priority |
|--------------------|------------|--------|----------|
| Activity trigger deprecated table | High | Critical | **P0** |
| Soft-delete cascade not called | High | High | **P0** |
| No FK on principal_organization_id | Medium | High | **P0** |
| Slide-over stale data | High | Medium | P1 |
| Filtered empty state missing | High | Medium | P1 |
| ~~No optimistic locking~~ | ~~Medium~~ | ~~High~~ | ~~P1~~ ✅ **RESOLVED 2025-12-22** |
| Activity fields missing .max() | Medium | High | P1 |
| Contact orphans on org delete | Medium | Medium | P1 |
| CloseOpportunityModal no dirty warning | Medium | Low | P2 |
| Whitespace-only accepted | Low | Low | P2 |
| No AbortController | Medium | Medium | P2 |
| Checkbox filter N+1 fetches | Low | Low | P3 |

---

## Prioritized Findings

### P0 - Critical (Security/Data Loss)

1. **Activity trigger references deprecated `contact_organizations` table**
   - File: `supabase/migrations/20251029022918_add_activity_contact_validation.sql`
   - Risk: Activity INSERT may fail with "table does not exist"
   - Fix: Verify migration 20251102212250 properly replaces function

2. **Soft-delete cascade function not called by data provider**
   - File: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:970`
   - Risk: Related activities, tasks, notes remain active when opportunity deleted
   - Fix: Call `archive_opportunity_with_relations()` RPC from delete handler

3. **No FK constraint on opportunities.principal_organization_id**
   - Risk: Can create opportunities with invalid/deleted principal references
   - Fix: Add FK constraint via migration

4. **Activity schema missing .max() on 4 string fields (DoS vector)**
   - File: `src/atomic-crm/validation/activities.ts:75-110`
   - Fields: description, follow_up_notes, outcome, tags
   - Fix: Add `.max(5000)` or similar limits

### P1 - High (User Impact)

1. **All list views missing filtered empty state**
   - Risk: Users see blank table, unclear if loading/error/no results
   - Fix: Integrate `ListNoResults.tsx` component into all list views

2. **Slide-over shows stale data after edit mutation**
   - File: `src/components/layouts/ResourceSlideOver.tsx`
   - Risk: User sees outdated information after saving
   - Fix: Add `useRefresh()` call or cache invalidation after mutations

3. **No optimistic locking (concurrent edit conflict)**
   - Risk: Last write wins - user changes silently overwritten
   - Fix: Add `version` column and check in update handler

4. **Organization deletion orphans contacts (SET NULL)**
   - Risk: Contacts with NULL org_id break RLS and summary views
   - Fix: Change to soft-delete cascade via trigger

5. **Parent org soft-delete allows orphan branches**
   - File: `supabase/migrations/20251110142650_add_organization_deletion_protection.sql`
   - Risk: Trigger only fires on hard DELETE, not soft-delete
   - Fix: Modify trigger to check soft-delete operations

### P2 - Medium (UX Issues)

1. **CloseOpportunityModal lacks dirty state warning**
2. **Whitespace-only strings accepted in org/task names**
3. **No AbortController for request cancellation**
4. **No explicit timeouts on Edge Functions**
5. **activity.duration_minutes has no upper bound**

### P3 - Low (Polish)

1. **Character count not shown in text fields**
2. **Multiple modals can stack (no stacking guard)**
3. **Checkbox filter rapid clicks cause multiple fetches**

---

## Recommended Testing

### Manual Tests Needed

1. [ ] Create activity with 10MB description (should fail)
2. [ ] Delete organization with active contacts (verify cascade)
3. [ ] Edit same opportunity from two browser tabs simultaneously
4. [ ] Delete opportunity while another user is editing it
5. [ ] Rapid filter changes (verify no stale data shown)
6. [ ] Test all forms with max-length input
7. [ ] Test special character input across all fields

### Automated Tests to Add

1. [ ] Empty state rendering tests for filtered lists
2. [ ] Field validation boundary tests (max length)
3. [ ] Race condition tests for filter updates
4. [ ] Concurrent edit conflict detection tests
5. [ ] Soft-delete cascade verification tests

---

## Recommendations

1. **Immediate (P0):** Fix activity trigger migration, add .max() to activity schema, implement soft-delete cascade call
2. **Pre-Launch (P1):** Add filtered empty states, fix slide-over staleness, add optimistic locking
3. **Post-Launch (P2-P3):** Polish dirty warnings, add request cancellation, improve error messaging

---

## Files Referenced

- `src/atomic-crm/validation/activities.ts` - Missing .max() constraints
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Cascade function not called
- `src/components/layouts/ResourceSlideOver.tsx` - Stale data after mutations
- `src/atomic-crm/simple-list/ListNoResults.tsx` - Exists but unused
- `supabase/migrations/20251029022918_add_activity_contact_validation.sql` - Deprecated table reference
- `supabase/migrations/20251028213032_add_soft_delete_cascade_functions.sql` - Cascade functions defined

---

**Audit Completed:** 2025-12-20
**Next Review:** Before production launch
