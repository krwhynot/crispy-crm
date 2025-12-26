# Technical Debt Tracker

**Generated:** 2025-12-26
**Source:** Consolidated from 40+ audit reports
**Status:** Active tracking document

---

## Summary

| Priority | Open Items | Resolved |
|----------|------------|----------|
| P0 - Critical | 5 | 8 |
| P1 - High | 23 | 15 |
| P2 - Medium | 18 | 33 |
| P3 - Low | 12 | 27 |
| **Total** | **58** | **83** |

---

## P0 - Critical (Must Fix Before Launch)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ORG-01 | Type Mismatch | "operator" type in DB/constants but missing from Zod schema - causes API validation failures | `src/atomic-crm/validation/organizations.ts:11` | Open |
| UI-01 | Touch Target | ColumnCustomizationMenu button 32px (< 44px minimum) | `ColumnCustomizationMenu.tsx:44` | Open |
| UI-02 | Keyboard Nav | QuickAddOpportunity missing ESC handler | `QuickAddOpportunity.tsx:102` | Open |
| UI-03 | UX Convention | QuickAddOpportunity missing close button | `QuickAddOpportunity.tsx:102` | Open |
| UI-04 | Focus Mgmt | ColumnsButton manual portal bypass breaks focus management | `columns-button.tsx:86` | Open |

---

## P1 - High Priority (Fix This Sprint)

### UI/UX Issues

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-05 | Touch Target | Header NavigationTab < 44px height | `Header.tsx:130-141` | Open |
| UI-06 | Focus Ring | Header NavigationTab missing focus ring | `Header.tsx:130-141` | Open |
| UI-07 | Touch Target | Sidebar sm variant h-7 (28px) | `sidebar.tsx:446` | Open |
| UI-08 | Touch Target | contextMenu main items < 44px | `contextMenu.tsx:94` | Open |
| UI-09 | Touch Target | contextMenu submenu items < 44px | `contextMenu.tsx:138` | Open |
| UI-10 | Touch Target | ColumnsButton clear button 16px | `columns-button.tsx:170` | Open |
| UI-11 | Touch Target | QuickAddOpportunity buttons no h-11 | `QuickAddOpportunity.tsx:167-191` | Open |
| UI-12 | Touch Target | ProductList popover button no size | `ProductList.tsx:57-60` | Open |
| UI-13 | Touch Target | select-input.tsx loading skeleton 36px | `select-input.tsx:184` | Open |
| UI-14 | Layout | ContactList name no truncation | `ContactList.tsx:126` | Open |
| UI-15 | Layout | ContactDetailsTab notes no max-height | `ContactDetailsTab.tsx:215` | Open |
| UI-16 | Focus Trap | theme-mode-toggle modal={false} | `theme-mode-toggle.tsx:50` | Open |
| UI-17 | Focus Trap | locales-menu-button modal={false} | `locales-menu-button.tsx:29` | Open |
| UI-18 | Layout | StandardListLayout missing min-w | `StandardListLayout.tsx:180` | Open |

### Forms Issues

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| FORM-01 | Touch Target | StepIndicator step circles 32px (if tappable) | `StepIndicator.tsx:59` | Open |

### Organizations Module

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ORG-02 | UI Gap | Slide-over edit mode missing 7 fields available in full edit | `OrganizationDetailsTab.tsx:61-91` | Open |
| ORG-03 | Maintainability | Duplicate badge component definitions | `OrganizationDetailsTab.tsx:222-240` | Open |

### Async/State Issues

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ASYNC-01 | Race Condition | Add cancelled flag to custom useEffect fetches | Multiple custom hooks | Open |
| ASYNC-02 | Loading State | Slide-over saves lack loading indicator | `OrganizationDetailsTab.tsx:35`, `ContactDetailsTab.tsx:44`, `TaskSlideOverDetailsTab.tsx:50` | Open |
| ASYNC-03 | Error Handling | checkForSimilar missing error handling | `OpportunityCreateWizard.tsx:173` | Open |

### Error Handling

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| ERR-01 | Silent Catch | Avatar utils silent catches need logging | `avatar.utils.ts:55-56, 85-87` | Open |
| ERR-02 | Silent Catch | Filter storage errors silently ignored | `filterPrecedence.ts:70-71, 191-193` | Open |
| ERR-03 | Error Propagation | QuickCreatePopover catches but doesn't rethrow | `QuickCreatePopover.tsx:71, 92` | Open |

---

## P2 - Medium Priority (Tech Debt)

### Import Health

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| IMP-01 | Deep Imports | 4-level deep imports need @/ alias | `customMethodsExtension.test.ts:31-32` | Open |
| IMP-02 | Deep Imports | 3-level deep imports in provider/service layer | `ValidationService.ts`, `TransformService.ts`, `customMethodsExtension.ts`, +6 files | Open |
| IMP-03 | Extension | 5 imports include unnecessary .tsx extension | `login-page.tsx`, `forgot-password-page.tsx`, `ListNoResults.tsx`, `CRM.tsx` | Open |

