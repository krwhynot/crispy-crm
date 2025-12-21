# Prioritized Fix List

**Generated:** 2025-12-21
**Total Findings:** 89 (after deduplication)
**Agents Contributing:** 23 (Agents 1-15, 16-19, 22-24)
**False Positives Removed:** 6 (per Agent 24 Devil's Advocate)

---

## Summary

| Priority | Count | Est. Effort | Status |
|----------|-------|-------------|--------|
| P0 | 8 | 6 hours | Critical - Fix Before Beta |
| P1 | 18 | 16 hours | High - Fix This Week |
| P2 | 31 | 24 hours | Medium - Fix Before Launch |
| P3 | 32 | 20+ hours | Low - Post-Launch Backlog |

---

## Conflict Resolutions Applied

| Finding | Agent A | Agent B | Resolution | Reason |
|---------|---------|---------|------------|--------|
| Activity schema .max() | Agents 18,19,21: "Missing" | Agent 24: "Already exists" | **REMOVED** | Agent 24 verified actual code has constraints |
| SalesService bypasses provider | Agents 17,18: "Violation" | Agent 24: "Compliant" | **REMOVED** | Uses dataProvider.invoke() - documented |
| Promise.allSettled | Agents 18,21: "P0 violation" | Agent 13: "Compliant" | **EXCEPTION** | Appropriate for bulk operations |
| Auth provider direct access | Agent 17: "Violation" | Agent 24: "Exception" | **EXCEPTION** | Auth precedes React context |
| Nested components count | Agent 21: "30+" | Agent 24: "15-20" | **DOWNGRADE P0→P1** | Some are outside scope |

---

## P0 - Fix Before Beta (8 items)

### Security

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-SEC-1 | Unguarded non-null assertion crashes | `field-toggle.tsx:87` | 15 min | Agent 16 |
| P0-SEC-2 | JSON.parse without Zod validation | `secureStorage.ts:54,63` | 30 min | Agent 16 |

### Data Integrity

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-DAT-1 | Contact self-manager check missing | DB migration needed | 15 min | Agent 22 |
| P0-DAT-2 | Tags soft-delete inconsistency | `resources.ts` vs `tagsCallbacks.ts` | 15 min | Agent 12 |

### Performance

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-PERF-1 | Fetches 1000 records for distinct values | `OpportunityListFilter.tsx:100-102` | 2 hrs | Agent 9 |
| P0-PERF-2 | ConfigurationContext (11 values) causes re-renders | `ConfigurationContext.tsx` | 2 hrs | Agent 9 |

### Type Safety

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-TYPE-1 | Double assertions in data provider | `unifiedDataProvider.ts:685,691,777` | 1 hr | Agent 16 |
| P0-TYPE-2 | filter-form.tsx unguarded dataset.key | `filter-form.tsx:79` | 15 min | Agent 16 |

---

## P1 - Fix This Week (18 items)

### Form State Pattern

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-FORM-1 | ProductEdit missing schema.partial().parse | `ProductEdit.tsx:40-44` | 15 min | Agent 11 |
| P1-FORM-2 | OpportunityEdit missing schema validation | `OpportunityEdit.tsx:46` | 15 min | Agent 11 |
| P1-FORM-3 | TaskSlideOverDetailsTab missing schema | `TaskSlideOverDetailsTab.tsx:85` | 15 min | Agent 11 |
| P1-FORM-4 | ContactDetailsTab missing schema | `ContactDetailsTab.tsx:60` | 15 min | Agent 11 |
| P1-FORM-5 | OrganizationDetailsTab missing schema | `OrganizationDetailsTab.tsx:53` | 15 min | Agent 11 |
| P1-FORM-6 | OpportunitySlideOverDetailsTab missing | `OpportunitySlideOverDetailsTab.tsx:196` | 15 min | Agent 11 |
| P1-FORM-7 | SalesProfileTab useState defaults | `SalesProfileTab.tsx:41-47` | 15 min | Agent 11 |
| P1-FORM-8 | SalesPermissionsTab useState defaults | `SalesPermissionsTab.tsx:60-63` | 15 min | Agent 11 |

### Error Handling

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-ERR-1 | Silent error in useDuplicateOrgCheck | `useDuplicateOrgCheck.ts:100-103` | 30 min | Agent 13 |
| P1-ERR-2 | BulkReassignButton swallows errors | `BulkReassignButton.tsx:99-109` | 30 min | Agent 13 |
| P1-ERR-3 | OrganizationDetailsTab no notify | `OrganizationDetailsTab.tsx:44-47` | 15 min | Agent 13/17 |
| P1-ERR-4 | SettingsPage console.error only | `SettingsPage.tsx` | 15 min | Agent 17 |

### Pattern Drift

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-DRIFT-1 | TaskEdit uses wrong wrapper pattern | `TaskEdit.tsx` | 1 hr | Agent 17 |
| P1-DRIFT-2 | Console.log statements in prod code | `OrganizationImportDialog.tsx` (15+) | 30 min | Agent 17 |
| P1-DRIFT-3 | Console.log in useOrganizationImport | `useOrganizationImport.tsx` | 15 min | Agent 17 |

### Component Structure

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-COMP-1 | Nested component definitions (15-20) | Various files | 2 hrs | Agent 6, 24 |
| P1-COMP-2 | Context value not memoized | `ConfigurationContext` | 30 min | Agent 9 |
| P1-COMP-3 | ValidationService wrong function | `ValidationService.ts:88` | 15 min | Agent 11 |

---

## P2 - Fix Before Launch (31 items)

### Type Safety

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-TYPE-1 | SalesEdit SubmitHandler<any> | `SalesEdit.tsx:65` | 30 min | Agent 16 |
| P2-TYPE-2 | SalesCreate SubmitHandler<any> | `SalesCreate.tsx:50` | 30 min | Agent 16 |
| P2-TYPE-3 | OrganizationImportDialog useMemo<any[]> | `OrganizationImportDialog.tsx:466` | 30 min | Agent 16 |
| P2-TYPE-4 | 5 event double-assertions | Various | 1 hr | Agent 16 |
| P2-TYPE-5 | 6 unconstrained generics | `unifiedDataProvider.ts` | 1 hr | Agent 16 |
| P2-TYPE-6 | DigestPreferences unsafe assertions | `DigestPreferences.tsx:41,52,64` | 30 min | Agent 16 |

### Module Structure

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-MOD-1 | organizations/index.tsx pattern drift | `organizations/index.tsx` | 30 min | Agent 10 |
| P2-MOD-2 | activities/index.tsx pattern drift | `activities/index.tsx` | 30 min | Agent 10 |
| P2-MOD-3 | OpportunityInputs in forms/ subdir | `opportunities/forms/` | 15 min | Agent 10 |
| P2-MOD-4 | Missing ActivityEdit.tsx | `activities/` | 1 hr | Agent 10 |
| P2-MOD-5 | Missing ActivityInputs.tsx | `activities/` | 30 min | Agent 10 |
| P2-MOD-6 | Missing SalesShow.tsx | `sales/` | 1 hr | Agent 10 |
| P2-MOD-7 | Missing ProductShow.tsx | `products/` | 1 hr | Agent 10 |

### Async Handling

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-ASYNC-1 | beforeunload missing in import wizard | `ContactImportDialog.tsx` | 30 min | Agent 23 |
| P2-ASYNC-2 | AbortController missing in bulk ops | `BulkReassignButton.tsx` | 30 min | Agent 23 |
| P2-ASYNC-3 | Missing retry action on error toasts | Toast notifications | 1 hr | Agent 23 |

### Large Components

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-SIZE-1 | OrganizationImportDialog (1082 lines) | Split into 4 components | 3 hrs | Agent 15 |
| P2-SIZE-2 | AuthorizationsTab (1043 lines) | Split into 3-4 components | 3 hrs | Agent 15 |
| P2-SIZE-3 | CampaignActivityReport (900 lines) | Extract useCampaignReportData | 2 hrs | Agent 15 |
| P2-SIZE-4 | ContactImportPreview (845 lines) | Split preview/mapping | 2 hrs | Agent 15 |

### Deprecated Code

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-DEP-1 | 3 deprecated contexts to migrate | `src/hooks/` | 1 hr | Agent 9, 12 |
| P2-DEP-2 | Legacy segment schemas | `validation/segments.ts` | 30 min | Agent 12 |
| P2-DEP-3 | OrganizationShow.tsx deprecated | `organizations/` | 15 min | Agent 12 |

### Import/Coupling

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-IMP-1 | TaskList.tsx (31 imports) | `TaskList.tsx` | 2 hrs | Agent 14 |
| P2-IMP-2 | Extract Avatar to shared/components | `contacts/Avatar` | 1 hr | Agent 14 |
| P2-IMP-3 | Extract TagsList to shared | `contacts/TagsList` | 1 hr | Agent 14 |

### ESLint

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-LINT-1 | Add import/order rule | `eslint.config.js` | 30 min | Agent 11 |
| P2-LINT-2 | Add @ts-ignore justification | `columns-button.tsx:4` | 5 min | Agent 16 |

### Data Relationships

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-DATA-1 | Activities CASCADE on contact delete | Consider SET NULL | 30 min | Agent 22 |
| P2-DATA-2 | Empty state guidance missing | Contact/Opp create forms | 2 hrs | Agent 22 |

---

## P3 - Post-Launch Backlog (32 items)

### Code Quality

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-QUAL-1 | 60+ @deprecated annotations to clean | Various | 3 hrs | Agent 12 |
| P3-QUAL-2 | Consolidate dual export patterns (4 files) | Various | 30 min | Agent 11 |
| P3-QUAL-3 | ContactBadges type→interface | `ContactBadges.tsx` | 15 min | Agent 11 |
| P3-QUAL-4 | Add ContactEdit form key | `ContactEdit.tsx` | 5 min | Agent 17 |
| P3-QUAL-5 | SalesList StandardListLayout | `SalesList.tsx` | 15 min | Agent 17 |
| P3-QUAL-6 | Extract CreateFormFooter | `ContactCreate, TaskCreate` | 1 hr | Agent 17 |
| P3-QUAL-7 | WhatsNew page data-driven | `WhatsNew.tsx` (514 lines) | 2 hrs | Agent 15 |
| P3-QUAL-8 | Duplicate ucFirst function | `opportunityUtils.ts`, `OpportunityArchivedList.tsx` | 15 min | Agent 18 |

### Dead Code

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-DEAD-1 | OrganizationType.tsx (85 lines) | Delete file | 5 min | Agent 18 |
| P3-DEAD-2 | sizes.ts (7 lines) | Delete file | 5 min | Agent 18 |
| P3-DEAD-3 | Test-only files (738 lines) | contextMenu, keyboardShortcuts, exportScheduler | 15 min | Agent 18 |
| P3-DEAD-4 | Dead organizationImport.logic exports | 4 functions | 30 min | Agent 18 |
| P3-DEAD-5 | Dead organizationColumnAliases exports | 4 functions | 30 min | Agent 18 |
| P3-DEAD-6 | simple-list/ directory (475 lines) | Delete directory | 5 min | Agent 19 |
| P3-DEAD-7 | toggle.tsx unused | Delete file | 5 min | Agent 19 |
| P3-DEAD-8 | ProductGridList.tsx orphaned | Delete file | 5 min | Agent 19 |
| P3-DEAD-9 | Unreferenced assets (react.svg, adding-users.png) | Delete files | 5 min | Agent 19 |

### Unused Dependencies

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-DEP-1 | react-resizable-panels | npm uninstall | 5 min | Agent 19 |
| P3-DEP-2 | @radix-ui/react-navigation-menu | npm uninstall | 5 min | Agent 19 |
| P3-DEP-3 | @radix-ui/react-toggle | npm uninstall | 5 min | Agent 19 |

### Config Cleanup

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-CFG-1 | vite.config.ts stale entries | Remove lodash, navigation-menu | 15 min | Agent 19 |
| P3-CFG-2 | Verify vitest.config alias | ra-ui-materialui | 15 min | Agent 19 |

### Future Improvements

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-FUT-1 | Optimistic locking for opportunities | DB + provider | 4 hrs | Agent 22, 23 |
| P3-FUT-2 | Segments hierarchy cycle protection | DB trigger | 1 hr | Agent 22 |
| P3-FUT-3 | Bootstrap onboarding wizard | New feature | 8 hrs | Agent 22 |
| P3-FUT-4 | useAbortableFetch hook | New utility | 1 hr | Agent 23 |
| P3-FUT-5 | Enable exactOptionalPropertyTypes | tsconfig | 2 hrs | Agent 16 |
| P3-FUT-6 | Component scaffolding templates | npm scripts | 2 hrs | Agent 17 |
| P3-FUT-7 | Architecture diagram from import matrix | Documentation | 2 hrs | Agent 14 |

---

## Findings by Category

### By Feature

| Feature | P0 | P1 | P2 | P3 | Total |
|---------|----|----|----|----|-------|
| opportunities | 1 | 2 | 3 | 2 | 8 |
| organizations | 0 | 4 | 5 | 3 | 12 |
| contacts | 0 | 2 | 3 | 2 | 7 |
| sales | 0 | 2 | 4 | 1 | 7 |
| tasks | 0 | 2 | 1 | 0 | 3 |
| activities | 0 | 0 | 3 | 1 | 4 |
| products | 0 | 1 | 2 | 1 | 4 |
| data provider | 2 | 0 | 2 | 0 | 4 |
| validation | 1 | 0 | 1 | 1 | 3 |
| infrastructure | 4 | 5 | 7 | 21 | 37 |

### By Type

| Type | Count | Top Priority | Est. Effort |
|------|-------|--------------|-------------|
| Type Safety | 14 | P0-TYPE-1 | 6 hrs |
| Form Patterns | 8 | P1-FORM-1 | 2 hrs |
| Error Handling | 6 | P1-ERR-1 | 2 hrs |
| Dead Code | 12 | P3-DEAD-1 | 2 hrs |
| Module Structure | 9 | P2-MOD-1 | 6 hrs |
| Performance | 4 | P0-PERF-1 | 5 hrs |
| Pattern Drift | 5 | P1-DRIFT-1 | 3 hrs |
| Component Size | 4 | P2-SIZE-1 | 10 hrs |
| Async/Concurrency | 4 | P2-ASYNC-1 | 2 hrs |
| Dependencies | 3 | P3-DEP-1 | 15 min |
| Data Integrity | 4 | P0-DAT-1 | 1 hr |
| Other | 16 | Various | 8 hrs |

---

## Accepted Exceptions (Not to Fix)

Per Agent 24 (Devil's Advocate) analysis:

| Exception | Principle | Location | Justification |
|-----------|-----------|----------|---------------|
| EXCEPTION-001 | #2 Single Entry Point | `authProvider.ts` | Auth precedes React context |
| EXCEPTION-002 | #2 Single Entry Point | Storage in data provider | Binary blob ops differ from tables |
| EXCEPTION-003 | #1 Fail-Fast | `useTutorialProgress.ts` | Non-critical feature, graceful degrade |
| EXCEPTION-004 | #1 Fail-Fast | Promise.allSettled in bulk ops | Partial success is valid for batches |
| EXCEPTION-005 | #11 TypeScript | `any` in RA wrappers | Library integration boundaries |

---

## Quick Wins (< 30 min each)

| ID | Finding | Effort | Impact |
|----|---------|--------|--------|
| P0-SEC-1 | field-toggle.tsx null check | 15 min | Prevents crash |
| P0-DAT-1 | Contact self-manager constraint | 15 min | Data integrity |
| P0-DAT-2 | Tags soft-delete fix | 15 min | Consistency |
| P1-FORM-* | 8 form schema fixes | 2 hrs total | Pattern compliance |
| P3-DEAD-1 | Delete OrganizationType.tsx | 5 min | Code cleanup |
| P3-DEAD-6 | Delete simple-list/ | 5 min | 475 lines removed |
| P3-DEP-* | npm uninstall 3 packages | 5 min | ~90KB bundle savings |

---

## Verification Commands

```bash
# After P0 fixes
npm run build && npm test

# After dead code removal
npm run build
npx bundlesize

# After dependency cleanup
npm audit
npm outdated
```

---

*Generated by Agent 25 - Forensic Aggregator*
*Crispy CRM 25-Agent Audit Suite*
