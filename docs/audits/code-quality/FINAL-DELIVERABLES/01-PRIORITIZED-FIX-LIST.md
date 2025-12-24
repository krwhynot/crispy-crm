# Prioritized Fix List

**Generated:** 2025-12-24
**Agent:** 25B - Forensic Aggregator (Prioritization)
**Total Findings:** 156 (deduplicated from 247 raw)
**Agents Contributing:** 24
**Conflicts Resolved:** 7
**False Negatives Captured:** 52

---

## Executive Summary

| Priority | Count | Est. Effort | Timeline | Description |
|----------|-------|-------------|----------|-------------|
| P0 | 6 | 1.5 hours | Before beta | Critical quick wins |
| P1 | 46 | 12 hours | This week | High-priority fixes |
| P2 | 48 | 40 hours | Before launch | Sprint backlog items |
| P3 | 56 | 20 hours | Post-launch | Tech debt cleanup |
| **Total** | **156** | **73.5 hours** | | |

### Priority Matrix Applied

| Impact | Effort Low | Effort Medium | Effort High |
|--------|------------|---------------|-------------|
| High | **P0** | P1 | P1 |
| Medium | P1 | **P2** | P2 |
| Low | P2 | P3 | **P3** |

**Impact Categories:**
- **High:** Security, data integrity, crashes/DoS
- **Medium:** User experience, performance, constitution compliance
- **Low:** Developer experience, code cleanliness, tech debt

---

## P0 - Fix Before Beta

> **Theme:** High-impact security issues with trivial fixes. Maximum ROI.
> **Total: 6 items | 1.5 hours**

### Security - Mass Assignment Risk (3 items, 45 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-SEC-1 | `.passthrough()` at API boundary - allows arbitrary fields | `task.ts:92` | 15m | Agent 2, 20B-2 |
| P0-SEC-2 | `.passthrough()` at API boundary - allows arbitrary fields | `distributorAuthorizations.ts:149` | 15m | Agent 2, 20B-2 |
| P0-SEC-3 | `.passthrough()` in form schema bypasses validation | `activityDraftSchema.ts:21` | 15m | Agent 2, 20B-2 |

**Fix Pattern:**
```typescript
// BEFORE (vulnerable):
export const taskSchema = z.object({...}).passthrough();

// AFTER (secure):
export const taskSchema = z.strictObject({...});
```

### Performance - DoS Risk (3 items, 15 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P0-PERF-1 | `perPage: 10000` - extreme over-fetch, memory exhaustion | `useReportData.ts:119` | 5m | Agent 7, 20A-1 |
| P0-PERF-2 | `perPage: 10000` - extreme over-fetch | `CampaignActivityReport.tsx:79` | 5m | Agent 7, 20A-1 |
| P0-PERF-3 | `perPage: 10000` - extreme over-fetch | `CampaignActivityReport.tsx:103` | 5m | Agent 7, 20A-1 |

**Fix Pattern:**
```typescript
// BEFORE (DoS risk):
const { data } = useGetList('opportunities', { pagination: { perPage: 10000 }});

// AFTER (safe):
const { data } = useGetList('opportunities', { pagination: { perPage: 100 }});
// Add server-side aggregation for reports
```

---

## P1 - Fix This Week

> **Theme:** Constitution violations and error handling gaps. Immediate attention required.
> **Total: 46 items | 12 hours**

### Constitution Violations - Form Mode (4 items, 40 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-CONST-1 | Missing `mode="onBlur"` - violates form performance principle | `OpportunityCreate.tsx:47` | 10m | Agent 3, 17, 20A-1 |
| P1-CONST-2 | Missing `mode="onBlur"` - violates form performance principle | `OrganizationEdit.tsx:51` | 10m | Agent 3, 17, 20A-1 |
| P1-CONST-3 | Missing `mode="onBlur"` - violates form performance principle | `TaskEdit.tsx:48` | 10m | Agent 17, 20B-1 |
| P1-CONST-4 | Missing `mode="onBlur"` - violates form performance principle | `AddTask.tsx:120` | 10m | Agent 17, 20B-1 |

**Fix Pattern:**
```tsx
// BEFORE (re-render storm):
<SimpleForm>

// AFTER (controlled validation):
<SimpleForm mode="onBlur">
```

