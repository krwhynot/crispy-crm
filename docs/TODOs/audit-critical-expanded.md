# Expanded Critical Items Remediation Plan

**Source:** `/docs/audits/2026-01-08-full-audit.md`
**Generated:** 2026-01-09
**Total Critical Issues:** 51
**Estimated Total Effort:** ~40-60 hours

---

## Priority Matrix

| Priority | Risk | Effort | Count | Strategy |
|----------|------|--------|-------|----------|
| **P0** | 🔴 Catastrophic | Low-Medium | 8 | Do first - high impact, achievable quickly |
| **P1** | 🔴 High | Medium | 15 | Do second - security hardening batch |
| **P2** | 🟠 Medium | Medium-High | 20 | Do third - stability improvements |
| **P3** | 🟡 Lower | High | 8 | Do fourth - technical debt |

---

## P0: IMMEDIATE (Do Today) - 8 Items

*High risk, lower effort - maximum impact per hour invested*

### P0-1. Fix Function Search Paths (4 functions) ✅ COMPLETED
**Risk:** 🔴 Privilege escalation attack vector
**Effort:** ⏱️ 15 min
**Location:** Database functions
**Completed:** 2026-01-09
**Migration:** `supabase/migrations/20260109000001_fix_function_search_paths.sql`

**Functions Fixed:**
1. `merge_duplicate_contacts` - **CRITICAL** (SECURITY DEFINER)
2. `get_organization_descendants`
3. `increment_opportunity_version`
4. `sync_opportunity_with_contacts`

**TDD Verification:**
- pgTAP tests in `supabase/tests/database/010-function-security.test.sql` (15 tests)
- RED phase: 5 tests failed proving vulnerability existed
- GREEN phase: All 86 tests pass after fix

- [x] Identify all 4 affected functions (was 3, found 4)
- [x] Create migration with SET search_path = ''
- [x] Apply to local dev
- [x] Verify with pgTAP tests (86/86 pass)
- [ ] Apply to staging
- [ ] Apply to production

---

### P0-2. Move pg_trgm Extension ✅ COMPLETED
**Risk:** 🔴 Security principle violation
**Effort:** ⏱️ 10 min
**Location:** Database extensions
**Completed:** 2026-01-09
**Migration:** `supabase/migrations/20260109000002_move_pg_trgm_to_extensions.sql`

Used `ALTER EXTENSION pg_trgm SET SCHEMA extensions;` which safely moves the extension while preserving all 4 trigram indexes.

- [x] Create migration
- [x] Test on local (indexes remain valid)
- [ ] Apply to staging
- [ ] Apply to production

---

### P0-3. Fix Silent Storage Cleanup ✅ COMPLETED
**Risk:** 🔴 Silent data loss, undebuggable
**Effort:** ⏱️ 10 min
**Location:** `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts`
**Completed:** 2026-01-09

Changed fire-and-forget `.catch(() => {})` to proper `try/await/catch` with `console.error` logging.

- [x] Replace fire-and-forget with try/catch
- [x] Add structured error logging

---

### P0-4. Make principal_organization_id Required ✅ COMPLETED
**Risk:** 🔴 Business rule violation, orphaned opportunities
**Effort:** ⏱️ 20 min
**Location:** `src/atomic-crm/validation/opportunities.ts`
**Completed:** 2026-01-09
**Migration:** `supabase/migrations/20260109000003_require_principal_organization_id.sql`

Updated both `createOpportunitySchema` and `quickCreateOpportunitySchema` to require principal. Added NOT NULL constraint to database.

- [x] Update Zod schemas (removed .optional().nullable())
- [x] Add DB NOT NULL constraint
- [x] Update test data in 020-shared-access-rls.test.sql

---

### P0-5. Remove Silent Stage Default ✅ COMPLETED
**Risk:** 🔴 Misleading data, workflow corruption
**Effort:** ⏱️ 15 min
**Location:** `src/atomic-crm/validation/opportunities.ts:117`
**Completed:** 2026-01-09

Removed `.default("new_lead")` from stage field. Forms must now explicitly provide a stage.

