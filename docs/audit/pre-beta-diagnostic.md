# Pre-Beta Diagnostic Audit

**Generated:** Sat Dec 13 2025
**Scope:** Crispy CRM - React 19 + TypeScript + React Admin + Supabase
**Status:** Family Beta Launch Readiness Assessment

---

## Quick Summary

| Category | Issues Found | Priority | Status |
|----------|--------------|----------|--------|
| Build & Test Health | 125 | **CRITICAL** | ❌ Blocking |
| Performance Anti-Patterns | ~60 | **LOW** | ⚠️ Monitor |
| Consistency Anti-Patterns | ~65 | **MEDIUM** | ⚠️ Pre-GA |
| Constitution Violations | ~95 | **HIGH** | 🔧 Fix Soon |

**Total Issues Identified:** ~345

---

## Top 5 Priority Issues

| # | Issue | Files Affected | Effort | Impact |
|---|-------|----------------|--------|--------|
| 1 | **Test Suite Failures** - Mock configuration errors in `useTeamActivities` | 22 test files, 116 cases | Medium | Blocks CI/CD |
| 2 | **TypeScript `any` Usage** - Type safety violations across import dialogs | 30+ locations | Large | Runtime errors |
| 3 | **Zod Strings Without `.max()`** - DoS vulnerability risk | 20+ schema fields | Medium | Security |
| 4 | **Form-Level Validation** - Should be API boundary only | 4 forms | Small | Architecture |
| 5 | **Lint Errors** - Unused imports/variables | 7 locations | Quick | CI fails |

---

## Category Details

### 1. Build & Test Health ❌ CRITICAL

#### TypeScript Build: ✅ PASS
- Build completed successfully in **51.45s**
- **Performance Warning:** 2 large chunks exceed 300 kB
  - `chunk-Ci8ZLF02.js`: 363.91 kB (95.10 kB gzipped)
  - `index-BWSp190D.js`: 664.61 kB (202.30 kB gzipped)
- **Recommendation:** Implement code-splitting via dynamic `import()`

#### Test Suite: ❌ FAIL
| Metric | Value |
|--------|-------|
| Test Files | 197 total |
| Passing Files | 175 (88.8%) |
| Failing Files | 22 (11.2%) |
| Test Cases | 2,655 total |
| Passing Cases | 2,539 (95.6%) |
| Failing Cases | 116 (4.4%) |
| Duration | 243.32s |

**Root Cause:** Mock configuration error - missing `useGetList` export in react-admin mock
```
Error: [vitest] No "useGetList" export is defined on the "react-admin" mock
Location: src/atomic-crm/dashboard/v3/hooks/__tests__/useTeamActivities.test.ts
```

#### Lint Status: ❌ FAIL (7 errors, 1 warning)

| File | Line | Issue |
|------|------|-------|
| `ValidationService.ts` | 35 | `validateUpdateSales` defined but never used |
| `SalesPermissionsTab.tsx` | 148 | `handleCancel` assigned but never used |
| `SalesProfileTab.tsx` | 3 | `Button` imported but never used |
| `SalesProfileTab.tsx` | 93 | `handleCancel` assigned but never used |
| `capture-dashboard-snapshots/index.ts` | 3 | `subWeeks` imported but never used |
| `manager-operations.spec.ts` | 2 | `SalesListPage` imported but never used |
| `manager-operations.spec.ts` | 4 | `LoginPage` imported but never used |

---

### 2. Performance Anti-Patterns ⚠️ LOW

| Pattern | Count | Status |
|---------|-------|--------|
| `mode: 'onChange'` (re-render storm) | 0 | ✅ Clean |
| `watch()` without `useWatch` | 1 | ⚠️ Minor |
| Inline `style={{}}` | 17 | ⚠️ Acceptable |
| Inline validators | 0 | ✅ Clean |
| Inline `onClick` handlers | 20+ | ⚠️ Monitor |
| Inline `onChange` handlers | 20+ | ⚠️ Monitor |

**Assessment:** No critical performance anti-patterns. Inline handlers are acceptable for MVP scope.

**Notable Files:**
- `OpportunitiesByPrincipalReport.tsx:54` - Uses `form.watch()` subscription (documented, acceptable)
- Dynamic styles for progress bars and stage colors - necessary for runtime values

---

### 3. Consistency Anti-Patterns ⚠️ MEDIUM

| Pattern | Count | Status |
|---------|-------|--------|
| Hardcoded Tailwind colors | 0 | ✅ Clean |
| Raw hex colors | 1 | ✅ Docs only |
| Touch targets < 44px | 25+ | ⚠️ Review |
| Hardcoded form defaults | 22+ | ⚠️ Refactor |
| Deprecated `company_id` | 0 | ✅ Clean |
| Deprecated `archived_at` | 0 | ✅ Clean |
| Missing `aria-invalid` | 15+ | ⚠️ A11y |

