# Implementation Tasks: Reports Module

**Created:** 2025-11-05
**Total Estimate:** 4 days
**Dependencies:** Most tasks can run in parallel

---

## Task Breakdown

### Phase 1: Module Setup & Shared Components
**Estimate:** 4 hours
**Dependencies:** None
**Assignable to:** Any developer

#### Task 1.1: Create Module Directory Structure
- [ ] Create `src/atomic-crm/reports/` directory
- [ ] Create subdirectories:
  - `components/` (shared report components)
  - `hooks/` (data fetching hooks)
- [ ] Create `index.ts` for exports
- [ ] **Verification:** Directory structure exists

#### Task 1.2: Create Shared Components
- [ ] Create `components/ReportHeader.tsx`:
  - Title, description, export button
  - Loading state
  - Error state
- [ ] Create `components/ReportFilters.tsx`:
  - Generic filter UI (date range, multi-select)
  - Reset filters button
- [ ] Create `components/GroupedReportTable.tsx`:
  - Expandable/collapsible groups
  - Summary stats per group
  - Sortable columns
- [ ] **Verification:** Components render correctly in isolation

#### Task 1.3: Create Utility Hooks
- [ ] Create `hooks/useReportExport.ts`:
  - Leverage existing `useBulkExport` hook
  - Add report-specific formatting
  - Handle UTF-8 BOM encoding
- [ ] **Verification:** Hook exports CSV correctly

**Acceptance Criteria:**
- Module directory structure complete
- Shared components functional
- Utility hooks tested

---

### Phase 2: Opportunities by Principal Report ⭐
**Estimate:** 2 days
**Dependencies:** Task 1 complete
**Assignable to:** Frontend developer

#### Task 2.1: Create Data Fetching Hook
- [ ] Create `hooks/useOpportunitiesByPrincipal.ts`
- [ ] Fetch opportunities with filters:
  - Status, Stage, Date range, Account Manager, Principal
- [ ] Join with principals, organizations, sales tables
- [ ] Group by principal_id in frontend
- [ ] Calculate summary stats (total principals, total opportunities, active count)
- [ ] **Verification:** Hook returns correctly structured data

#### Task 2.2: Create Report Page Component
- [ ] Create `OpportunitiesByPrincipal.tsx`
- [ ] Use `<ReportHeader>` component
- [ ] Render filters:
  - Status (Active/Closed/On Hold) - default: Active
  - Stage (multi-select from 8 stages)
  - Date Range (Expected Close Date) - default: Next 90 days
  - Account Manager (multi-select)
  - Principal (multi-select)
- [ ] Display summary stats at top
- [ ] Use `<GroupedReportTable>` for grouped display
- [ ] **Verification:** Page renders with mock data

#### Task 2.3: Implement Grouping Logic
- [ ] Group opportunities by `principal_id`
- [ ] Sort groups by principal name (alphabetical)
- [ ] Calculate opportunity count per principal
- [ ] Expand/collapse functionality
- [ ] **Verification:** Grouping works correctly

#### Task 2.4: Add Table Columns
- [ ] Customer Organization (link to org view)
- [ ] Opportunity Name (link to opportunity view)
- [ ] Stage
- [ ] Status
- [ ] Expected Close Date
- [ ] Account Manager name
- [ ] Make columns sortable within each group
- [ ] **Verification:** All columns display correctly, links work

#### Task 2.5: Add CSV Export
- [ ] Export button in header
- [ ] Flatten grouped data to CSV rows
- [ ] Columns: `[Principal, Customer Org, Opportunity Name, Stage, Status, Expected Close, Account Manager]`
- [ ] Filename: `opportunities_by_principal_YYYY-MM-DD_HH-mm.csv`
- [ ] Respect current filters
- [ ] **Verification:** CSV exports correctly

#### Task 2.6: Add States & Error Handling
- [ ] Loading state: Skeleton groups
- [ ] Empty state: "No opportunities found. [Clear Filters]"
- [ ] Error state: "Failed to load. [Retry]"
- [ ] **Verification:** All states display correctly

**Acceptance Criteria:**
- Opportunities by Principal report fully functional
- Filters work correctly
- Grouping displays properly
- CSV export works
- All states handled

---

### Phase 3: Weekly Activity Summary Report
**Estimate:** 1.5 days
**Dependencies:** Task 1 complete (can run parallel with Task 2)
**Assignable to:** Frontend developer

#### Task 3.1: Create Data Fetching Hook
- [ ] Create `hooks/useWeeklyActivitySummary.ts`
- [ ] Fetch activities with filters:
  - Date range (default: current week Mon-Sun)
  - Account Manager
  - Activity Type
- [ ] Join with sales, contacts, opportunities, organizations tables
- [ ] Group by sales_id in frontend
- [ ] Count by activity_type per Account Manager
- [ ] Calculate summary stats (total activities, total users, average)
- [ ] **Verification:** Hook returns correctly structured data

#### Task 3.2: Create Report Page Component
- [ ] Create `WeeklyActivitySummary.tsx`
- [ ] Use `<ReportHeader>` component
- [ ] Render filters:
  - Date Range picker (default: Current week Mon-Sun)
  - Account Manager (multi-select)
  - Activity Type (multi-select: Call/Email/Meeting/Note)
- [ ] Display summary stats at top
- [ ] Use `<GroupedReportTable>` for grouped display
- [ ] **Verification:** Page renders with mock data

#### Task 3.3: Implement Grouping Logic
- [ ] Group activities by `sales_id` (Account Manager)
- [ ] Sort groups by Account Manager name (alphabetical)
- [ ] Calculate activity counts per user:
  - Calls, Emails, Meetings, Notes
