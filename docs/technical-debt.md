# Technical Debt Tracker

**Generated:** 2025-12-26
**Last Verified:** 2026-01-23
**Source:** Consolidated from 40+ audit reports + TODO/FIXME scan

---

## Summary

| Priority | Open Items | Resolved |
|----------|------------|----------|
| P0 - Critical | 1 | 12 |
| P1 - High | 3 | 36 |
| P2 - Medium | 16 | 40 |
| P3 - Low | 9 | 32 |
| **Total** | **29** | **120** |

---

## P0 - Critical (Must Fix Before Launch)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-04 | Focus Mgmt | ColumnsButton manual portal bypass breaks focus management. Portal renders content outside React's tree, breaking Radix focus trap. | `src/components/admin/columns-button.tsx:85-87,110-128,138` | Open |

**Recommended Fix:** Refactor ColumnsSelector to be a direct child of PopoverContent instead of using portal pattern. Use React context or composition to pass data rather than DOM insertion.

### P0 Dependencies
- **UI-04**: Blocks nothing | Blocked by: None | Related: Focus management patterns

---

## P1 - High Priority (Fix This Sprint)

### Async/State Issues

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ASYNC-01 | Race Condition | Custom useEffect fetches may lack AbortController cleanup | Multiple custom hooks - needs audit | Open |
| ASYNC-02 | Loading State | Slide-over saves lack loading indicator during save operations | `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx:40`, `src/atomic-crm/contacts/ContactDetailsTab.tsx:47`, `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx:55` | Open |

### Error Handling

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ERR-01 | Silent Catch | Avatar utils silent catches need logging | `src/atomic-crm/utils/avatar.utils.ts:55-56,85-87` | Resolved |
| ERR-02 | Silent Catch | Filter storage errors silently ignored | `src/atomic-crm/filters/filterPrecedence.ts:70-72,191-193` | Resolved |
| ERR-03 | Error Propagation | QuickCreatePopover catches but doesn't log for debugging | `src/atomic-crm/organizations/QuickCreatePopover.tsx:72,101` | Resolved |