- [x] Remove default from opportunityBaseSchema
- [x] Verify TypeScript compilation
- [x] Update test data to include stage

---

### P0-6. Fix @ts-ignore in columns-button ✅ COMPLETED
**Risk:** 🔴 TypeScript completely bypassed
**Effort:** ⏱️ 20 min
**Location:** `src/components/admin/columns-button.tsx:4`
**Completed:** 2026-01-09

Created type declaration file `src/types/diacritic.d.ts` for the untyped `diacritic` library.

- [x] Created type declaration
- [x] Removed @ts-ignore

---

### P0-7. Add Activity Logging on Stage Close ✅ COMPLETED
**Risk:** 🔴 Lost audit trail, compliance gap
**Effort:** ⏱️ 30 min
**Location:** `src/atomic-crm/opportunities/kanban/OpportunityCardActions.tsx`
**Completed:** 2026-01-09

Added `dataProvider.create('activities', ...)` call after successful stage change to closed_won/closed_lost.

- [x] Added useDataProvider hook
- [x] Create activity on close

---

### P0-8. Fix TutorialProvider Hardcoded HSL ✅ COMPLETED
**Risk:** 🔴 Accessibility violation (color contrast)
**Effort:** ⏱️ 10 min
**Location:** `src/atomic-crm/tutorial/TutorialProvider.tsx`
**Completed:** 2026-01-09

Fixed `overlayColor: "hsl(var(--overlay))"` to `overlayColor: "var(--overlay)"` since the CSS variable already contains a complete color value.

- [x] Fixed incorrect HSL wrapper
- [x] Uses semantic overlay token

---

## P1: SECURITY HARDENING (This Week) - 15 Items

*RLS policy fixes - batch together for efficiency*

### P1-1 through P1-12: RLS Policy Fixes (26 policies across 12 tables)

**Risk:** 🔴 Cross-tenant data access
**Effort:** ⏱️ 3-4 hours total (batch all together)

Create a single migration that fixes all RLS policies:

```sql
-- Migration: harden_rls_policies.sql

-- =====================================================
-- TABLE: activities
-- =====================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activities;
CREATE POLICY "Enable insert for org members" ON activities
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON activities;
CREATE POLICY "Enable update for org members" ON activities
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: contact_notes
-- =====================================================
-- [Similar pattern for each table]

-- =====================================================
-- TABLE: contacts
-- =====================================================

-- =====================================================
-- TABLE: interaction_participants
-- =====================================================

-- =====================================================
-- TABLE: opportunity_notes
-- =====================================================

-- =====================================================
-- TABLE: opportunity_participants
-- =====================================================

-- =====================================================
-- TABLE: organization_notes
-- =====================================================

-- =====================================================
-- TABLE: organizations
-- =====================================================

-- =====================================================
-- TABLE: product_distributors
-- =====================================================

-- =====================================================
-- TABLE: products
-- =====================================================

-- =====================================================
-- TABLE: segments
-- =====================================================

-- =====================================================
-- TABLE: tags
-- =====================================================
```

**Verification Protocol:**
```typescript
// Create test file: src/tests/rls/cross-org-access.test.ts
describe('RLS Cross-Organization Protection', () => {
  const userA = { id: 'user-a', org: 'org-1' };
  const userB = { id: 'user-b', org: 'org-2' };

  const tables = [
    'activities', 'contact_notes', 'contacts', 'interaction_participants',
    'opportunity_notes', 'opportunity_participants', 'organization_notes',
    'organizations', 'product_distributors', 'products', 'segments', 'tags'
  ];

  tables.forEach(table => {
    it(`${table}: User A cannot INSERT into Org 2`, async () => {
      // Login as User A
      // Attempt INSERT with organization_id = org-2
      // Expect: 42501 insufficient_privilege
    });

    it(`${table}: User A cannot UPDATE Org 2 records`, async () => {
      // Similar test
    });
  });
});
```