**Hardcoded Form Defaults (should use `schema.partial().parse({})`):**
- `OrganizationCreate.tsx`
- `SalesCreate.tsx`
- `TaskCreate.tsx`
- `ContactCreate.tsx`
- `OpportunityCreate.tsx`
- `QuickAddForm.tsx`
- `ActivityNoteForm.tsx`
- `ProductCreate.tsx`

**Touch Targets:** Most are decorative icons (h-4/w-4), not interactive elements. Review interactive buttons for compliance.

---

### 4. Constitution Violations 🔧 HIGH

#### Direct Supabase Imports (3 occurrences)
| File | Import | Assessment |
|------|--------|------------|
| `CRM.tsx:2` | `ForgotPasswordPage` from supabase | Auth UI - acceptable |
| `CRM.tsx:3` | `SetPasswordPage` from supabase | Auth UI - acceptable |
| `i18nProvider.tsx:4` | `raSupabaseEnglishMessages` | i18n - acceptable |

**Verdict:** Auth UI components acceptable exception to data provider rule.

#### Retry Logic / Circuit Breakers: ✅ COMPLIANT
All references are documentation comments explaining the **absence** of retry/circuit breaker patterns (fail-fast is enforced).

#### TypeScript `any` Usage (30+ violations)

**Hotspots:**
| File | Count | Context |
|------|-------|---------|
| `OrganizationImportDialog.tsx` | 8 | CSV parsing |
| `useOrganizationImport.tsx` | 4 | Import state |
| `OrganizationSlideOver.tsx` | 4 | Record representation |
| `OrganizationCreate.tsx` | 5 | Form handlers |
| `OrganizationList.tsx` | 4 | Export functions |

#### Zod Validation Issues

**z.object without strictObject (4 locations):**
```
src/atomic-crm/validation/rpc.ts:90
src/atomic-crm/validation/rpc.ts:132
```

**Strings without `.max()` (20+ locations):**
- `operatorSegments.ts` - id, parent_id, created_at, created_by
- `sales.ts` - id, email, phone, avatar_url, user_id, timestamps
- `segments.ts` - id, parent_id, created_at, created_by
- `organizationDistributors.ts` - id, timestamps

**Non-string inputs without `z.coerce` (20+ locations):**
- `quickAdd.ts` - product_ids array
- `notes.ts` - size, various IDs
- `activities.ts` - duration_minutes, contact_id, organization_id, opportunity_id

#### Form-Level Validation (4 forms)
| File | Issue |
|------|-------|
| `CloseOpportunityModal.tsx` | Uses `zodResolver` |
| `QuickAddForm.tsx` | Uses `zodResolver` |
| `ActivityNoteForm.tsx` | Uses `zodResolver` |
| `QuickLogForm.tsx` | Uses `zodResolver` |

**Constitution requires:** Validation at API boundary only (in unifiedDataProvider), not in forms.

---

## Recommendations

### Phase 1: Immediate (Pre-Beta)
1. **Fix test mocks** - Add `useGetList` to react-admin mock
2. **Remove lint errors** - Delete 7 unused imports/variables
3. **Fix form validation architecture** - Move validation to API boundary

### Phase 2: Short-Term (Pre-GA)
1. **Type safety** - Replace `any` with proper types in import dialogs
2. **Zod hardening** - Add `.max()` to all string fields, `.coerce` for form inputs
3. **A11y** - Add `aria-invalid` to form error states

### Phase 3: Optimization (Post-GA)
1. **Bundle splitting** - Code-split large chunks via dynamic import
2. **Form defaults** - Migrate to `schema.partial().parse({})` pattern
3. **Performance monitoring** - Extract inline handlers in hot paths

---

## Files for Reference

| File | Purpose |
|------|---------|
| `docs/audit/temp/audit-health.md` | Full build/test/lint output |
| `docs/audit/temp/audit-performance.md` | Performance anti-pattern details |
| `docs/audit/temp/audit-consistency.md` | Design system violations |
| `docs/audit/temp/audit-constitution.md` | Engineering principle violations |

---

## Audit Methodology

This audit was performed using 4 parallel diagnostic agents:
- **Agent 1:** Build compilation, test suite execution, lint check
- **Agent 2:** Performance anti-pattern scanning (grep-based)
- **Agent 3:** Design system consistency checks
- **Agent 4:** Engineering constitution compliance

All agents completed successfully and findings are preserved in `docs/audit/temp/`.

---

**Next Action:** Fix test mocks to unblock CI, then address lint errors. Constitution violations (Zod/types) should be prioritized for security before GA launch.