### Dead Code

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| DEAD-01 | Dead File | OrganizationDatagridHeader.tsx - 81 lines, zero imports | `OrganizationDatagridHeader.tsx` | Open |
| DEAD-02 | Dead Export | useNotifyWithRetry hook - zero consumers | `useNotifyWithRetry.tsx` | Open |
| DEAD-03 | Dead Exports | CSV import constants unused | `csvConstants.ts:12, 18, 35` | Open |
| DEAD-04 | Dead Exports | Organization column aliases unused | `organizationColumnAliases.ts:14, 235, 319` | Open |
| DEAD-05 | Dead Types | InteractionParticipant, DashboardSnapshot | `types.ts:185, 339` | Open |
| DEAD-06 | Dead Export | BADGE_TOUCH_CLASSES | `organizations/constants.ts:234` | Open |
| DEAD-07 | Dead Export | SalesShowView | `sales/resource.tsx:35` | Open |

### Database Schema

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| DB-01 | Deprecated | is_principal/is_distributor columns still exist | New migration needed | Open |
| DB-02 | Validation Gap | No DB text length constraints (Zod has limits, DB doesn't) | New migration needed | Open |
| DB-03 | Duplicate Indexes | idx_companies_* variants from table rename | New migration needed | Open |

### UI/UX (Lower Priority)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-19 | CSS Bug | AddTask invalid max-h-9/10 class | `AddTask.tsx` | Open |
| UI-20 | Z-Index | LogActivityFAB z-50 conflict | `LogActivityFAB.tsx` | Open |
| UI-21 | Design System | SimilarOpportunitiesDialog non-standard CSS var | `SimilarOpportunitiesDialog.tsx:111` | Open |

### Forms (Lower Priority)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| FORM-02 | Touch Target | FormErrorSummary expand button < 44px | `FormErrorSummary.tsx:136` | Open |
| FORM-03 | Touch Target | FormErrorSummary error item button < 44px | `FormErrorSummary.tsx:168` | Open |
| FORM-04 | Mobile-First | SimpleFormIterator uses sm: instead of md: | `simple-form-iterator.tsx:324` | Open |

---

## P3 - Low Priority (Improvements)

| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-22 | Layout | dialog/alert-dialog footers use mobile-first pattern | `dialog.tsx`, `alert-dialog.tsx` | Open |
| UI-23 | Color Token | drawer bg-black/80 should use semantic token | `drawer.tsx` | Open |
| UI-24 | A11y | Dialog/Sheet missing aria-describedby auto-linking | `dialog.tsx`, `sheet.tsx` | Open |
| UI-25 | Spacing | gap-1 violations should be gap-2 | Multiple files | Open |
| ASYNC-04 | Unsaved Changes | Extend useInAppUnsavedChanges to all edit forms | All slide-over edit tabs | Open |
| ASYNC-05 | Retry Option | Add explicit retry button on fetch errors | List components | Open |
| ASYNC-06 | Optimistic Lock | Implement updated_at version check for opportunities | Data provider, opportunity forms | Open |
| ASYNC-07 | AbortController | Add to EntityCombobox search | `EntityCombobox.tsx` | Open |
| ASYNC-08 | beforeunload | Extend protection to create forms | All create form components | Open |
| EC-01 | i18n | RTL text support missing (dir="auto") | `input.tsx`, `textarea.tsx` | Open |
| EC-02 | i18n | Avatar emoji handling uses charAt(0) | `Avatar.tsx`, `OrganizationAvatar.tsx` | Open |
| EC-03 | i18n | Number input only parses English decimal format | `number-input.tsx` | Open |

---

## Resolved Items Summary

**Total Resolved: 83 items**

### Recently Resolved (Dec 2025)

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
| ORG-01 | Add "operator" to organizationTypeSchema | 5 min |
| UI-01 | Change h-8 w-8 to h-11 w-11 | 5 min |
| UI-05 | Add min-h-11 to NavigationTab | 5 min |
| UI-08/09 | Add min-h-11 to menu items | 5 min |
| UI-07 | Change h-7 to min-h-11 or remove | 5 min |
| UI-16/17 | Remove modal={false} prop | 2 min |
| UI-14 | Add truncate class to name column | 5 min |
| UI-19 | Change max-h-9/10 to max-h-[90vh] | 2 min |
| UI-02 | Add useEffect ESC key listener | 10 min |
| DEAD-01 | Delete OrganizationDatagridHeader.tsx | 2 min |

**Quick wins batch: ~50 minutes for 10+ items fixed**

---

## Archive Location

Original audit files are archived at: `docs/archive/audits/`

- `code-quality/tier-1/` - Core audits (01-15)
- `code-quality/tier-2/` - Pattern audits (16-19)
- `code-quality/tier-3/` - Edge case audits (20-24)
- `ui-ux/` - UI/UX audits (13 specialist reports)
- `organizations-architecture-audit.md`
- `import-health-audit-report.md`

---

## Maintenance Notes

- This file should be updated as items are resolved
- Run `/deep-audit` to regenerate full audit reports if needed
- P0 items should block deployment
- P1 items should be addressed within current sprint
- P2/P3 items can be batched into cleanup sprints
