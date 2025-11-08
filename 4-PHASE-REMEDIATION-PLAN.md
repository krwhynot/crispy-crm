# Atomic CRM - 4-Phase Remediation Plan

**Generated:** November 8, 2025
**Status:** Pre-launch Technical Gaps Remediation
**Total Estimated Time:** 12-18 days (8-10 days with parallel execution)

---

## Executive Summary

This plan addresses **critical security vulnerabilities, testing gaps, and accessibility issues** identified in the technical audit. The plan uses **parallel agent execution** to compress 20-25 days of sequential work into 8-10 calendar days.

**Audit Documents:**
- [Security Audit](docs/SECURITY_AUDIT_2025-11-08.md) - 14 vulnerabilities (3 CRITICAL, 5 HIGH)
- [Security Remediation Examples](docs/SECURITY_REMEDIATION_EXAMPLES.md) - Code fixes
- [Accessibility Audit](docs/ACCESSIBILITY_AUDIT.md) - 25+ WCAG violations
- [Accessibility Priority Fixes](docs/A11Y_PRIORITY_FIXES.md) - Implementation guide
- [Testing Coverage Analysis](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md) - 257 untested files

**Overall Risk:** 🟡 YELLOW - Good foundation with critical gaps

---

## Phase Timeline

| Phase | Duration (Parallel) | Duration (Sequential) | Agents | Status |
|-------|---------------------|----------------------|--------|--------|
| Phase 1 | 5 days | 8-13 days | 3 | Pending |
| Phase 2 | 2 days | 5-7 days | 3 | Pending |
| Phase 3 | 3 days | 3-5 days | 2 | Pending |
| Phase 4 | 2-3 days | 2-3 days | Sequential | Pending |
| **TOTAL** | **~10 days** | **20-25 days** | **8 agents** | |

---

## PHASE 1: Critical Security Fixes (P0 - Launch Blockers)

**Duration:** 5 days parallel (8-13 days sequential)
**Agents:** 3 parallel task-implementor agents
**Priority:** CRITICAL - Must fix before launch

### Agent 1: RLS Policy Security (3-5 days)

**Problem:** Permissive RLS policies allow ANY authenticated user to read/delete ALL data.

**Current State:**
```sql
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- Anyone can see ALL contacts!
```

**Tasks:**
1. Create new migration: `npx supabase migration new fix_rls_policies_role_based_access`
2. Implement role-based policies for:
   - `contacts` - Shared read, admin-only delete
   - `organizations` - Shared read, admin-only delete
   - `opportunities` - Shared read, admin-only delete
   - `tasks` - Personal visibility (sales_id based)
   - `notes` - Activity access rules
3. Test migration locally: `npm run db:local:reset`
4. Verify policies: `SELECT * FROM pg_policies;`