### Error Handling - Silent Failures in Task Domain (8 items, 2 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-ERR-1 | Catch block without rethrow - error silenced | `TaskActionMenu.tsx:102` | 15m | Agent 13, 20A-2 |
| P1-ERR-2 | Catch block without rethrow - error silenced | `TaskActionMenu.tsx:117` | 15m | Agent 13, 20A-2 |
| P1-ERR-3 | Catch block without rethrow - error silenced | `TaskActionMenu.tsx:133` | 15m | Agent 13, 20A-2 |
| P1-ERR-4 | Catch block without rethrow - error silenced | `TasksKanbanPanel.tsx:94` | 15m | Agent 13, 20A-2 |
| P1-ERR-5 | Catch block without rethrow - error silenced | `TasksKanbanPanel.tsx:233` | 15m | Agent 13, 20A-2 |
| P1-ERR-6 | Catch block without rethrow - error silenced | `TaskKanbanCard.tsx:162` | 15m | Agent 13, 20A-2 |
| P1-ERR-7 | Catch block without rethrow - error silenced | `TaskKanbanCard.tsx:288` | 15m | Agent 13, 20A-2 |
| P1-ERR-8 | Catch block without rethrow - error silenced | `TaskCompleteSheet.tsx:211` | 15m | Agent 13, 20A-2 |

**Fix Pattern:**
```typescript
// BEFORE (silent failure):
catch (error) {
  console.error(error);
}

// AFTER (fail-fast):
catch (error) {
  console.error('Task action failed:', error);
  throw error; // Or notify user and throw
}
```

### Data Integrity (2 items, 1.5 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-DATA-1 | No cycle protection trigger for manager self-reference | `contacts.manager_id` | 1h | Agent 22 |
| P1-DATA-2 | No FK constraint - orphan tasks possible | `tasks.opportunity_id` | 30m | Agent 22 |

**Fix Pattern (P1-DATA-1):**
```sql
CREATE OR REPLACE FUNCTION check_contact_manager_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'Contact cannot be their own manager';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Performance - React.memo Missing (15 items, 2.5 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-PERF-1 | Missing React.memo - list render perf | `KPICard.tsx (reports):19` | 10m | Agent 6, 20A-1 |
| P1-PERF-2 | Missing React.memo - list render perf | `KPICard.tsx (dashboard):98` | 10m | Agent 6, 20A-1, 20B-2 |
| P1-PERF-3 | Missing React.memo - list render perf | `PipelineTableRow.tsx:61` | 10m | Agent 6, 20A-1 |
| P1-PERF-4 | Missing React.memo - list render perf | `ActivityTypeCard.tsx:36` | 10m | Agent 6, 20A-1 |
| P1-PERF-5 | Missing React.memo - list render perf | `SuggestedOpportunityCard.tsx:15` | 10m | Agent 6, 20A-1 |
| P1-PERF-6 | Missing React.memo - list render perf | `OpportunityCardActions.tsx:21` | 10m | Agent 6, 20A-1 |
| P1-PERF-7 | Missing React.memo - list render perf | `OrganizationInfoCard.tsx:24` | 10m | Agent 6, 20A-1 |
| P1-PERF-8 | Missing React.memo - list render perf | `ProductCard.tsx:16` | 10m | Agent 6, 20A-1 |
| P1-PERF-9 | Missing React.memo - list render perf | `OpportunityRowListView.tsx:25` | 10m | Agent 6, 20A-1 |
| P1-PERF-10 | Missing React.memo - list render perf | `KPISummaryRow.tsx:22` | 10m | Agent 6, 20A-1 |
| P1-PERF-11 | Missing React.memo - list render perf | `MetadataRow.tsx:8` | 10m | Agent 6, 20A-1 |
| P1-PERF-12 | Missing React.memo - list render perf | `TaskRelatedItemsTab.tsx:27` | 10m | Agent 6, 20A-1 |
| P1-PERF-13 | Missing React.memo - timeline perf | `ActivityTimelineEntry.tsx` | 10m | Agent 6 |
| P1-PERF-14 | Missing React.memo - list render perf | `AuthorizationCard.tsx` | 10m | Agent 6 |
| P1-PERF-15 | Missing React.memo - filter perf | `ToggleFilterButton.tsx` | 10m | Agent 6 |

**Fix Pattern:**
```tsx
// BEFORE:
export const KPICard = ({ value, label }) => {...};

