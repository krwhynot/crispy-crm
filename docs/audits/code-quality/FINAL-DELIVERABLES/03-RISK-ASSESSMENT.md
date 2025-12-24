# Risk Assessment

**Generated:** 2025-12-24
**Agent:** 25C - Forensic Aggregator (Patterns & Risks)
**Critical Risks:** 3
**High Risks:** 8
**Medium Risks:** 12
**Source:** P0/P1 findings from 25A Master Findings and 25B Prioritized Fix List

---

## Risk Matrix

|              | Low Impact | Medium Impact | High Impact |
|--------------|------------|---------------|-------------|
| **Likely**   | 4          | 5             | 3           |
| **Possible** | 6          | 4             | 5           |
| **Unlikely** | 8          | 3             | 0           |

**Risk Score Calculation:**
- Critical = Likely + High Impact
- High = (Possible + High Impact) OR (Likely + Medium Impact)
- Medium = (Possible + Medium Impact) OR (Likely + Low Impact)
- Low = Unlikely OR (Possible + Low Impact)

---

## Critical Risks (Likely + High Impact)

### RISK-001: Mass Assignment via .passthrough()
**Category:** Security
**Source:** Agent 2, 20B-2
**Related Findings:** P0-SEC-1, P0-SEC-2, P0-SEC-3

**Likelihood:** Likely
**Impact:** High
**Risk Score:** Critical

**Description:**
Three API boundary schemas use `.passthrough()` which allows arbitrary fields to be injected into database operations. An attacker could potentially modify fields not exposed in the UI (like `is_admin`, `role`, or internal flags).

**Current State:**
```typescript
// task.ts:92
export const taskSchema = z.object({...}).passthrough(); // VULNERABLE

// distributorAuthorizations.ts:149
export const authSchema = z.object({...}).passthrough(); // VULNERABLE

// activityDraftSchema.ts:21
export const draftSchema = z.object({...}).passthrough(); // VULNERABLE
```

**Evidence:**
- Agent 2 identified schema structure
- Agent 20B-2 confirmed these are at API boundaries
- All three schemas process user-submitted data

**Mitigation:**
1. Replace `.passthrough()` with explicit field definitions
2. Use `z.strictObject()` at all API boundaries
3. Add integration test for field injection attempts
4. Verify via grep: `grep -r "\.passthrough()" src/atomic-crm/validation/`

**Effort:** 45 minutes
**Owner:** Security/Backend
**Due:** Before beta release

---

### RISK-002: DoS via perPage: 10000
**Category:** Performance / Availability
**Source:** Agent 7, 20A-1
**Related Findings:** P0-PERF-1, P0-PERF-2, P0-PERF-3

**Likelihood:** Likely
**Impact:** High
**Risk Score:** Critical

**Description:**
Three locations fetch up to 10,000 records in a single query. This can cause:
- Memory exhaustion on client and server
- Database connection timeout
- Browser tab crash with large datasets
- Potential denial of service

**Current State:**
```typescript
// useReportData.ts:119
pagination: { perPage: 10000 }

// CampaignActivityReport.tsx:79
pagination: { perPage: 10000 }

// CampaignActivityReport.tsx:103
pagination: { perPage: 10000 }
```

**Evidence:**
- Agent 7 found single instance initially
- Agent 20A-1 discovered two additional locations in reports
- No server-side aggregation in place

**Attack Vector:**
An attacker could:
1. Create many opportunities/activities
2. Access report page
3. Force server to process/return 10,000 rows
4. Repeat to exhaust resources

**Mitigation:**
1. Reduce perPage to 100 immediately
2. Implement server-side aggregation for reports
3. Add pagination to report displays
4. Add rate limiting to report endpoints

**Effort:** 15 minutes (quick fix) + 4 hours (proper fix)
**Owner:** Backend
**Due:** Before beta release

---

### RISK-003: Silent Error Swallowing in Task Operations
**Category:** Data Integrity / User Experience
**Source:** Agent 13, 20A-2
**Related Findings:** P1-ERR-1 through P1-ERR-8

**Likelihood:** Likely
**Impact:** High
**Risk Score:** Critical