**References:**
- Security Audit: [lines 36-94](docs/SECURITY_AUDIT_2025-11-08.md#L36-L94)
- Code Examples: [lines 8-47](docs/SECURITY_REMEDIATION_EXAMPLES.md#L8-L47)
- Current Migration: `supabase/migrations/20251018203500_update_rls_for_shared_team_access.sql`

**Impact:** Prevents complete data breach, fixes OWASP A01:2021 - Broken Access Control

---

### Agent 2: CSV Upload Validation (4-6 days)

**Problem:** No server-side validation allows DoS attacks, formula injection, and binary file uploads.

**Vulnerabilities:**
- No file size limits (CSV bomb/DoS possible)
- Formula injection: `=cmd|'/c calc'!A0`
- Binary files disguised as CSV
- No content sniffing

**Tasks:**
1. Create `src/atomic-crm/contacts/csvUploadValidator.ts`:
   - `validateCsvFile()` - Size (10MB), MIME type, content sniffing
   - `configurePapaParseForSecurity()` - Disable formula evaluation
   - `sanitizeCsvValue()` - Prepend `'` to formulas
2. Update `src/atomic-crm/contacts/ContactImportDialog.tsx`:
   - Add validation in `handleFileChange()` before parsing
   - Show validation errors via toast
   - Use secure Papa Parse config
3. Update `src/atomic-crm/contacts/csvProcessor.ts`:
   - Add sanitization to `processCsvData()`
4. Create tests: `src/atomic-crm/contacts/__tests__/csvUploadValidator.test.ts`
5. Apply same fixes to `OrganizationImportDialog.tsx`

**References:**
- Security Audit: [lines 97-173](docs/SECURITY_AUDIT_2025-11-08.md#L97-L173)
- Code Examples: [lines 50-268](docs/SECURITY_REMEDIATION_EXAMPLES.md#L50-L268)
- Current File: `src/atomic-crm/contacts/ContactImportDialog.tsx:562`

**Impact:** Prevents DoS, code injection, and malicious file uploads (OWASP A04:2021)

---

### Agent 3: Auth Bypass + Logging + localStorage (1-2 days)

**Problem:** Three HIGH severity issues:
1. URL-based auth bypass can be spoofed
2. Environment variables logged to console
3. Unencrypted localStorage on shared devices

**Tasks:**

#### 3.1 Fix Authentication Bypass (1 hour)
**File:** `src/atomic-crm/providers/supabase/authProvider.ts` (lines 36-48)

**Current:**
```typescript
if (window.location.pathname === "/set-password") {
  return; // BYPASS AUTH!
}
```

**Fix:**
- Always validate session first
- Use whitelist of public paths
- No URL-based checks

**Reference:** [Code Example lines 329-374](docs/SECURITY_REMEDIATION_EXAMPLES.md#L329-L374)

#### 3.2 Remove Environment Logging (30 min)
**File:** `src/atomic-crm/providers/supabase/supabase.ts` (lines 4-8)

**Current:**
```typescript
console.log('🔍 [SUPABASE INIT] Environment variables:', {
  allEnv: import.meta.env, // DANGEROUS!
});
```

**Fix:**
- Remove all env logging
- Add safe dev-only logging
- Add startup validation

**Reference:** [Code Example lines 274-321](docs/SECURITY_REMEDIATION_EXAMPLES.md#L274-L321)

#### 3.3 Migrate localStorage → sessionStorage (1-2 hours)
**Files:**
- `src/atomic-crm/filters/opportunityStagePreferences.ts`
- `src/atomic-crm/filters/filterPrecedence.ts`

**Fix:**
- Use sessionStorage (clears on close)
- Migrate existing localStorage data
- Add error handling

**Reference:** [Code Example lines 377-450](docs/SECURITY_REMEDIATION_EXAMPLES.md#L377-L450)

**Impact:** Fixes OWASP A01:2021 (auth bypass), A02:2021 (crypto failures), privacy leaks

---

## PHASE 2: Critical Testing (P0 - Launch Blockers)

**Duration:** 2 days parallel (5-7 days sequential)
**Agents:** 3 parallel task-implementor agents
**Priority:** CRITICAL - Core functionality untested

### Agent 4: authProvider Tests (1 day)

**Problem:** Authentication system has 0% test coverage. If it breaks, users can't log in.

**Tasks:**
1. Create `src/atomic-crm/providers/supabase/__tests__/authProvider.test.ts`
2. Test scenarios (8 tests):
   - Login flow (email/password → session)
   - Logout flow (clear session)
   - Session check on app load
   - Session timeout/expiration
   - Permission denied (no role)
   - Identity retrieval (sale from user_id)
   - Error: Supabase down
   - Error: User not in sales table
3. Mock Supabase client responses
4. Test cached sale logic

**References:**
- Testing Analysis: [lines 28-48](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L28-L48)
- Testing Priorities: [lines 280-285](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L280-L285)

**Impact:** Ensures users can log in and access the application

---

### Agent 5: Data Provider Tests (2 days)

**Problem:** Core CRUD operations partially tested. All features depend on this layer.

**Tasks:**
1. Create `src/atomic-crm/providers/supabase/__tests__/unifiedDataProvider.crud.test.ts`
2. Test CRUD operations (16 tests):
   - CREATE: Insert, return new ID
   - READ: Fetch, filtering, pagination
   - UPDATE: Merge data, avoid overwrites
   - DELETE: Soft vs hard delete
   - Network errors during CRUD
   - Invalid data from server
   - RLS permission denied scenarios
3. Create `src/atomic-crm/providers/supabase/__tests__/filterRegistry.test.ts` (12 tests):
   - Validate fields for contacts/orgs/opportunities
   - Catch schema mismatches
   - Prevent 400 errors
4. Create `src/atomic-crm/providers/supabase/__tests__/dataProviderCache.test.ts` (6 tests):
   - Cache invalidation logic
   - Stale data prevention

**References:**
- Testing Analysis: [lines 134-149](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L134-L149)
- Testing Priorities: [lines 286-297](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L286-L297)

**Impact:** Ensures all features can read/write data correctly

---

### Agent 6: Services Tests (2 days)

**Problem:** Business logic in services layer has 0% test coverage.

**Tasks:**
1. Create `src/atomic-crm/services/__tests__/sales.service.test.ts`
2. Create `src/atomic-crm/services/__tests__/opportunities.service.test.ts`:
   - Multi-participant logic
   - Contact role assignment
   - Opportunity stage transitions
3. Create `src/atomic-crm/services/__tests__/activities.service.test.ts`:
   - Activity creation on record changes
   - Activity timeline rendering
4. Create `src/atomic-crm/services/__tests__/junctions.service.test.ts`:
   - Add contact to opportunity
   - Remove contact from opportunity
   - Validate contact exists

**References:**
- Testing Analysis: [lines 42-48](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L42-L48)
- Testing Priorities: [lines 304-312](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md#L304-L312)

**Impact:** Ensures complex business logic works correctly

---

## PHASE 3: Accessibility + Error Handling (P1 - Before Launch)

**Duration:** 3 days parallel (3-5 days sequential)
**Agents:** 2 parallel task-implementor agents
**Priority:** HIGH - UX quality and compliance

### Agent 7: Accessibility Critical Fixes (2-3 days)

**Problem:** 25+ WCAG 2.1 violations blocking AA compliance.

**Tasks:**

#### Priority 1 (30 min)
1. Fix 3 unassociated label violations:
   - `src/atomic-crm/opportunities/BulkActionsToolbar.tsx` lines 227, 282, 334
   - Add `htmlFor` to labels, `id` to selects
2. Remove 8 redundant ARIA roles:
   - `src/atomic-crm/dashboard/Dashboard.tsx` line 89
   - `src/atomic-crm/contacts/ContactList.tsx` line 56
   - Remove `role="complementary"` from `<aside>` elements
3. Add keyboard handlers to 4+ `<div onClick>`:
   - Convert to `<button>` or add `role="button"` + `onKeyDown`

#### Priority 2 (4-6 hours)
4. Add `aria-describedby` to form inputs with error/helper text (15+ inputs)
5. Verify Radix Dialog focus traps work (1 hour)
6. Add `aria-label` to 10+ icon buttons (3-4 hours)
7. Use `useAriaAnnounce` for async operations (2-3 hours):
   - Task completion
   - Bulk operations
   - Form submissions

**References:**
- Accessibility Audit: [docs/ACCESSIBILITY_AUDIT.md](docs/ACCESSIBILITY_AUDIT.md)
- Priority Fixes Guide: [docs/A11Y_PRIORITY_FIXES.md](docs/A11Y_PRIORITY_FIXES.md)
- Quick Reference: [docs/A11Y_QUICK_REFERENCE.md](docs/A11Y_QUICK_REFERENCE.md)

**Impact:** Achieves WCAG 2.1 Level AA compliance, improves keyboard/screen reader UX

---

### Agent 8: Error Handling Fixes (1.5 hours)

**Problem:** 5 minor error handling gaps (92/100 score, can reach 98/100).

**Tasks:**
1. Fix AddTask.tsx missing error handler (15 min):
   - File: `src/atomic-crm/activity/tasks/AddTask.tsx`
   - Add try-catch around task creation
2. Fix 3 Promise.all() fragility issues (50 min):
   - Use `Promise.allSettled()` instead
   - Handle partial failures gracefully
3. Add bulk action error tracking (30 min):
   - Track failed items in bulk operations
   - Show user which items failed

**References:**
- Constitution Audit: Error Handling section
- Files: Located via grep for `Promise.all(` and missing error handlers

**Impact:** Improves error resilience from 92/100 to 98/100

---

## PHASE 4: Verification + Integration (Sequential)

**Duration:** 2-3 days (cannot parallelize)
**Agents:** Manual verification
**Priority:** CRITICAL - Ensure everything works together

### 4.1 Review Agent Outputs (4 hours)

**Tasks:**
1. Read all 8 agent summaries
2. Check for code conflicts:
   - Did multiple agents edit the same files?
   - Are there merge conflicts?
3. Verify completeness:
   - Did each agent complete all tasks?
   - Are there any TODOs left?

**Checklist:**
- [ ] Phase 1 Agent 1: RLS policies migration created and tested
- [ ] Phase 1 Agent 2: CSV validator created, tests pass
- [ ] Phase 1 Agent 3: Auth/logging/localStorage fixed
- [ ] Phase 2 Agent 4: authProvider tests written and passing
- [ ] Phase 2 Agent 5: Data provider tests passing
- [ ] Phase 2 Agent 6: Services tests passing
- [ ] Phase 3 Agent 7: Accessibility fixes applied
- [ ] Phase 3 Agent 8: Error handling fixes applied

---

### 4.2 Integration Testing (1 day)

**Tasks:**
1. Run full test suite:
   ```bash
   npm test
   npm run test:coverage
   ```
2. Fix any integration failures:
   - Tests broken by security fixes
   - Tests broken by accessibility fixes
3. Run E2E tests:
   ```bash
   npm run test:e2e
   ```
4. Fix flaky tests (QuickAdd timeout issues)

**Success Criteria:**
- [ ] All unit tests pass (0 failures)
- [ ] Test coverage ≥ 70%
- [ ] E2E tests pass (auth issue resolved)
- [ ] No ESLint errors
- [ ] No TypeScript errors

---

### 4.3 Security Validation (4 hours)

**Tasks:**
1. **Dependency audit:**
   ```bash
   npm audit
   npm outdated
   ```
2. **Database security:**
   - Verify RLS policies in local Supabase:
     ```sql
     SELECT * FROM pg_policies WHERE tablename IN ('contacts', 'organizations', 'opportunities', 'tasks');
     ```
   - Test as non-admin user (verify can't delete)
3. **CSV upload security:**
   - Upload malicious CSV with formula: `=cmd|'/c calc'!A0`
   - Upload 11MB file (should be rejected)
   - Upload binary file disguised as .csv (should be rejected)
4. **Authentication security:**
   - Test /set-password bypass (should fail now)
   - Verify session required for protected routes
5. **Manual accessibility audit:**
   - Keyboard navigation through all pages (Tab order)
   - Screen reader test (VoiceOver or NVDA)
   - Focus visible rings on all interactive elements
   - Run axe DevTools extension

**Success Criteria:**
- [ ] 0 critical npm audit vulnerabilities
- [ ] RLS policies restrict deletes to admins
- [ ] CSV uploads reject malicious files
- [ ] Auth bypass fixed
- [ ] 0 accessibility violations (jsx-a11y)

---

### 4.4 Documentation + GitHub Issues (4 hours)

**Tasks:**
1. **Create GitHub Issues for P1/P2 remaining work:**
   - Issue template:
     ```markdown
     **Severity:** P1/P2
     **Time Estimate:** X hours
     **References:** [Audit doc link]
     **Code Example:** [Link to remediation doc]
     ```
   - Issues to create:
     - Medium priority security items (rate limiting, type safety)
     - Accessibility Priority 3 items (placeholder labels, aria-required)
     - Testing Phase 2-4 items (Show pages, hooks, UI components)
2. **Update CLAUDE.md:**
   - Add security patterns section
   - Add accessibility patterns section
   - Link to audit documents
3. **Update README:**
   - Security status badge
   - Accessibility compliance level
4. **Document phase completion:**
   - Update this file with completion dates
   - Add lessons learned section

**Success Criteria:**
- [ ] All remaining work tracked in GitHub Issues
- [ ] CLAUDE.md updated with security/a11y guidance
- [ ] README reflects current status

---

## Risk Assessment

### Phase 1 Risks
- **RLS migration breaks existing queries** → Mitigation: Test thoroughly in local env first
- **CSV validation too strict, rejects valid files** → Mitigation: Use permissive content sniffing
- **localStorage migration loses user data** → Mitigation: Migrate gracefully, keep backup

### Phase 2 Risks
- **Mocking Supabase is complex** → Mitigation: Use service role for test setup
- **Tests are slow (E2E-style)** → Mitigation: Keep tests focused, use fast unit tests

### Phase 3 Risks
- **Accessibility fixes break existing UI** → Mitigation: Visual regression testing
- **Focus traps prevent keyboard navigation** → Mitigation: Radix Dialog handles this

### Phase 4 Risks
- **Agents create merge conflicts** → Mitigation: Review outputs carefully before merging
- **Integration tests fail** → Mitigation: Budget extra time for fixes

---

## Success Metrics

### Security
- [ ] 0 CRITICAL vulnerabilities
- [ ] 0 HIGH vulnerabilities
- [ ] All P0 security items fixed

### Testing
- [ ] Test coverage ≥ 70%
- [ ] 0 flaky tests
- [ ] All critical paths tested (auth, CRUD, services)

### Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] 0 jsx-a11y ESLint violations
- [ ] Manual keyboard/screen reader testing passes

### Error Handling
- [ ] Score: 98/100 (from 92/100)
- [ ] All missing error handlers added

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Choose execution mode:**
   - **Option A:** Execute all 4 phases automatically (dispatch all agents)
   - **Option B:** Execute phase-by-phase (review between phases)
   - **Option C:** Modify plan before execution
   - **Option D:** Execute specific phases only
3. **Dispatch Phase 1 agents** (3 parallel agents)
4. **Monitor progress** (agent outputs stream back)
5. **Review Phase 1** before starting Phase 2

---

## Reference Documentation

### Audit Reports
- [Security Audit 2025-11-08](docs/SECURITY_AUDIT_2025-11-08.md) - 14 vulnerabilities
- [Security Remediation Examples](docs/SECURITY_REMEDIATION_EXAMPLES.md) - Code fixes
- [Security README](docs/SECURITY_README.md) - Quick reference
- [Accessibility Audit](docs/ACCESSIBILITY_AUDIT.md) - 25+ violations
- [A11y Priority Fixes](docs/A11Y_PRIORITY_FIXES.md) - Implementation guide
- [A11y Quick Reference](docs/A11Y_QUICK_REFERENCE.md) - Patterns
- [Testing Coverage Analysis](docs/claude/TESTING-COVERAGE-GAP-ANALYSIS.md) - 257 untested files
- [Constitution Audit Summary](docs/internal-docs/2025-11-08-constitution-audit-summary.md)
- [Technical Gaps Audit](docs/internal-docs/2025-11-08-technical-gaps-audit.md)

### Codebase Documentation
- [Engineering Constitution](docs/claude/engineering-constitution.md)
- [Architecture Essentials](docs/claude/architecture-essentials.md)
- [Common Tasks](docs/claude/common-tasks.md)
- [Supabase Workflow](docs/supabase/WORKFLOW.md)
- [Testing Quick Reference](docs/claude/testing-quick-reference.md)

---

**Last Updated:** 2025-11-08
**Plan Version:** 1.0
**Status:** Ready for execution