// AFTER:
export const KPICard = React.memo(({ value, label }) => {...});
```

### Performance - watch() Anti-pattern (3 items, 45 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-PERF-16 | `watch()` instead of `useWatch()` - re-render storm | `QuickCreatePopover.tsx:126` | 15m | Agent 6, 20A-1 |
| P1-PERF-17 | `watch()` instead of `useWatch()` - re-render storm | `QuickCreatePopover.tsx:150` | 15m | Agent 6, 20A-1 |
| P1-PERF-18 | `watch()` instead of `useWatch()` - re-render storm | `TagDialog.tsx:67` | 15m | Agent 6, 20A-1 |

**Fix Pattern:**
```tsx
// BEFORE (re-renders entire form):
const value = watch('fieldName');

// AFTER (isolated re-render):
const value = useWatch({ name: 'fieldName' });
```

### Performance - Over-fetching Medium Severity (5 items, 25 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-PERF-19 | `perPage: 1000` - over-fetch | `WeeklyActivitySummary.tsx:51` | 5m | Agent 7, 20A-1 |
| P1-PERF-20 | `perPage: 1000` - over-fetch | `WeeklyActivitySummary.tsx:62` | 5m | Agent 7, 20A-1 |
| P1-PERF-21 | `perPage: 1000` - over-fetch | `OpportunitiesByPrincipalReport.tsx:218` | 5m | Agent 7, 20A-1 |
| P1-PERF-22 | `perPage: 1000` - over-fetch | `useSimilarOpportunityCheck.ts:125` | 5m | Agent 7, 20A-1 |
| P1-PERF-23 | `perPage: 1000` - over-fetch | `OpportunityArchivedList.tsx:25` | 5m | Agent 7 |

### Validation - Internal .passthrough() (3 items, 45 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-VAL-1 | `.passthrough()` internal state | `useTutorialProgress.ts:35` | 15m | Agent 2, 20B-2 |
| P1-VAL-2 | `.passthrough()` filter validation | `useFilterCleanup.ts:34` | 15m | Agent 2, 20B-2 |
| P1-VAL-3 | `.passthrough()` preferences | `opportunityStagePreferences.ts:22` | 15m | Agent 2, 20B-2 |

### Security - Audit Required (1 item, 2 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P1-SEC-1 | SECURITY DEFINER inventory missing/incomplete | Multiple migrations | 2h | Agent 4, 20A-1 |

### P1 Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Constitution | 4 | 40m |
| Error Handling | 8 | 2h |
| Data Integrity | 2 | 1.5h |
| Performance | 23 | 4h |
| Validation | 3 | 45m |
| Security Audit | 1 | 2h |
| **Total P1** | **46** | **~12 hours** |

---

## P2 - Fix Before Launch

> **Theme:** UX polish, race conditions, and code quality. Sprint backlog material.
> **Total: 48 items | 40 hours**

### Error Handling - Silent Catches Non-Critical Paths (8 items, 2 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-ERR-1 | Silent catch block | `AuthorizationsTab.tsx:120` | 15m | Agent 13, 20A-2 |
| P2-ERR-2 | Silent catch block | `ProductExceptionsSection.tsx:60` | 15m | Agent 13, 20A-2 |
| P2-ERR-3 | Silent catch block | `OpportunityCreateFormTutorial.tsx:54` | 15m | Agent 13, 20A-2 |
| P2-ERR-4 | Silent catch block | `NotificationsList.tsx:235` | 15m | Agent 13, 20A-2 |
| P2-ERR-5 | Silent catch block | `OpportunitiesTab.tsx:109` | 15m | Agent 13, 20A-2 |
| P2-ERR-6 | Silent catch block | `LinkOpportunityModal.tsx:70` | 15m | Agent 13, 20A-2 |
| P2-ERR-7 | Silent catch block | `UnlinkConfirmDialog.tsx:50` | 15m | Agent 13, 20A-2 |
| P2-ERR-8 | Silent catch block | `OpportunityCardActions.tsx:117` | 15m | Agent 13, 20A-2 |

### UX - Loading States (8 items, 7 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-UX-1 | No loading state during save operations | Multiple slide-overs | 2h | Agent 23 |
| P2-UX-2 | Missing unsaved changes warning | Multiple forms | 2h | Agent 23 |
| P2-UX-3 | No loading state during save | `OrganizationDetailsTab.tsx:35` | 30m | Agent 23 |
| P2-UX-4 | No loading/button disable | `QuickLogForm.tsx:126` | 30m | Agent 23 |
| P2-UX-5 | No loading feedback | `TaskSlideOverDetailsTab.tsx:50` | 30m | Agent 23 |
| P2-UX-6 | No loading feedback | `ContactDetailsTab.tsx:44` | 30m | Agent 23 |
| P2-UX-7 | No loading feedback | `ProductDetailsTab.tsx` | 30m | Agent 23 |
| P2-UX-8 | Missing useUnsavedChangesWarning | `TaskCreate.tsx` | 30m | Agent 21, 23 |

### Async/Concurrency (4 items, 7 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-ASYNC-1 | No optimistic locking for concurrent edits | Multiple entities | 4h | Agent 22, 23 |
| P2-ASYNC-2 | Race condition on rapid filter changes | `OrganizationList.tsx` | 1h | Agent 23 |
| P2-ASYNC-3 | Race condition on debounced search | `EntityCombobox.tsx` | 1h | Agent 23 |
| P2-ASYNC-4 | Race condition on principal filter switch | Dashboard data | 1h | Agent 23 |

### Type Safety (9 items, 4.5 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-TYPE-1 | localStorage without Zod validation | `cleanupMigration.ts:10-26` | 30m | Agent 16, 20B-1 |
| P2-TYPE-2 | localStorage with only truthiness check | `StandardListLayout.tsx:61` | 30m | Agent 16, 20B-1 |
| P2-TYPE-3 | Double type assertion | `unifiedDataProvider.ts:720` | 30m | Agent 5, 16 |
| P2-TYPE-4 | Double type assertion | `unifiedDataProvider.ts:728` | 30m | Agent 5, 16 |
| P2-TYPE-5 | Double type assertion | `unifiedDataProvider.ts:818` | 30m | Agent 5, 16 |
| P2-TYPE-6 | `.json()` without Zod boundary | `unifiedDataProvider.ts:1582` | 30m | Agent 16, 20B-1 |
| P2-TYPE-7 | `.json()` without Zod boundary | `unifiedDataProvider.ts:1588` | 30m | Agent 16, 20B-1 |
| P2-TYPE-8 | `.json()` without Zod boundary | `unifiedDataProvider.ts:1618` | 30m | Agent 16, 20B-1 |
| P2-TYPE-9 | `.json()` without Zod boundary | `unifiedDataProvider.ts:1624` | 30m | Agent 16, 20B-1 |

### Large Component Refactoring (13 items, 30 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-REFACTOR-1 | 1060 lines - needs decomposition | `OrganizationImportDialog.tsx` | 4h | Agent 15 |
| P2-REFACTOR-2 | 958 lines - needs decomposition | `CampaignActivityReport.tsx` | 4h | Agent 15 |
| P2-REFACTOR-3 | 845 lines - needs decomposition | `ContactImportPreview.tsx` | 3h | Agent 15 |
| P2-REFACTOR-4 | 713 lines - needs decomposition | `ContactImportDialog.tsx` | 3h | Agent 15 |
| P2-REFACTOR-5 | 604 lines - needs decomposition | `OpportunitiesByPrincipalReport.tsx` | 2h | Agent 15 |
| P2-REFACTOR-6 | 578 lines - needs decomposition | `QuickLogActivityDialog.tsx` | 2h | Agent 15 |
| P2-REFACTOR-7 | 548 lines - needs decomposition | `OpportunityWizardSteps.tsx` | 2h | Agent 15 |
| P2-REFACTOR-8 | 531 lines - needs decomposition | `OpportunitySlideOverDetailsTab.tsx` | 2h | Agent 15 |
| P2-REFACTOR-9 | 503 lines - needs decomposition | `SampleStatusBadge.tsx` | 2h | Agent 15 |
| P2-REFACTOR-10 | 500 lines - needs decomposition | `OpportunityListContent.tsx` | 2h | Agent 15 |
| P2-REFACTOR-11 | 514 lines - large component | `WhatsNew.tsx` | 2h | Agent 15, 20A-2 |
| P2-REFACTOR-12 | 464 lines - large component | `OrganizationImportPreview.tsx` | 2h | Agent 15, 20A-2 |
| P2-REFACTOR-13 | 443 lines - large component | `ChangeLogTab.tsx` | 2h | Agent 15, 20A-2 |

### Namespace Imports (1 item, 2 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P2-NS-1 | 31 namespace imports (`import * as`) - review needed | Multiple files | 2h | Agent 14, 20A-2 |

### P2 Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Error Handling | 8 | 2h |
| UX/Loading States | 8 | 7h |
| Async/Concurrency | 4 | 7h |
| Type Safety | 9 | 4.5h |
| Large Component Refactoring | 13 | 30h |
| Namespace Imports | 1 | 2h |
| **Total P2** | **48** | **~40 hours** |

---

## P3 - Post-Launch Backlog

> **Theme:** Tech debt, dead code, and polish. Non-blocking for launch.
> **Total: 56 items | 20 hours**

### Dead Code (8 items, 1 hour)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-DEAD-1 | Dead code - 0 consumers | `useNotifyWithRetry.tsx` | 15m | Agent 13, 18, 24 |
| P3-DEAD-2 | May be dead (verify usage) | `organizationColumnAliases.ts` | 15m | Agent 18, 20B-1 |
| P3-DEAD-3 | Dead export in active file | `OrganizationColumnHeaders` | 10m | Agent 18, 20B-1 |
| P3-DEAD-4 | Dead type | `InteractionParticipant (types.ts)` | 5m | Agent 18 |
| P3-DEAD-5 | Dead type | `DashboardSnapshot (types.ts)` | 5m | Agent 18 |
| P3-DEAD-6 | Dead constant | `MAX_FILE_SIZE_BYTES (CSV)` | 5m | Agent 18 |
| P3-DEAD-7 | Dead constant | `CHUNK_SIZE (CSV)` | 5m | Agent 18 |
| P3-DEAD-8 | Unused npm dependency | `vite-bundle-visualizer` | 10m | Agent 19 |

### Silent Catches - Justified with Logging Needed (4 items, 40 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-LOG-1 | Silent catch (cosmetic - add logging) | `avatar.utils.ts:55-56` | 10m | Agent 13, 24 |
| P3-LOG-2 | Silent catch (cosmetic - add logging) | `avatar.utils.ts:85-87` | 10m | Agent 13, 24 |
| P3-LOG-3 | Silent catch (localStorage - add logging) | `filterPrecedence.ts:70-71` | 10m | Agent 13, 24 |
| P3-LOG-4 | Silent catch (localStorage - add logging) | `filterPrecedence.ts:191-193` | 10m | Agent 13, 24 |

### Deprecated Code (1 item, 4 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-DEP-1 | 24+ deprecated items marked for removal | Various | 4h | Agent 12 |

### Module Structure (3 items, 2 hours)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-MOD-1 | Missing file per module pattern | `ActivityShow.tsx` | 30m | Agent 10 |
| P3-MOD-2 | Incomplete module structure | `notes/` module | 1h | Agent 10 |
| P3-MOD-3 | React Admin Input bypass (2 instances) | Various | 30m | Agent 10 |

### Console Statements (1 item, 1 hour)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-CONSOLE-1 | 33 console statements (stripped in prod) | 22 production files | 1h | Agent 8, 20A-2 |

### State Complexity - Monitor (5 items)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-STATE-1 | 12 useState - state machine candidate | `OrganizationImportDialog.tsx` | 2h | Agent 9 |
| P3-STATE-2 | 6 useState (monitor only) | `ChangeLogTab.tsx` | - | Agent 9, 20A-2 |
| P3-STATE-3 | 6 useState (monitor only) | `ActivityTimelineFilters.tsx` | - | Agent 9, 20A-2 |
| P3-STATE-4 | 6 useState (monitor only) | `WorkflowManagementSection.tsx` | - | Agent 9, 20A-2 |
| P3-STATE-5 | 6 useState (monitor only) | `OpportunityListContent.tsx` | - | Agent 9, 20A-2 |

### UX - Minor Polish (1 item, 30 min)

| ID | Finding | Location | Effort | Source |
|----|---------|----------|--------|--------|
| P3-UX-1 | Missing useUnsavedChangesWarning | `ProductCreate.tsx` | 30m | Agent 21 |

### Additional Tech Debt (35 items, ~10 hours)

Various deprecated items, minor patterns documented in master findings F114-F156.

### P3 Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Dead Code | 8 | 1h |
| Logging (Justified Catches) | 4 | 40m |
| UX Polish | 1 | 30m |
| Deprecated Code | 1 | 4h |
| Module Structure | 3 | 2h |
| Console Statements | 1 | 1h |
| State Complexity | 5 | 2h |
| Misc Tech Debt | 35 | 10h |
| **Total P3** | **56** | **~20 hours** |

---

## Findings by Category

### By Feature Area

| Feature | P0 | P1 | P2 | P3 | Total | Top Issue |
|---------|----|----|----|----|-------|-----------|
| tasks | 0 | 12 | 2 | 0 | 14 | Silent catch blocks |
| opportunities | 0 | 5 | 8 | 5 | 18 | Large components |
| organizations | 0 | 4 | 6 | 3 | 13 | Import dialog size |
| contacts | 0 | 2 | 4 | 0 | 6 | Manager cycle protection |
| reports | 3 | 4 | 4 | 0 | 11 | perPage over-fetching |
| dashboard | 0 | 3 | 2 | 2 | 7 | React.memo missing |
| activities | 0 | 3 | 2 | 1 | 6 | Timeline performance |
| products | 0 | 2 | 2 | 1 | 5 | Silent catches |
| validation | 3 | 3 | 0 | 0 | 6 | .passthrough() usage |
| data-provider | 0 | 0 | 9 | 0 | 9 | Double assertions |
| shared-components | 0 | 8 | 5 | 6 | 19 | React.memo missing |
| imports | 0 | 0 | 4 | 2 | 6 | Large components |

### By Issue Type

| Type | P0 | P1 | P2 | P3 | Total | Avg Effort |
|------|----|----|----|----|-------|------------|
| Security | 3 | 1 | 0 | 0 | 4 | 30m |
| Performance | 3 | 23 | 0 | 0 | 26 | 10m |
| Error Handling | 0 | 8 | 8 | 4 | 20 | 15m |
| Constitution | 0 | 4 | 0 | 0 | 4 | 10m |
| Data Integrity | 0 | 2 | 4 | 0 | 6 | 1h |
| Type Safety | 0 | 3 | 9 | 0 | 12 | 30m |
| UX/Loading | 0 | 0 | 8 | 1 | 9 | 30m |
| Code Quality | 0 | 0 | 14 | 20 | 34 | 2h |
| Dead Code | 0 | 0 | 0 | 8 | 8 | 10m |
| Module Structure | 0 | 0 | 0 | 3 | 3 | 40m |

---

## Effort Analysis

### By Priority

| Priority | Items | Total Hours | Avg Hours/Item | Recommended Approach |
|----------|-------|-------------|----------------|---------------------|
| P0 | 6 | 1.5h | 15m | Single focused session |
| P1 | 46 | 12h | 16m | 2-3 day sprint |
| P2 | 48 | 40h | 50m | Spread across 2 weeks |
| P3 | 56 | 20h | 21m | Post-launch cleanup |
| **Total** | **156** | **73.5h** | **28m** | |

### By Skill Required

| Skill | Items | Hours | Team Member |
|-------|-------|-------|-------------|
| Zod/Validation | 9 | 2h | Any |
| React Performance | 18 | 3h | Frontend |
| Error Handling | 20 | 5h | Any |
| Database/Migrations | 3 | 3h | Backend |
| Component Refactoring | 13 | 30h | Senior Frontend |
| Race Conditions | 4 | 4h | Senior |
| Dead Code Removal | 8 | 1h | Any |

### Quick Wins (< 15 min each)

These 26 items can be fixed rapidly:

| Category | Count | Total Time |
|----------|-------|------------|
| P0 Security (.passthrough) | 3 | 45m |
| P0 Performance (perPage 10000) | 3 | 15m |
| P1 perPage: 1000 fixes | 5 | 25m |
| P1 React.memo additions | 15 | 2.5h |
| **Quick Win Total** | **26** | **~4 hours** |

---

## Recommended Fix Order

### Week 1 - Pre-Beta (Day 1-2)

| Day | Items | Hours | Focus |
|-----|-------|-------|-------|
| Day 1 AM | P0-SEC-1 to P0-SEC-3 | 45m | .passthrough() → strictObject |
| Day 1 AM | P0-PERF-1 to P0-PERF-3 | 15m | perPage: 10000 → 100 |
| Day 1 PM | P1-CONST-1 to P1-CONST-4 | 40m | Form mode="onBlur" |
| Day 2 AM | P1-ERR-1 to P1-ERR-8 | 2h | Task error handling |
| Day 2 PM | P1-DATA-1, P1-DATA-2 | 1.5h | Data integrity triggers |

### Week 1 - Pre-Beta (Day 3-5)

| Day | Items | Hours | Focus |
|-----|-------|-------|-------|
| Day 3 | P1-PERF-1 to P1-PERF-15 | 2.5h | React.memo |
| Day 4 AM | P1-PERF-16 to P1-PERF-23 | 1h | watch() and perPage |
| Day 4 PM | P1-VAL-1 to P1-VAL-3 | 45m | Internal validation |
| Day 5 | P1-SEC-1 | 2h | Security audit |

### Week 2 - Pre-Launch

| Focus | Hours | Items |
|-------|-------|-------|
| UX/Loading states | 7h | P2-UX-1 to P2-UX-8 |
| Race conditions | 4h | P2-ASYNC-1 to P2-ASYNC-4 |
| Silent catches | 2h | P2-ERR-1 to P2-ERR-8 |
| Type safety | 4.5h | P2-TYPE-1 to P2-TYPE-9 |

### Post-Launch Sprint 1

| Focus | Hours | Items |
|-------|-------|-------|
| Large component refactoring | 30h | P2-REFACTOR-1 to P2-REFACTOR-13 |
| Namespace imports review | 2h | P2-NS-1 |

### Post-Launch Backlog

| Focus | Hours | Items |
|-------|-------|-------|
| Dead code removal | 1h | P3-DEAD-* |
| Deprecated code | 4h | P3-DEP-1 |
| Console cleanup | 1h | P3-CONSOLE-1 |
| Logging additions | 40m | P3-LOG-* |

---

## Constitution Amendments Required

Based on audit findings, these principles need documentation:

| Gap | Severity | Recommended Amendment |
|-----|----------|----------------------|
| Accessibility Standards | Critical | Principle 15: WCAG 2.1 AA compliance required |
| Loading State Requirements | High | Principle 16: All mutations must show loading feedback |
| Performance Budgets | Medium | Principle 17: perPage ≤ 100, bundle < 500KB |
| Logging Standards | Medium | Principle 18: All catches must log or rethrow |
| Testing Requirements | Medium | Principle 19: Coverage thresholds per feature |
| Pre/Post Launch Rules | Low | Amendment: Launch phase behavior transitions |

---

## Good Patterns Identified (Preserve These)

| Pattern | Location | Rating |
|---------|----------|--------|
| Unified Data Provider | `unifiedDataProvider.ts` | ★★★★★ |
| Zod Boundary Validation | `validation/*.ts` | ★★★★★ |
| Semantic Colors | All components | ★★★★★ |
| Schema-Derived Defaults | Form components | ★★★★★ |
| AbortController Pattern | `BulkReassignButton.tsx` | ★★★★★ |
| Import Dialog State Machine | `ContactImportDialog.tsx` | ★★★★★ |
| Unsaved Changes Warning | `OpportunityCreateWizard.tsx` | ★★★★★ |
| RLS Two-Layer Security | Migrations | ★★★★★ |
| Organization Cycle Protection | Trigger | ★★★★★ |
| Soft Delete + RLS Filter | All tables | ★★★★★ |
| DOMPurify Sanitization | Rich text fields | ★★★★★ |
| TypeScript Strict Mode | `tsconfig.json` | ★★★★★ |
| Bundle Optimization | Build config | ★★★★★ |

---

## Handoff to 25C

Priority list complete. Ready for:
- **02-PATTERN-DOCUMENTATION.md** - Document good patterns and anti-patterns
- **03-RISK-ASSESSMENT.md** - Security and stability risk analysis
- **04-COMPLIANCE-SCORECARD.md** - Constitution compliance metrics
- **05-DEAD-CODE-REPORT.md** - Complete dead code inventory

---

*Prioritized by Agent 25B - Forensic Aggregator (Prioritization)*
*Generated: 2025-12-24*
*Source: 25A Master Findings (156 deduplicated, 7 conflicts resolved, 52 false negatives)*