**Description:**
8 catch blocks in task-related components log errors but don't rethrow or notify users. Users may believe operations succeeded when they actually failed, leading to data inconsistency.

**Current State:**
```typescript
// TaskActionMenu.tsx:102, 117, 133
// TasksKanbanPanel.tsx:94, 233
// TaskKanbanCard.tsx:162, 288
// TaskCompleteSheet.tsx:211
catch (error) {
  console.error('Operation failed:', error);
  // Error disappears - user thinks operation succeeded
}
```

**Evidence:**
- Agent 13 found 27 catch blocks codebase-wide
- Agent 20A-2 found 17 additional in subdirectories (total 44)
- All 8 task-domain silent catches confirmed
- Task operations are core CRM functionality

**Impact Scenario:**
1. User marks task complete
2. Database operation fails (network, constraint)
3. Error logged to console
4. User sees no feedback, assumes success
5. Task remains incomplete
6. Follow-up never happens

**Mitigation:**
1. Add `throw error` after logging
2. Or use `notify('error', 'Task update failed')` and throw
3. Wrap all task operations in unified error handler
4. Add E2E test for error scenarios

**Effort:** 2 hours
**Owner:** Frontend
**Due:** Before beta release

---

## High Risks (Possible + High Impact OR Likely + Medium Impact)

### RISK-004: Constitution Violations - Form Mode
**Category:** Performance / Constitution Compliance
**Source:** Agent 3, 17, 20A-1, 20B-1
**Related Findings:** P1-CONST-1 through P1-CONST-4

**Likelihood:** Likely
**Impact:** Medium
**Risk Score:** High

**Description:**
4 form components lack `mode="onBlur"`, causing re-render on every keystroke. This violates the Engineering Constitution's form performance principle.

**Affected Files:**
- `OpportunityCreate.tsx:47`
- `OrganizationEdit.tsx:51`
- `TaskEdit.tsx:48`
- `AddTask.tsx:120`

**Current State:**
```tsx
// Missing mode="onBlur"
<SimpleForm>  // Validates on every keystroke
```

**Impact:**
- Poor form performance on slow devices (iPad field use)
- Inconsistent validation UX
- Constitution drift

**Mitigation:**
1. Add `mode="onBlur"` to all SimpleForm components
2. Add ESLint rule to enforce this pattern
3. Document in Constitution

**Effort:** 40 minutes
**Owner:** Frontend
**Due:** This sprint

---

### RISK-005: Contact Manager Self-Reference Cycle
**Category:** Data Integrity
**Source:** Agent 22
**Related Finding:** P1-DATA-1 (F019)

**Likelihood:** Possible
**Impact:** High
**Risk Score:** High

**Description:**
The `contacts.manager_id` field lacks a database trigger to prevent a contact from being their own manager. This could create infinite loops in management hierarchy queries.

**Current State:**
- No cycle detection trigger exists for contacts
- Organizations HAVE cycle protection (exemplary pattern)
- Contacts do not

**Attack/Bug Scenario:**
1. Admin accidentally sets contact.manager_id = contact.id
2. Queries traversing management hierarchy infinite loop
3. Database connection exhaustion
4. Application timeout

**Mitigation:**
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