**Checklist:**
- [ ] **activities** - INSERT policy fixed
- [ ] **activities** - UPDATE policy fixed
- [ ] **contact_notes** - INSERT policy fixed
- [ ] **contact_notes** - UPDATE policy fixed
- [ ] **contacts** - INSERT policy fixed
- [ ] **contacts** - UPDATE policy fixed
- [ ] **interaction_participants** - INSERT policy fixed
- [ ] **opportunity_notes** - INSERT policy fixed
- [ ] **opportunity_notes** - UPDATE policy fixed
- [ ] **opportunity_participants** - INSERT policy fixed
- [ ] **organization_notes** - INSERT policy fixed
- [ ] **organization_notes** - UPDATE policy fixed
- [ ] **organizations** - INSERT policy fixed (admin only)
- [ ] **organizations** - UPDATE policy fixed (admin only)
- [ ] **product_distributors** - INSERT policy fixed
- [ ] **product_distributors** - UPDATE policy fixed
- [ ] **products** - INSERT policy fixed
- [ ] **products** - UPDATE policy fixed
- [ ] **segments** - INSERT policy fixed
- [ ] **segments** - UPDATE policy fixed
- [ ] **tags** - DELETE policy fixed
- [ ] **tags** - INSERT policy fixed
- [ ] **tags** - UPDATE policy fixed
- [ ] All 26 policies verified on staging
- [ ] Cross-org test suite passes
- [ ] Applied to production

---

### P1-13 through P1-15: Hard Delete Migration Fixes

**Risk:** 🔴 Permanent data loss, audit trail destruction
**Effort:** ⏱️ 45 min

**Files to fix:**
1. `supabase/migrations/phase2d_consolidate_duplicates.sql`
2. `supabase/migrations/add_sample_activities_cloud.sql`
3. `supabase/migrations/fix_merge_function_table_names.sql`

```sql
-- Before
DELETE FROM organizations WHERE ...;

-- After
UPDATE organizations SET deleted_at = NOW() WHERE ...;
```

**Checklist:**
- [ ] Fix phase2d_consolidate_duplicates.sql
- [ ] Fix add_sample_activities_cloud.sql
- [ ] Fix fix_merge_function_table_names.sql
- [ ] Test migrations on fresh DB
- [ ] Verify soft-deleted records exist with deleted_at set

---

## P2: STABILITY & STATE (Next Week) - 20 Items

*Cache invalidation and TypeScript fixes*

### P2-1 through P2-5: Cache Invalidation Fixes

**Risk:** 🟠 Stale UI data, user confusion
**Effort:** ⏱️ 2 hours total

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | QuickLogForm.tsx | 141-178 | Activities not invalidated after create |
| 2 | ActivityNoteForm.tsx | 72-88 | Stage change doesn't invalidate |
| 3 | BulkReassignButton.tsx | 130-184 | Bulk reassign stale |
| 4 | UserDisableReassignDialog.tsx | 236-336 | Multi-resource stale |
| 5 | useBulkActionsState.ts | 138-156 | Bulk archive stale |

**Pattern to apply:**
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// After mutation success:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['activities'] });
  queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  // Include all affected resource types
}
```

**Checklist:**
- [ ] QuickLogForm.tsx - add invalidation
- [ ] ActivityNoteForm.tsx - add invalidation
- [ ] BulkReassignButton.tsx - add invalidation
- [ ] UserDisableReassignDialog.tsx - add invalidation
- [ ] useBulkActionsState.ts - add invalidation
- [ ] Manual test: create activity, verify appears without refresh
- [ ] Manual test: bulk reassign, verify updates without refresh

---

### P2-6 through P2-9: TypeScript Critical Fixes

**Risk:** 🟠 Type safety bypassed
**Effort:** ⏱️ 2 hours

| # | Issue | Count | Fix |
|---|-------|-------|-----|
| 6 | @ts-ignore | 1 | Fix underlying type issue |
| 7 | @ts-expect-error | 20 | Fix or document each |
| 8 | Implicit catch types | 100+ | Add `error: unknown` |
| 9 | `: any` return types | 292 | Add explicit types |

**Priority order:** Fix @ts-ignore first (already in P0), then @ts-expect-error, then catch blocks.

**Checklist:**
- [ ] Audit all @ts-expect-error usages
- [ ] Fix or document each with reason
- [ ] Update catch blocks to `catch (error: unknown)`
- [ ] Add type narrowing: `if (error instanceof Error)`

---

### P2-10 through P2-11: Performance Critical

**Risk:** 🟠 Poor UX, slow forms
**Effort:** ⏱️ 30 min

| # | File | Line | Issue |
|---|------|------|-------|
| 10 | TagDialog.tsx | 67 | watch() causes re-renders |
| 11 | QuickCreatePopover.tsx | 133, 157 | watch() in Selects |

```typescript
// Before
const value = watch('fieldName');