- [ ] Display count breakdown in group header
- [ ] Expand/collapse functionality
- [ ] **Verification:** Grouping and counts correct

#### Task 3.4: Add Table Columns
- [ ] Date
- [ ] Activity Type (Call/Email/Meeting/Note)
- [ ] Description (truncate to 60 chars with "...")
- [ ] Related Entity (Contact/Opportunity/Organization name with link)
- [ ] Sort by date within each group (newest first)
- [ ] **Verification:** All columns display correctly, links work

#### Task 3.5: Add CSV Export
- [ ] Export button in header
- [ ] Flatten grouped data to CSV rows
- [ ] Columns: `[Account Manager, Date, Activity Type, Description, Related Entity]`
- [ ] Filename: `weekly_activity_summary_YYYY-MM-DD_HH-mm.csv`
- [ ] Respect current filters
- [ ] **Verification:** CSV exports correctly

#### Task 3.6: Add States & Error Handling
- [ ] Loading state: Skeleton groups
- [ ] Empty state: "No activities logged. [Change Week]"
- [ ] Error state: "Failed to load. [Retry]"
- [ ] **Verification:** All states display correctly

**Acceptance Criteria:**
- Weekly Activity Summary report fully functional
- Filters work correctly
- Grouping and counts display properly
- CSV export works
- All states handled

---

### Phase 4: Navigation & Routing
**Estimate:** 2 hours
**Dependencies:** Tasks 2 & 3 complete
**Assignable to:** Any developer

#### Task 4.1: Add Reports Menu to Navigation
- [ ] Open `src/atomic-crm/root/CRM.tsx`
- [ ] Add Reports menu item with icon (📊)
- [ ] Create nested menu:
  - "Opportunities by Principal"
  - "Weekly Activity Summary"
- [ ] **Verification:** Menu displays correctly

#### Task 4.2: Add Routes
- [ ] Add route: `/reports/opportunities-by-principal` → `<OpportunitiesByPrincipal />`
- [ ] Add route: `/reports/weekly-activity-summary` → `<WeeklyActivitySummary />`
- [ ] Test direct navigation to routes
- [ ] **Verification:** Both routes work

#### Task 4.3: Add Keyboard Shortcuts (Optional)
- [ ] `Shift+R` to open Reports menu
- [ ] **Verification:** Shortcut works

**Acceptance Criteria:**
- Reports menu item in navigation
- Both report routes functional
- Navigation works from menu

---

### Phase 5: Testing
**Estimate:** 1 day
**Dependencies:** All phases complete
**Assignable to:** QA or any developer

#### Task 5.1: Unit Tests
- [ ] Test `useOpportunitiesByPrincipal` hook
- [ ] Test `useWeeklyActivitySummary` hook
- [ ] Test shared components (ReportHeader, ReportFilters, GroupedReportTable)
- [ ] Test CSV export logic
- [ ] **Target:** 70% code coverage

#### Task 5.2: Integration Tests
- [ ] Test Opportunities by Principal report end-to-end
- [ ] Test Weekly Activity Summary report end-to-end
- [ ] Test filtering on both reports
- [ ] Test CSV export on both reports
- [ ] **Verification:** All workflows work end-to-end

#### Task 5.3: Manual Testing
- [ ] Test with 500+ opportunities
- [ ] Test with 1000+ activities
- [ ] Test performance (<1 second load time)
- [ ] Test with different user roles (RLS policies)
- [ ] Test empty states (no data)
- [ ] Test error states (network failures)
- [ ] **Verification:** No critical bugs, performance acceptable

**Acceptance Criteria:**
- 70% test coverage achieved
- All integration tests pass
- Manual testing finds no critical bugs
- Performance targets met

---

## Parallelization Strategy

**Can run in parallel:**
- After Phase 1 complete:
  - Phase 2 (Opportunities by Principal) **← Worktree 2**
  - Phase 3 (Weekly Activity Summary) **← Worktree 2 (or separate developer)**

**Must run sequentially:**
- Phase 1 → Phases 2 & 3
- Phases 2 & 3 → Phase 4
- Phase 4 → Phase 5

**Optimal approach:**
1. Complete Phase 1 (Setup) - **4 hours**
2. Run Phases 2 & 3 in parallel - **2 days** (longest is Opportunities by Principal at 2 days)
3. Complete Phase 4 (Navigation) - **2 hours**
4. Complete Phase 5 (Testing) - **1 day**

**Total: 3.5 days** with parallelization (vs 4.5 days sequential)

---

## Definition of Done

- [ ] All 5 phases complete
- [ ] All acceptance criteria met
- [ ] 70% test coverage achieved
- [ ] No critical bugs found in manual testing
- [ ] Performance <1 second for typical data volumes
- [ ] Code reviewed and approved
- [ ] Deployed to staging for QA testing

---

## Notes

**Why Reports is Faster Than Tasks:**
- No database migrations required
- Reuses existing CSV export infrastructure
- Only 2 pages vs 4 pages for Tasks
- No complex CRUD operations, just read-only queries

**Key Risks:**
- Performance with large datasets (>1000 opportunities or >2000 activities)
  - **Mitigation:** Test early with realistic data volumes
- Frontend grouping may be slow
  - **Mitigation:** Consider backend aggregation if needed

---

## Related Documentation

- **SRS:** `docs/planning/reports-module/SRS.md`
- **Data Model:** `docs/planning/reports-module/DATA-MODEL.md`
- **PRD:** `docs/prd/09-reports.md`
- **Export Hook:** `src/hooks/useBulkExport.tsx`