CREATE TRIGGER prevent_contact_self_manager
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_manager_cycle();
```

**Effort:** 1 hour
**Owner:** Backend/Database
**Due:** This sprint

---

### RISK-006: Tasks Without Opportunity FK Constraint
**Category:** Data Integrity
**Source:** Agent 22
**Related Finding:** P1-DATA-2 (F020)

**Likelihood:** Possible
**Impact:** High
**Risk Score:** High

**Description:**
Tasks can reference non-existent opportunities via `opportunity_id`. No foreign key constraint prevents orphan tasks.

**Impact:**
- Orphaned tasks display broken links
- Reports may include invalid opportunity references
- Data cleanup required periodically

**Mitigation:**
```sql
ALTER TABLE tasks
ADD CONSTRAINT tasks_opportunity_id_fkey
FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
ON DELETE SET NULL;
```

**Effort:** 30 minutes
**Owner:** Backend/Database
**Due:** This sprint

---

### RISK-007: Missing React.memo on List Items
**Category:** Performance
**Source:** Agent 6, 20A-1, 20B-2
**Related Findings:** P1-PERF-1 through P1-PERF-15 (F024-F038)

**Likelihood:** Likely
**Impact:** Medium
**Risk Score:** High

**Description:**
15 components rendered in lists lack React.memo, causing unnecessary re-renders when parent state changes.

**Affected Components:**
| Component | File | Impact Area |
|-----------|------|-------------|
| KPICard (reports) | `reports/KPICard.tsx:19` | Report dashboard |
| KPICard (dashboard) | `dashboard/KPICard.tsx:98` | Main dashboard |
| PipelineTableRow | `PipelineTableRow.tsx:61` | Pipeline view |
| ActivityTypeCard | `ActivityTypeCard.tsx:36` | Activity summary |
| SuggestedOpportunityCard | `SuggestedOpportunityCard.tsx:15` | Quick actions |
| OpportunityCardActions | `OpportunityCardActions.tsx:21` | Opportunity list |
| OrganizationInfoCard | `OrganizationInfoCard.tsx:24` | Org details |
| ProductCard | `ProductCard.tsx:16` | Product list |
| OpportunityRowListView | `OpportunityRowListView.tsx:25` | List mode |
| KPISummaryRow | `KPISummaryRow.tsx:22` | Report rows |
| MetadataRow | `MetadataRow.tsx:8` | Detail views |
| TaskRelatedItemsTab | `TaskRelatedItemsTab.tsx:27` | Task details |
| ActivityTimelineEntry | `ActivityTimelineEntry.tsx` | Activity feed |
| AuthorizationCard | `AuthorizationCard.tsx` | Authorizations |
| ToggleFilterButton | `toggle-filter-button.tsx` | Filters |

**Impact:**
- Laggy scrolling on slow devices
- Battery drain on tablets (iPad field use)
- Poor perceived performance

**Mitigation:**
1. Wrap each component in `React.memo()`
2. Ensure parent callbacks use `useCallback`
3. Profile before/after in React DevTools

**Effort:** 2.5 hours
**Owner:** Frontend
**Due:** This sprint

---

### RISK-008: watch() Instead of useWatch()
**Category:** Performance
**Source:** Agent 6, 20A-1
**Related Findings:** P1-PERF-16, P1-PERF-17, P1-PERF-18 (F039-F041)

**Likelihood:** Likely
**Impact:** Medium
**Risk Score:** High

**Description:**
3 form components use `watch()` which re-renders the entire form tree on every change, instead of `useWatch()` which isolates re-renders.

**Affected Files:**
- `QuickCreatePopover.tsx:126`
- `QuickCreatePopover.tsx:150`
- `TagDialog.tsx:67`

**Current State:**
```tsx
const value = watch('fieldName'); // Re-renders entire form
```

**Correct Pattern:**
```tsx
const value = useWatch({ name: 'fieldName' }); // Isolated re-render
```

**Effort:** 45 minutes
**Owner:** Frontend
**Due:** This sprint

---

### RISK-009: perPage: 1000 Over-fetching
**Category:** Performance
**Source:** Agent 7, 20A-1
**Related Findings:** P1-PERF-19 through P1-PERF-23 (F042-F046)

**Likelihood:** Likely
**Impact:** Medium
**Risk Score:** High

**Description:**
5 additional locations use `perPage: 1000` which, while less severe than 10000, still poses performance and memory concerns.

**Affected Files:**
- `WeeklyActivitySummary.tsx:51`
- `WeeklyActivitySummary.tsx:62`
- `OpportunitiesByPrincipalReport.tsx:218`
- `useSimilarOpportunityCheck.ts:125`
- `OpportunityArchivedList.tsx:25`

**Mitigation:**
1. Reduce to perPage: 100
2. Implement virtual scrolling for large lists
3. Add server-side aggregation for reports

**Effort:** 25 minutes
**Owner:** Frontend
**Due:** This sprint

---

### RISK-010: Internal .passthrough() Usage
**Category:** Security (Lower severity)
**Source:** Agent 2, 20B-2
**Related Findings:** P1-VAL-1, P1-VAL-2, P1-VAL-3 (F047-F049)

**Likelihood:** Possible
**Impact:** Medium
**Risk Score:** High

**Description:**
3 internal schemas use `.passthrough()` for non-boundary validation. While less severe than API boundary violations, this represents pattern drift.

**Affected Files:**
- `useTutorialProgress.ts:35`
- `useFilterCleanup.ts:34`
- `opportunityStagePreferences.ts:22`

**Mitigation:**
1. Replace with explicit field definitions
2. Use `z.strictObject()` consistently
3. Add lint rule to catch `.passthrough()`

**Effort:** 45 minutes
**Owner:** Frontend
**Due:** Before launch

---

### RISK-011: SECURITY DEFINER Audit Gap
**Category:** Security
**Source:** Agent 4, 20A-1
**Related Finding:** P1-SEC-1 (F062)

**Likelihood:** Possible
**Impact:** High
**Risk Score:** High

**Description:**
The SECURITY DEFINER functions and views inventory is incomplete. These run with elevated privileges and need explicit auditing.

**Current State:**
- Some functions use SECURITY DEFINER
- No comprehensive inventory exists
- No periodic audit process

**Mitigation:**
1. Run: `SELECT proname, prosecdef FROM pg_proc WHERE prosecdef = true`
2. Document each function's purpose
3. Verify each needs SECURITY DEFINER
4. Add to security review checklist

**Effort:** 2 hours
**Owner:** Security/Database
**Due:** Before launch

---

## Medium Risks

| ID | Risk | Category | Likelihood | Impact | Mitigation |
|----|------|----------|------------|--------|------------|
| RISK-012 | Silent catches in non-task areas (8 files) | Error Handling | Possible | Medium | Add throw/notify |
| RISK-013 | Missing loading states on slide-over saves | UX | Likely | Low | Add isPending checks |
| RISK-014 | Race conditions on rapid filter changes | Data Integrity | Possible | Medium | Add AbortController |
| RISK-015 | Missing unsaved changes warning | UX | Likely | Low | Extend useInAppUnsavedChanges |
| RISK-016 | No optimistic locking for concurrent edits | Data Integrity | Possible | Medium | Add updated_at versioning |
| RISK-017 | Double type assertions in data provider | Type Safety | Unlikely | Medium | Refactor types |
| RISK-018 | localStorage without Zod validation | Type Safety | Possible | Low | Add schema validation |
| RISK-019 | Large components (500+ lines, 13 files) | Maintainability | Likely | Low | Refactor incrementally |
| RISK-020 | Namespace imports (31 files) | Bundle Size | Unlikely | Low | Review and convert |
| RISK-021 | .json() without Zod boundary (4 locations) | Type Safety | Possible | Medium | Add validation |
| RISK-022 | Race condition on debounced search | UX | Possible | Low | Add cancellation |
| RISK-023 | Dashboard stale data on principal switch | UX | Possible | Medium | Add query cancellation |

---

## Low Risks (Accepted)

These risks are acknowledged but not prioritized for immediate action:

| ID | Risk | Reason for Acceptance |
|----|------|----------------------|
| RISK-024 | Dead code (useNotifyWithRetry, etc.) | No runtime impact, cleanup post-launch |
| RISK-025 | Console statements (33 in 22 files) | Stripped in production build |
| RISK-026 | High useState count in import dialogs (12) | Localized to specific feature |
| RISK-027 | Missing module structure for notes | Low-usage feature |
| RISK-028 | Deprecated code markers (24+ items) | Tracked for removal |
| RISK-029 | Silent catches for cosmetic features | Avatar fallback intentional |
| RISK-030 | Unused npm dependency (vite-bundle-visualizer) | Dev dependency only |

---

## Risk Trends

### By Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 2 | 0 | 0 |
| Performance | 1 | 4 | 0 | 0 |
| Data Integrity | 1 | 2 | 2 | 0 |
| Error Handling | 0 | 0 | 1 | 0 |
| UX | 0 | 0 | 4 | 0 |
| Type Safety | 0 | 0 | 3 | 0 |
| Maintainability | 0 | 0 | 2 | 5 |
| **Total** | **3** | **8** | **12** | **5** |

### By Feature Area

| Feature | Critical | High | Medium |
|---------|----------|------|--------|
| Tasks | 1 | 0 | 1 |
| Reports | 1 | 1 | 0 |
| Validation | 1 | 2 | 0 |
| Forms | 0 | 2 | 2 |
| Contacts | 0 | 1 | 0 |
| Lists/Components | 0 | 2 | 2 |
| Database | 0 | 2 | 0 |
| Dashboard | 0 | 0 | 1 |

---

## Remediation Timeline

### Before Beta (Week 1, Days 1-2) — 4 hours total
| Risk ID | Fix | Effort | Priority |
|---------|-----|--------|----------|
| RISK-001 | .passthrough() → strictObject | 45m | P0 |
| RISK-002 | perPage: 10000 → 100 | 15m | P0 |
| RISK-003 | Task error handling | 2h | P0 |

### This Sprint (Week 1, Days 3-5) — 8 hours total
| Risk ID | Fix | Effort | Priority |
|---------|-----|--------|----------|
| RISK-004 | Form mode="onBlur" | 40m | P1 |
| RISK-005 | Contact manager trigger | 1h | P1 |
| RISK-006 | Task opportunity FK | 30m | P1 |
| RISK-007 | React.memo additions | 2.5h | P1 |
| RISK-008 | watch → useWatch | 45m | P1 |
| RISK-009 | perPage: 1000 → 100 | 25m | P1 |
| RISK-010 | Internal .passthrough | 45m | P1 |

### Before Launch (Week 2) — 12 hours total
| Risk ID | Fix | Effort | Priority |
|---------|-----|--------|----------|
| RISK-011 | SECURITY DEFINER audit | 2h | P1 |
| RISK-012 | Silent catches (others) | 2h | P2 |
| RISK-013 | Loading states | 3.5h | P2 |
| RISK-014 | Race conditions | 3h | P2 |
| RISK-016 | Optimistic locking | 4h | P2 |

---

## Verification Requirements

Before closing each risk, verify:

| Risk | Verification Command/Action |
|------|----------------------------|
| RISK-001 | `grep -r "\.passthrough()" src/atomic-crm/validation/` returns 0 |
| RISK-002 | `grep -r "perPage:\s*10000" src/` returns 0 |
| RISK-003 | All task catch blocks end with `throw error` |
| RISK-004 | All SimpleForm components have `mode="onBlur"` |
| RISK-005 | `SELECT * FROM pg_trigger WHERE tgname LIKE '%contact%manager%'` |
| RISK-006 | FK constraint exists in `\d tasks` output |
| RISK-007 | React DevTools shows memoized components |
| RISK-008 | No `watch()` calls in form components (use useWatch) |
| RISK-009 | `grep -r "perPage:\s*1000" src/` returns 0 |
| RISK-010 | `grep -r "\.passthrough()" src/atomic-crm/` returns 0 (except noted exceptions) |
| RISK-011 | Security audit document exists with all SECURITY DEFINER functions |

---

## Compliance & Monitoring

### GDPR/Data Privacy Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data encryption at rest | ✅ | Supabase default |
| Data encryption in transit | ✅ | HTTPS enforced |
| Right to deletion | ✅ | Soft delete + hard delete capability |
| Audit trail | ✅ | Activities table |
| Access controls | ✅ | RLS + Supabase Auth |

### Key Metrics to Track Post-Launch

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Dashboard load time | <2s | >3s |
| API response time (p95) | <500ms | >1s |
| Error rate | <1% | >5% |
| Bundle size increase | <5%/sprint | >10% |

---

## Handoff to 25D

Risk assessment complete. Next deliverables:
- **04-COMPLIANCE-SCORECARD.md** - Constitution compliance metrics
- **05-DEAD-CODE-REPORT.md** - Complete dead code inventory

---

*Risk assessment compiled by Agent 25C - Forensic Aggregator*
*Generated: 2025-12-24*
*Source: 25A Master Findings (156 items), 25B Prioritized Fix List*
