# Sidebar Filter Test Report

**Date:** 2026-02-22
**Tester:** Claude Chrome Automation
**App URL:** http://localhost:5173
**Branch:** `refactor/list-architecture-unification`

## Summary

| Metric | Count |
|--------|-------|
| Pages tested | 7 |
| Total filters tested | 24 |
| PASS | 20 |
| FAIL | 2 |
| INCONCLUSIVE | 1 |
| PASS (no data) | 1 |
| Bugs found | 3 |

## Bugs Found

### BUG-1: `activities_summary.sample_status` column missing (CRITICAL)

- **Page:** Activities
- **Filters affected:** "Pending Feedback" quick filter, Sample Status dropdown (all options: Sent, Received, Feedback Pending, Feedback Received)
- **Error:** `column activities_summary.sample_status does not exist`
- **Impact:** Two sidebar filters completely non-functional. Any filter using `sample_status` returns 0 results with a database error toast.
- **Root cause:** The `activities_summary` SQL view does not include the `sample_status` column, but the filter sidebar references it.
- **Severity:** Critical - visible error toast shown to users.

### BUG-2: "Clear all" does not clear `$or`-based quick filters (Organizations)

- **Page:** Organizations
- **Filter affected:** "My Accounts" quick filter
- **Steps to reproduce:**
  1. Click "My Accounts" (2053 -> 341 results)
  2. Click sidebar "Clear all" button
  3. Filter remains active (still 341 results, button still green)
- **Expected:** All filters cleared, results return to 2053
- **Actual:** `$or`-based quick filter persists. Must click the toggle button itself to deactivate.
- **Severity:** Medium - workaround exists (click the button directly).

### BUG-3: "My Accounts" toggle visual state doesn't sync (Organizations)

- **Page:** Organizations
- **Filter affected:** "My Accounts" quick filter
- **Steps to reproduce:**
  1. Click "My Accounts" to activate (button turns green, 2053 -> 341)
  2. Click "My Accounts" again to deactivate (results return to 2053, URL shows `filter={}`)
  3. Button remains green/highlighted despite filter being inactive
- **Expected:** Button returns to default (non-highlighted) state
- **Actual:** Button stays green after toggling off, even though filter is cleared in URL and results.
- **Severity:** Low - cosmetic only, no functional impact.

## Detailed Results by Page

### 1. Organizations (Baseline: 2053 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Starred | Clicked toggle | 2053 | INCONCLUSIVE | No starred items in seed data; filter applied but count unchanged |
| My Accounts | Clicked toggle | 341 | PASS | BUG-2: "Clear all" doesn't clear this filter. BUG-3: Visual state doesn't sync on toggle off |
| Key Accounts | Clicked toggle | 797 | PASS | Shows priority A organizations |
| Recent Prospects | Clicked toggle | 0 | PASS | Filters prospect type + last 30 days |
| Organization Type > Customer | Selected "Customer" | 5 | PASS | |
| Category > Major Broadline | Selected "Major Broadline" | 60 | PASS | |
| State > Iowa | Selected "Iowa" | 19 | PASS | |
| Account Manager > Emily Rodriguez | Selected from dropdown | 338 | PASS | |

### 2. Contacts (Baseline: 1638 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Last Activity > This week | Selected "This week" | 1638 | PASS | All seed data has recent dates; filter applied correctly but count same |
| Tags > Decision Maker | Selected "Decision Maker" | 6 | PASS | |
| Account Manager > Sarah Chen | Selected from dropdown | 247 | PASS | |

### 3. Opportunities (Baseline: 80 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| High Priority | Clicked toggle | 38 | PASS | Filters high + critical priority |
| Stage > Feedback Logged | Selected "Feedback Logged" | 10 | PASS | |
| Priority > Low | Selected "Low" | 13 | PASS | |
| Principal > [RPT] Prairie Harvest Artisan | Selected from list | 0 | PASS | No opportunities for this principal |

### 4. Tasks (Baseline: 150 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Status > Completed | Selected "Completed" | 52 | PASS | |

### 5. Products (Baseline: 117 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Principal/Supplier > Better Balance Foods | Selected from list | 12 | PASS | All results show correct principal |

### 6. Activities (Baseline: 634 results)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Samples Only | Clicked quick filter | 26 | PASS | All results show "Sample" type |
| Pending Feedback | Clicked quick filter | 0 (error) | FAIL | BUG-1: `activities_summary.sample_status does not exist` |
| Activity Type > Call | Selected "Call" | 58 | PASS | All results show "Call" type |
| Sample Status > Sent | Selected "Sent" | 0 (error) | FAIL | BUG-1: Same column missing error |
| Sentiment > Positive | Selected "Positive" | 0 | PASS (no data) | Filter applied correctly, no matching seed data |
| Created By > Emily Rodriguez | Selected from dropdown | 98 | PASS | |

### 7. Sales (Baseline: 6 results, default "Active" filter)

| Filter | Action | Filtered Count | Result | Notes |
|--------|--------|---------------|--------|-------|
| Role > Admin | Selected "Admin" | 1 | PASS | Shows only Admin User |
| Status > Disabled Only | Clicked toggle | 0 | PASS | No disabled users in seed data; toggle works correctly |

## Filter Types Encountered

| Type | Examples | Working? |
|------|----------|----------|
| Toggle button (quick filter) | Starred, My Accounts, Key Accounts, Samples Only | Yes (with caveats on clear/visual state) |
| Checkbox list | Org Type, Category, State, Stage, Priority, Activity Type, Sample Status, Sentiment, Role | Yes (except sample_status) |
| Owner dropdown | Account Manager, Created By | Yes |
| Date range picker | Last Activity, Activity Date | Partially tested (Last Activity only) |
| Status toggle | Status (Sales), Status (Tasks) | Yes |

## Recommendations

1. **Fix `activities_summary` view** to include `sample_status` column - this blocks two filters entirely.
2. **Fix "Clear all" behavior** to also clear `$or`-based quick filters on Organizations.
3. **Fix toggle visual state** for "My Accounts" button to properly sync with filter state.
4. **Consider adding seed data** for starred items and positive-sentiment activities to improve testability.