// After
const value = useWatch({ name: 'fieldName' });
```

**Checklist:**
- [ ] TagDialog.tsx - replace watch with useWatch
- [ ] QuickCreatePopover.tsx (line 133) - replace watch
- [ ] QuickCreatePopover.tsx (line 157) - replace watch
- [ ] Profile in React DevTools to verify isolated re-renders

---

## P3: TECHNICAL DEBT (Sprint Backlog) - 8 Items

*Lower risk, higher effort - schedule when capacity allows*

### P3-1 through P3-4: Code Quality

| # | Issue | Location | Effort |
|---|-------|----------|--------|
| 1 | Large file (5219 lines) | database.types.ts | Document only (auto-generated) |
| 2 | Large file (5219 lines) | database.generated.ts | Consolidate with above |
| 3 | Duplicate code | useKeyboardShortcuts.ts | Extract to shared util |
| 4 | Duplicate code | useListKeyboardNavigation.ts | Extract to shared util |

**Checklist:**
- [ ] Add comment to database.types.ts explaining it's auto-generated
- [ ] Remove database.generated.ts if duplicate
- [ ] Create `src/utils/platform.ts` with `isMac()` and `shouldPreventShortcut()`
- [ ] Update both keyboard hooks to use shared util

---

### P3-5 through P3-8: Accessibility Remaining

| # | Issue | Location |
|---|-------|----------|
| 5 | aria-invalid propagation | form-primitives.tsx:92 |
| 6-8 | Various ARIA gaps | Multiple components |

**Checklist:**
- [ ] Audit all form-primitives consumers
- [ ] Ensure aria-invalid={!!error} propagates
- [ ] Add aria-describedby for error messages
- [ ] Test with screen reader

---

## Execution Timeline

```
Week 1 - Day 1-2: P0 Items (8 items, ~2-3 hours)
├── Function search paths (15 min)
├── Extension move (10 min)
├── Silent storage fix (10 min)
├── Required principal field (20 min)
├── Remove stage default (15 min)
├── @ts-ignore fix (20 min)
├── Activity logging on close (30 min)
└── Tutorial HSL fix (10 min)

Week 1 - Day 3-5: P1 Items (15 items, ~5 hours)
├── RLS policy migration (3-4 hours)
└── Hard delete migration fixes (45 min)

Week 2: P2 Items (20 items, ~5 hours)
├── Cache invalidation (2 hours)
├── TypeScript fixes (2 hours)
└── Performance fixes (30 min)

Week 3+: P3 Items (8 items, ~3 hours)
└── Technical debt cleanup
```

---

## Verification Checklist (Before Deployment)

- [ ] All P0 items complete
- [ ] All P1 items complete
- [ ] RLS test suite passes (36+ tests)
- [ ] `tsc --noEmit` passes
- [ ] Manual E2E test: create opportunity without principal (should fail)
- [ ] Manual E2E test: cross-org data access (should fail)
- [ ] Staging deployed and tested for 24 hours
- [ ] Supabase audit logs reviewed

---

## Post-Deployment Monitoring

- [ ] Enable Supabase audit logging
- [ ] Monitor for RLS violations (42501 errors)
- [ ] Monitor for validation failures (400 responses)
- [ ] Review error logs after 24 hours

---

*Generated from full audit review*
*Reference: /docs/audits/2026-01-08-full-audit.md*