### Feature Incomplete

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| FEAT-01 | Missing RPC | Stale leads feature requires server-side RPC (get_stale_opportunities). Previous client-side implementation used perPage: 1000 which was a performance risk. | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:148` | Open |

### P1 Dependencies
- **ASYNC-01**: Blocks nothing | Blocked by: None | Related: useEffect cleanup patterns
- **ASYNC-02**: Blocks nothing | Blocked by: None | Related: Save indicator UX
- **FEAT-01**: Blocks stale leads dashboard feature | Blocked by: None | Related: Database RPC implementation

---

## P2 - Medium Priority (Tech Debt)

### Import Health

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| IMP-01 | Deep Imports | 4-level deep imports need @/ alias | `src/atomic-crm/providers/supabase/extensions/__tests__/customMethodsExtension.test.ts:31-32` | Open |
| IMP-02 | Deep Imports | 3-level deep imports in provider/service layer | Multiple files - needs audit | Open |
| IMP-03 | Extension | 5 imports include unnecessary .tsx extension | `src/components/supabase/forgot-password-page.tsx:4,7`, `src/main.tsx:11`, `src/components/admin/ListNoResults.tsx:7`, `src/atomic-crm/root/CRM.tsx:38` | Open |

### Dead Code

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| DEAD-02 | Dead Export | useNotifyWithRetry hook - zero consumers | `src/atomic-crm/utils/useNotifyWithRetry.tsx` | Open |
| DEAD-05 | Dead Types | InteractionParticipant, DashboardSnapshot types unused | `src/atomic-crm/types.ts:185,339` | Open |
| DEAD-06 | Dead Export | BADGE_TOUCH_CLASSES constant unused | `src/atomic-crm/organizations/constants.ts:234` | Open |
| DEAD-07 | Dead Export | SalesShowView - used in export but verify route registration | `src/atomic-crm/sales/resource.tsx:29-35` | Open |

### Database Schema

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| DB-02 | Validation Gap | No DB text length constraints (Zod has limits, DB doesn't) | Multiple migration files | Open |

### UI/UX (Lower Priority)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-20 | Z-Index | LogActivityFAB z-40 may conflict with other z-40 elements | `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx:219` | Open |

### Forms (Lower Priority)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| FORM-02 | Touch Target | FormErrorSummary expand button < 44px | `src/components/admin/FormErrorSummary.tsx:136` | Open |
| FORM-03 | Touch Target | FormErrorSummary error item button < 44px | `src/components/admin/FormErrorSummary.tsx:168` | Open |
| FORM-04 | Mobile-First | SimpleFormIterator uses sm: instead of md: breakpoint | `src/components/admin/simple-form-iterator.tsx:324` | Open |

### Code Quality (from TODO scan)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| CQ-01 | Naming | Validation function naming inconsistent across modules (3 patterns: validateForm, validateCreate, validateForSubmission) | `src/atomic-crm/validation/index.ts:12` | Open |
| CQ-02 | Registration | ProductsService implemented but not registered in ServiceContainer | `src/atomic-crm/services/PATTERNS.md:419` | Open |
| CQ-03 | Registration | ProductDistributorsService implemented but not registered in ServiceContainer | `src/atomic-crm/services/PATTERNS.md:424` | Open |
| CQ-04 | Registration | DigestService implemented but not registered in ServiceContainer | `src/atomic-crm/services/PATTERNS.md:429` | Open |

### Feature Incomplete (from TODO scan)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| FEAT-02 | UI Feature | Task slide-over panel not implemented - onClick handler is empty | `src/atomic-crm/opportunities/OpportunityRowListView.tsx:237` | Open |

### P2 Dependencies
- **IMP-01**: Blocks nothing | Blocked by: None | Related: IMP-02 (deep import audit)
- **IMP-02**: Blocks nothing | Blocked by: None | Related: IMP-01 (fix together as import cleanup batch)
- **IMP-03**: Blocks nothing | Blocked by: None | Related: Import cleanup (independent)
- **DEAD-02**: Blocks nothing | Blocked by: None | Related: Dead code cleanup (independent)
- **DEAD-05**: Blocks nothing | Blocked by: None | Related: Dead code cleanup (independent)
- **DEAD-06**: Blocks nothing | Blocked by: None | Related: Dead code cleanup (independent)
- **DEAD-07**: Blocks nothing | Blocked by: None | Related: Dead code cleanup (verify route first)
- **DB-02**: Blocks nothing | Blocked by: None | Related: Schema hardening (independent migration)
- **UI-20**: Blocks nothing | Blocked by: None | Related: Z-index audit (independent)
- **FORM-02**: Blocks nothing | Blocked by: None | Related: FORM-03 (fix together - same file)
- **FORM-03**: Blocks nothing | Blocked by: None | Related: FORM-02 (fix together - same file)
- **FORM-04**: Blocks nothing | Blocked by: None | Related: Mobile-first breakpoints (independent)
- **CQ-01**: Blocks nothing | Blocked by: None | Related: Validation refactor (gradual migration)
- **CQ-02/03/04**: Blocks nothing | Blocked by: None | Related: Service registration (batch fix)
- **FEAT-02**: Blocks nothing | Blocked by: Task slide-over component | Related: Task management UX

---

## P3 - Low Priority (Improvements)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-24 | A11y | Dialog/Sheet missing aria-describedby auto-linking | `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` | Open |
| UI-25 | Spacing | gap-1 usage should be gap-2 (19 files) - some may be intentional | Multiple files in src/components | Open |
| UI-26 | A11y | Select combobox missing aria-controls linking to popover | `src/components/ui/select-ui.tsx:159`, `src/components/ui/filter-select-ui.tsx:151` | Open |
| ASYNC-04 | Unsaved Changes | Extend useInAppUnsavedChanges to all slide-over edit forms | All slide-over edit tabs | Open |
| ASYNC-05 | Retry Option | Add explicit retry button on fetch errors | List components | Open |
| ASYNC-06 | Optimistic Lock | Implement updated_at version check for opportunities | Data provider, opportunity forms | Open |
| ASYNC-07 | AbortController | Add to EntityCombobox search | `src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx` | Open |
| EC-01 | i18n | RTL text support missing (dir="auto") - only textarea.tsx | `src/components/ui/textarea.tsx` (input.tsx already fixed) | Open |
| CFG-01 | Config | DEFAULT_SEGMENT_ID hardcoded - consider environment variable | `src/atomic-crm/constants.ts:4` | Open |

### P3 Dependencies
- **UI-24**: Blocks nothing | Blocked by: None | Related: A11y improvements (independent)
- **UI-25**: Blocks nothing | Blocked by: None | Related: Spacing audit (bulk fix, verify intentional gaps first)
- **UI-26**: Blocks nothing | Blocked by: None | Related: A11y improvements (fix with UI-24)
- **ASYNC-04**: Blocks nothing | Blocked by: None | Related: Unsaved changes UX (extension task)
- **ASYNC-05**: Blocks nothing | Blocked by: None | Related: Error recovery UX (independent)
- **ASYNC-06**: Blocks nothing | Blocked by: None | Related: Optimistic locking (requires DB + provider changes)
- **ASYNC-07**: Blocks nothing | Blocked by: None | Related: ASYNC-01 (AbortController pattern)
- **EC-01**: Blocks nothing | Blocked by: None | Related: i18n improvements (quick win)
- **CFG-01**: Blocks nothing | Blocked by: None | Related: Config externalization (low priority)

---

## Resolved Items Summary

**Total Resolved: 117 items**

### TODO/FIXME Scan (Jan 23, 2026)

**Resolved (1 item):**
- TS-01: NoInfer custom type removed - TypeScript 5.4+ has native NoInfer (TS version: 5.9.3)
  - File: `src/components/ra-wrappers/record-field.tsx:80`

### Verification Batch (Dec 26, 2025)

**P0 Fixed (4 items):**
- ORG-01: "operator" type now in Zod schema
- UI-01: ColumnCustomizationMenu button now h-11 w-11 (44px)
- UI-02: QuickAddOpportunity ESC handler implemented
- UI-03: QuickAddOpportunity close button with proper a11y

**P1 Fixed (18 items):**
- UI-05 through UI-18: All touch targets and layout issues resolved
- FORM-01: StepIndicator circles are display-only (not interactive)
- ORG-02: Slide-over edit mode has all fields
- ORG-03: Now using shared badge components
- ASYNC-03: checkForSimilar is synchronous (no error handling needed)
- UI-08, UI-09: contextMenu.tsx file removed from codebase

**P2 Fixed (6 items):**
- DEAD-01: OrganizationDatagridHeader.tsx IS used by OrganizationList.tsx
- DEAD-03: CSV constants ARE used by import components
- DEAD-04: Organization column aliases ARE used
- DB-01: is_principal/is_distributor removed in migration 20251018232818
- DB-03: Duplicate indexes removed in migration 20251018232818
- UI-19: AddTask now uses valid max-h-[90vh] class
- UI-21: SimilarOpportunitiesDialog uses semantic CSS variables

**P3 Fixed (5 items):**
- UI-22: dialog/alert-dialog use desktop-first max-md:flex-col-reverse
- UI-23: drawer uses bg-overlay semantic token
- EC-02: Avatar uses Array.from() for proper emoji handling
- EC-03: number-input handles both . and , as decimal separators
- ASYNC-08: beforeunload coverage verified in import dialogs

### Previously Resolved (Dec 2025)

- Button sm size: h-9 (36px) → h-12 (48px)
- Button icon size: size-9 → size-12 (48px)
- ButtonPlaceholder: h-9 w-9 → size-12 (48px)
- DialogClose touch target: now size-11 (44px)
- SheetClose touch target: now size-11 (44px)
- dropdown-menu items: now min-h-11 (44px)
- SidebarMenuButton: now min-h-11 (44px)
- command.tsx Input/Item: now min-h-11 (44px)
- ResourceSlideOver: 78vw → lg:w-[40vw] max-w-[600px]
- OpportunityCard drag handle/expand: now min-h-[44px] min-w-[44px]
- SimpleListItem focus ring: has focus-visible:ring-2
- pagination.tsx Ellipsis: now size-11 (44px)
- breadcrumb.tsx Ellipsis: now size-11 (44px)
- SECURITY DEFINER functions: all have search_path = public

---

## Quick Wins (< 30 min each)

| Item | Fix | Time Est |
|------|-----|----------|
| UI-20 | Verify z-40 doesn't conflict with other elements | 10 min |
| DEAD-02 | Delete useNotifyWithRetry.tsx if truly unused | 2 min |
| DEAD-07 | Verify sales show route is registered or delete | 5 min |
| FORM-02/03 | Add min-h-11 to FormErrorSummary buttons | 5 min |
| EC-01 | Add dir="auto" to textarea.tsx | 2 min |
| ERR-01/02/03 | Add console.error logging to catch blocks | 15 min |
| UI-26 | Add aria-controls to select-ui.tsx and filter-select-ui.tsx | 10 min |
| CFG-01 | Move DEFAULT_SEGMENT_ID to env variable | 5 min |

**Quick wins batch: ~55 minutes for 9+ items fixed**

---

## Audit History

Historical audit files (pre-January 2026) have been consolidated into this tracker.

**Recent Audits:** Current audit reports are available in `docs/audits/` (retained for ~7 days)

---

## Maintenance Notes

- This file verified against codebase on 2026-01-23
- Run `/deep-audit` to regenerate full audit reports if needed
- P0 items should block deployment
- P1 items should be addressed within current sprint
- P2/P3 items can be batched into cleanup sprints

## TODO/FIXME Comments Left in Place (Informational)

The following comments were intentionally left in the codebase as they explain "why" rather than "what to do":

| File | Line | Reason |
|------|------|--------|
| `src/components/ra-wrappers/select-input.tsx` | 236 | Links to Radix bug tracker, explains workaround |
| `src/atomic-crm/validation/opportunities/opportunities-core.ts` | 34,201 | Feature ticket reference (TODO-004a) |
| `src/atomic-crm/validation/opportunities/opportunities-operations.ts` | 151,401,459,568 | Feature ticket reference (TODO-004a) |
| `src/atomic-crm/providers/supabase/README.md` | 230 | Documentation cross-reference |
| `src/atomic-crm/reports/CampaignActivity/__tests__/*.test.tsx` | multiple | Test stubs awaiting RPC implementation |
| `src/atomic-crm/contacts/__tests__/OpportunitiesTab.test.tsx` | 28 | Test stub awaiting implementation |
| `src/atomic-crm/opportunities/slideOverTabs/__tests__/*.test.tsx` | multiple | Test stubs awaiting implementation |
| `src/tests/.quarantine/auth-flow.test.ts.legacy` | 163,191 | Quarantined test explaining mock limitation |
