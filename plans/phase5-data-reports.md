# Phase 5: Data & Reports - Implementation Plan

**Phase:** 5 (Data & Reports)
**Status:** ⚠️ **40% COMPLETE** - CSV Import/Export done, Reports & Bulk Delete not started
**Timeline:** Week 9 (1 week sprint)
**Total Estimated Time:** 58-72 hours (split across team) → ~24h completed, ~35h remaining
**Created:** 2025-11-03
**Last Updated:** 2025-11-05 (Status verified via code review)
**Based on:** PRD Sections 3.7 (Reports), 3.11 (Data Import/Export)

**Completed Features:**
- ✅ CSV Export (contacts, organizations, opportunities) - export-button.tsx, useExportOpportunities
- ✅ CSV Import (contacts, organizations) - Full import dialogs with preview and logic

**Remaining Work (~35h):**
- ❌ Three Reports (Opportunities by Principal, Weekly Activity, Filtered Exports) - ~20h
- ❌ Bulk Delete with safety confirmations - ~10h
- ❌ Additional testing and polish - ~5h

---

## Executive Summary

Phase 5 implements essential data management and reporting capabilities:

**Core Deliverables:**
1. **Three Reports** (Opportunities by Principal, Weekly Activity, Filtered Exports)
2. **CSV Import** with flexible column mapping UI
3. **CSV Export** from all list views
4. **Bulk Delete** with safety confirmations
5. **Data Validation** and error handling

**Key Design Principles:**
- **Simple by Design:** CSV-only exports, no complex analytics
- **Democratic Access:** All users see all reports (no role restrictions)
- **Manual Generation:** No scheduling/automation in MVP
- **Principal Report Priority:** Most important feature (marked with ⭐)
- **Flexible Import:** Accept any CSV with intelligent column matching

**Success Criteria:**
- All three reports generate correct CSV outputs
- Column mapping UI handles common field name variations
- Bulk delete requires two-step confirmation
- Import handles validation errors gracefully
- Export respects current filters and search

---

## Prerequisites

### Required Before Starting
- [ ] Phase 4 (Opportunities Module) complete
- [ ] All list views have working filters and search
- [ ] Activity logging functional on opportunities/contacts
- [ ] Supabase views exist for aggregated data

### Environment Setup
```bash
# Verify dependencies
npm list papaparse react-dnd          # CSV parsing + drag-drop
npm list @tanstack/react-query         # Data fetching
npm run db:local:start                 # Local database running
npm test                               # Tests passing
```

### Technical Dependencies
- PapaParse (CSV parsing with encoding detection)
- React DnD (drag-drop for column mapping)
- React Admin bulk action framework
- Zod validation schemas (extend for import validation)

---

## Epic Breakdown

### Epic 1: CSV Export Infrastructure (E1)
**Confidence:** 95%
**Time:** 10-12 hours
**Priority:** High (foundation for all exports)

### Epic 2: Opportunities by Principal Report (E2) ⭐
**Confidence:** 92%
**Time:** 12-14 hours
**Priority:** CRITICAL (most important report)

### Epic 3: Weekly Activity Report (E3)
**Confidence:** 90%
**Time:** 8-10 hours
**Priority:** High

### Epic 4: CSV Import Infrastructure (E4)
**Confidence:** 70%
**Time:** 16-20 hours
**Priority:** High (complex UI/UX)

### Epic 5: Bulk Delete Operations (E5)
**Confidence:** 90%
**Time:** 6-8 hours
**Priority:** Medium

### Epic 6: Data Validation & Error Handling (E6)
**Confidence:** 85%
**Time:** 6-8 hours
**Priority:** High

---

## Detailed Task Breakdown

### Epic 1: CSV Export Infrastructure (E1)

#### P5-E1-S1: Export Utility Foundation

**P5-E1-S1-T1: Create CSV export utility module**
- **ID:** P5-E1-S1-T1
- **Confidence:** 95%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Create `src/atomic-crm/utils/csvExport.ts`
  - Implement `exportToCSV(data, filename, columns)` function
  - Handle UTF-8 encoding with BOM (Excel compatibility)
  - Generate filename: `{module}_{date}_{time}.csv`
  - Use PapaParse unparse for robust CSV generation
- **Acceptance Criteria:**
  - Exports array of objects to CSV file
  - Handles special characters (quotes, commas, newlines)
  - UTF-8 with BOM for Excel compatibility
  - Browser download triggered automatically
- **Validation Requirements:**
  - Test with data containing quotes, commas, newlines
  - Verify Excel can open exported files
  - Test empty data sets

**P5-E1-S1-T2: Add export button to list view toolbar**
- **ID:** P5-E1-S1-T2
- **Confidence:** 92%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E1-S1-T1
- **Description:**
  - Extend React Admin ListBase with export action
  - Add "Export to CSV" button to list toolbars
  - Respect current filters and search queries
  - Show export options modal (filtered vs all records)
  - Add loading spinner during export generation
- **Acceptance Criteria:**
  - Button appears in toolbar on all list views
  - Export respects active filters
  - User can choose filtered or all records
  - Loading indicator shown during export
- **Validation Requirements:**
  - Test with filtered data
  - Test with search query active
  - Test with large datasets (1000+ records)

**P5-E1-S1-T3: Implement filtered data export logic**
- **ID:** P5-E1-S1-T3
- **Confidence:** 88%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E1-S1-T2
- **Description:**
  - Extract current filter state from React Admin
  - Build Supabase query with filters applied
  - Fetch all matching records (handle pagination)
  - Map database fields to export columns
  - Generate CSV with proper column headers
- **Acceptance Criteria:**
  - Export matches visible list results
  - All pages of data included (not just current page)
  - Column headers are human-readable
  - Database field names mapped to display names
- **Validation Requirements:**
  - Export 5 filtered records, verify CSV matches UI
  - Test with multi-page results (50+ records)
  - Verify column mappings for all resource types

**P5-E1-S1-T4: Add export tests**
- **ID:** P5-E1-S1-T4
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E1-S1-T3
- **Description:**
  - Write unit tests for `exportToCSV` utility
  - Test special character handling
  - Test empty data sets
  - Test filename generation
  - Mock browser download in tests
- **Acceptance Criteria:**
  - Test coverage > 80% for csvExport.ts
  - Tests pass with edge cases
  - Tests verify UTF-8 with BOM
- **Validation Requirements:**
  - All tests pass
  - Coverage report shows > 80%

---

### Epic 2: Opportunities by Principal Report (E2) ⭐

#### P5-E2-S1: Report Data Layer

**P5-E2-S1-T1: Create Supabase view for principal-grouped opportunities**
- **ID:** P5-E2-S1-T1
- **Confidence:** 95%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Create migration: `20251103_add_opportunities_by_principal_view.sql`
  - Create view `opportunities_by_principal_view`:
    - Join opportunities → customer orgs → principal orgs
    - Include: principal name, customer org name, opp name, stage, status, expected_close, owner name
    - Order by principal name, then expected_close date
  - Grant SELECT to authenticated role
- **Acceptance Criteria:**
  - View returns all opportunities with principal data
  - NULL principal handled (show as "No Principal")
  - Owner name resolved from sales table
  - View respects RLS policies
- **Validation Requirements:**
  - Query view directly in Supabase SQL editor
  - Verify row count matches opportunities table
  - Test with opportunities missing principal

**P5-E2-S1-T2: Create report data provider endpoint**
- **ID:** P5-E2-S1-T2
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E2-S1-T1
- **Description:**
  - Add `getOpportunitiesByPrincipal(filters)` to data provider
  - Support filters: status, stage, date range, owner
  - Return grouped data structure:
    ```typescript
    {
      principal_id: string,
      principal_name: string,
      opportunity_count: number,
      active_count: number,
      closed_count: number,
      opportunities: Array<OpportunityDetail>
    }
    ```
  - Group and aggregate in TypeScript (not SQL) for flexibility
- **Acceptance Criteria:**
  - Returns opportunities grouped by principal
  - Counts calculated correctly (active vs closed)
  - Filters applied correctly
  - Type-safe return values
- **Validation Requirements:**
  - Test with no filters
  - Test with status filter
  - Test with date range filter

#### P5-E2-S2: Report UI Component

**P5-E2-S2-T1: Create report page component**
- **ID:** P5-E2-S2-T1
- **Confidence:** 88%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E2-S1-T2
- **Description:**
  - Create `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`
  - Register route in CRM.tsx: `/reports/opportunities-by-principal`
  - Add to navigation menu: "Reports" dropdown
  - Display grouped list view:
    - Principal name as section header
    - Opportunity count badge (active/closed)
    - Nested table of opportunities
  - Use React Admin components (Datagrid, etc.)
- **Acceptance Criteria:**
  - Route accessible from Reports menu
  - Grouped by principal with counts
  - Nested opportunity table displays all fields
  - Loading state shown during fetch
- **Validation Requirements:**
  - Navigate to report page
  - Verify grouping matches data provider
  - Test with 5+ principals

**P5-E2-S2-T2: Add report filter controls**
- **ID:** P5-E2-S2-T2
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E2-S2-T1
- **Description:**
  - Add filter toolbar with:
    - Status dropdown (Active, Closed, On Hold)
    - Stage multi-select (all 8 stages)
    - Date range picker (Expected Close Date)
    - Owner multi-select
  - Filters apply on change (debounced)
  - Show active filter count badge
  - "Clear Filters" button
- **Acceptance Criteria:**
  - All filter controls functional
  - Report updates when filters change
  - Active filters visible to user
  - Clear filters resets all controls
- **Validation Requirements:**
  - Apply each filter type individually
  - Apply multiple filters together
  - Clear filters and verify reset

**P5-E2-S2-T3: Add report sort options**
- **ID:** P5-E2-S2-T3
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E2-S2-T1
- **Description:**
  - Add sort dropdown:
    - By Principal Name (A-Z)
    - By Opportunity Count (Most to Least)
    - By Expected Close Date (Soonest First)
  - Sort applied to grouped data
  - Sort persists across filter changes
- **Acceptance Criteria:**
  - Three sort options available
  - Sort applied correctly to groups
  - Sort indicator visible in UI
- **Validation Requirements:**
  - Test each sort option
  - Verify sort order with 10+ principals

**P5-E2-S2-T4: Implement report CSV export**
- **ID:** P5-E2-S2-T4
- **Confidence:** 92%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E2-S2-T1, P5-E1-S1-T3
- **Description:**
  - Add "Export to CSV" button to report toolbar
  - Flatten grouped data for CSV:
    - Columns: [Principal, Customer Org, Opportunity Name, Stage, Status, Expected Close, Owner]
  - Respect current filters
  - Filename: `opportunities_by_principal_{date}.csv`
- **Acceptance Criteria:**
  - Export button in toolbar
  - CSV includes all filtered opportunities
  - Columns match specification
  - Grouped data flattened correctly
- **Validation Requirements:**
  - Export with no filters
  - Export with filters applied
  - Verify CSV structure matches spec

---

### Epic 3: Weekly Activity Report (E3)

#### P5-E3-S1: Activity Report Data Layer

**P5-E3-S1-T1: Create activity summary view**
- **ID:** P5-E3-S1-T1
- **Confidence:** 92%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Create migration: `20251103_add_weekly_activity_view.sql`
  - Create view `weekly_activity_summary`:
    - Join activities → sales (owner) → related entities
    - Include: user name, date, activity type, description, related entity
    - Add activity_type counts per user
  - Grant SELECT to authenticated role
- **Acceptance Criteria:**
  - View returns all activities with user data
  - Related entity resolved (contact/org/opportunity name)
  - Counts aggregated by type per user
  - Date range filterable
- **Validation Requirements:**
  - Query view with date filter
  - Verify counts match activities table

**P5-E3-S1-T2: Create activity report data provider**
- **ID:** P5-E3-S1-T2
- **Confidence:** 88%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E3-S1-T1
- **Description:**
  - Add `getWeeklyActivitySummary(filters)` to data provider
  - Support filters: date range (default: current week), user, activity type
  - Return grouped structure:
    ```typescript
    {
      user_id: string,
      user_name: string,
      total_activities: number,
      breakdown: { calls: number, emails: number, meetings: number, notes: number },
      activities: Array<ActivityDetail>
    }
    ```
  - Current week = Monday 00:00 to Sunday 23:59
- **Acceptance Criteria:**
  - Returns activities grouped by user
  - Breakdown counts calculated correctly
  - Default to current week (Mon-Sun)
  - Type-safe return values
- **Validation Requirements:**
  - Test with current week
  - Test with custom date range
  - Verify breakdown counts

#### P5-E3-S2: Activity Report UI

**P5-E3-S2-T1: Create weekly activity report page**
- **ID:** P5-E3-S2-T1
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E3-S1-T2
- **Description:**
  - Create `src/atomic-crm/reports/WeeklyActivityReport.tsx`
  - Register route: `/reports/weekly-activity`
  - Display grouped by user:
    - User name as section header
    - Activity breakdown badges (calls: 8, emails: 5, etc.)
    - Nested table of activities
  - Sort by date (newest first) within each user
- **Acceptance Criteria:**
  - Route accessible from Reports menu
  - Grouped by user with breakdowns
  - Activities sorted by date
  - Related entity links work
- **Validation Requirements:**
  - View report with 3+ users
  - Verify breakdown counts
  - Click related entity links

**P5-E3-S2-T2: Add date range picker**
- **ID:** P5-E3-S2-T2
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E3-S2-T1
- **Description:**
  - Add date range picker to toolbar
  - Default to current week (Mon-Sun)
  - Quick selects: This Week, Last Week, This Month, Custom Range
  - Display selected range in header: "Nov 29 - Dec 5, 2025"
- **Acceptance Criteria:**
  - Date picker functional
  - Defaults to current week
  - Quick selects work
  - Custom range input works
- **Validation Requirements:**
  - Test each quick select option
  - Test custom range
  - Verify data updates on change

**P5-E3-S2-T3: Add activity report CSV export**
- **ID:** P5-E3-S2-T3
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** P5-E3-S2-T1, P5-E1-S1-T3
- **Description:**
  - Add "Export to CSV" button
  - Flatten grouped data:
    - Columns: [User, Date, Activity Type, Description, Related Entity]
  - Filename: `weekly_activity_{start_date}_{end_date}.csv`
- **Acceptance Criteria:**
  - Export includes all activities in date range
  - Columns match specification
  - Description truncated if > 100 chars
- **Validation Requirements:**
  - Export for current week
  - Verify CSV structure

---

### Epic 4: CSV Import Infrastructure (E4)

#### P5-E4-S1: Import Foundation (SPIKE)

**P5-E4-S1-T1: SPIKE - Research column mapping UI/UX patterns**
- **ID:** P5-E4-S1-T1
- **Confidence:** 60%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Research column mapping UX patterns (Salesforce, HubSpot, etc.)
  - Evaluate approaches:
    - Drag-and-drop (React DnD)
    - Dropdown selection per column
    - Two-column side-by-side mapping
  - Create design mockup in Figma/Excalidraw
  - Document pros/cons of each approach
  - Recommend approach for implementation
- **Acceptance Criteria:**
  - 3+ competitor products researched
  - Mockup created with recommended approach
  - Pros/cons documented
  - Decision documented with rationale
- **Deliverable:** `docs/spikes/column-mapping-ux.md`

**P5-E4-S1-T2: SPIKE - CSV parsing with encoding detection**
- **ID:** P5-E4-S1-T2
- **Confidence:** 70%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Test PapaParse encoding detection (UTF-8, UTF-16, ASCII)
  - Test with sample CSVs (Excel exports, Google Sheets, etc.)
  - Document edge cases:
    - BOM handling
    - Mixed encoding
    - Special characters (emoji, accented chars)
  - Verify max file size handling (10MB limit)
  - Test performance with large files (5000+ rows)
- **Acceptance Criteria:**
  - PapaParse handles UTF-8, UTF-16, ASCII
  - BOM detected and removed
  - Large file performance acceptable (< 2s for 5000 rows)
  - Edge cases documented
- **Deliverable:** `docs/spikes/csv-encoding-detection.md`

**P5-E4-S1-T3: SPIKE - Intelligent field matching algorithm**
- **ID:** P5-E4-S1-T3
- **Confidence:** 60%
- **Estimate:** 3 hours
- **Prerequisites:** None
- **Description:**
  - Design algorithm for auto-matching CSV columns to CRM fields
  - Rules to implement:
    - Exact match (case-insensitive)
    - Common aliases ("Company" → "Organization Name")
    - Fuzzy matching (Levenshtein distance)
    - Position-based hints (email in column 3 likely "Email")
  - Handle ambiguous cases (multiple emails, multiple phones)
  - Document confidence scoring (exact = 100%, alias = 90%, fuzzy = 70%)
  - Create test cases with expected matches
- **Acceptance Criteria:**
  - Algorithm handles common column name variations
  - Confidence score assigned to each match
  - Ambiguous cases flagged for manual review
  - Test cases documented
- **Deliverable:** `docs/spikes/field-matching-algorithm.md`

#### P5-E4-S2: Import File Upload

**P5-E4-S2-T1: Create import dialog component**
- **ID:** P5-E4-S2-T1
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E4-S1-T1 (SPIKE complete)
- **Description:**
  - Create `src/atomic-crm/common/ImportDialog.tsx`
  - Add "Import" button to list view toolbars
  - Multi-step wizard:
    - Step 1: File Upload
    - Step 2: Column Mapping
    - Step 3: Data Preview & Validation
    - Step 4: Import Execution
  - Use React Admin Dialog components
  - Track wizard state in component
- **Acceptance Criteria:**
  - Dialog opens from list view
  - Wizard steps navigable (Next/Back buttons)
  - Current step highlighted
  - Close dialog with confirmation if in progress
- **Validation Requirements:**
  - Navigate through all steps
  - Back button works correctly
  - Close with confirmation prompt

**P5-E4-S2-T2: Implement file upload UI**
- **ID:** P5-E4-S2-T2
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S2-T1
- **Description:**
  - Drag-and-drop file upload zone
  - File picker button as alternative
  - Accept .csv and .txt files only
  - Max file size: 10MB (client-side check)
  - Show file info: name, size, last modified
  - Parse file on upload (PapaParse)
  - Show preview of first 5 rows
- **Acceptance Criteria:**
  - Drag-and-drop works
  - File picker works
  - Rejects non-CSV files
  - Rejects files > 10MB
  - Preview shows sample data
- **Validation Requirements:**
  - Test drag-and-drop
  - Test file picker
  - Test 11MB file rejection
  - Test .xlsx file rejection

**P5-E4-S2-T3: Implement encoding detection**
- **ID:** P5-E4-S2-T3
- **Confidence:** 75%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S1-T2 (SPIKE), P5-E4-S2-T2
- **Description:**
  - Auto-detect file encoding (UTF-8, UTF-16, ASCII)
  - Strip BOM if present
  - Show detected encoding in UI
  - Allow manual encoding selection if auto-detect fails
  - Re-parse file if encoding changed manually
- **Acceptance Criteria:**
  - UTF-8 files parsed correctly
  - UTF-16 files parsed correctly
  - BOM removed automatically
  - Manual encoding selection works
- **Validation Requirements:**
  - Test UTF-8 with BOM
  - Test UTF-16 file
  - Test manual encoding override

#### P5-E4-S3: Column Mapping UI

**P5-E4-S3-T1: Implement intelligent auto-matching**
- **ID:** P5-E4-S3-T1
- **Confidence:** 70%
- **Estimate:** 4 hours
- **Prerequisites:** P5-E4-S1-T3 (SPIKE)
- **Description:**
  - Create `src/atomic-crm/utils/fieldMatcher.ts`
  - Implement auto-match algorithm:
    - Exact match (case-insensitive)
    - Common aliases from `columnAliases.ts`
    - Fuzzy matching (Levenshtein distance < 3)
  - Assign confidence score to each match
  - Flag low-confidence matches (< 70%) for review
  - Handle ambiguous cases (show dropdown with options)
- **Acceptance Criteria:**
  - Auto-matches common column names
  - Confidence scores assigned correctly
  - Low-confidence matches flagged
  - Ambiguous cases show options
- **Validation Requirements:**
  - Test with exact matches
  - Test with aliases ("Company" → "Organization Name")
  - Test with typos ("Emial" → "Email")

**P5-E4-S3-T2: Create column mapping component**
- **ID:** P5-E4-S3-T2
- **Confidence:** 65%
- **Estimate:** 5 hours
- **Prerequisites:** P5-E4-S3-T1, P5-E4-S1-T1 (SPIKE)
- **Description:**
  - Create two-column mapping interface:
    - Left: CSV columns with sample data (first 3 rows)
    - Right: CRM fields grouped by category (Basic Info, Contact Info, etc.)
  - Implement drag-and-drop or dropdown mapping
  - Show auto-matched fields with confidence badge
  - Highlight required fields (red border until mapped)
  - "Ignore Column" option for unmapped CSV columns
  - Show mapping summary: "5 of 8 required fields mapped"
- **Acceptance Criteria:**
  - Two-column interface displays correctly
  - Sample data shows first 3 rows
  - Drag-and-drop or dropdown mapping works
  - Required fields highlighted
  - Mapping summary accurate
- **Validation Requirements:**
  - Map 8 CSV columns to CRM fields
  - Ignore 2 columns
  - Verify required fields enforced

**P5-E4-S3-T3: Add column mapping validation**
- **ID:** P5-E4-S3-T3
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S3-T2
- **Description:**
  - Validate all required fields mapped
  - Warn if multiple CSV columns map to same CRM field
  - Show error if required field unmapped
  - "Next" button disabled until valid
  - Display validation errors inline
- **Acceptance Criteria:**
  - Required fields enforced
  - Duplicate mapping warning shown
  - Next button disabled until valid
  - Errors displayed clearly
- **Validation Requirements:**
  - Try to proceed with unmapped required field
  - Map two columns to same field
  - Verify validation messages

#### P5-E4-S4: Data Preview & Validation

**P5-E4-S4-T1: Implement data preview table**
- **ID:** P5-E4-S4-T1
- **Confidence:** 88%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S3-T3
- **Description:**
  - Show first 10 rows of mapped data
  - Display in table with CRM field headers
  - Highlight validation errors in red
  - Show error tooltip on hover
  - Display validation summary: "8 of 10 rows valid, 2 errors"
- **Acceptance Criteria:**
  - Preview shows 10 rows
  - Errors highlighted in red
  - Error tooltips informative
  - Summary counts correct
- **Validation Requirements:**
  - Preview data with validation errors
  - Hover over error cells
  - Verify summary counts

**P5-E4-S4-T2: Implement row-level validation**
- **ID:** P5-E4-S4-T2
- **Confidence:** 80%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E4-S4-T1
- **Description:**
  - Validate each row against Zod schema
  - Check for:
    - Missing required fields
    - Invalid email/phone formats
    - Invalid enum values (stage, status, etc.)
    - Duplicate records (by name + email)
  - Assign validation status: valid, warning, error
  - Group errors by type for summary
- **Acceptance Criteria:**
  - All validation rules enforced
  - Errors categorized correctly
  - Duplicate detection works
  - Warnings vs errors distinguished
- **Validation Requirements:**
  - Import data with missing required fields
  - Import data with invalid email
  - Import duplicate records

**P5-E4-S4-T3: Add error handling options**
- **ID:** P5-E4-S4-T3
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S4-T2
- **Description:**
  - Add options per validation error:
    - Skip row (exclude from import)
    - Set default value (for missing optional fields)
    - Fix and retry (inline editing)
  - Global options:
    - Skip all invalid rows
    - Stop on first error
    - Continue on error
  - Update preview when errors fixed
- **Acceptance Criteria:**
  - All error handling options work
  - Global options apply correctly
  - Preview updates after fixes
  - Error count updates in real-time
- **Validation Requirements:**
  - Skip an invalid row
  - Set default value for missing field
  - Fix error inline and verify update

#### P5-E4-S5: Import Execution

**P5-E4-S5-T1: Implement batch import logic**
- **ID:** P5-E4-S5-T1
- **Confidence:** 82%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E4-S4-T3
- **Description:**
  - Import records in batches (50 records per batch)
  - Use data provider's bulk create method
  - Handle errors per batch (continue or stop based on user choice)
  - Track progress: current row, total rows, error count
  - Generate error report for failed rows
- **Acceptance Criteria:**
  - Imports in batches of 50
  - Progress tracked accurately
  - Errors logged per row
  - Error report generated
- **Validation Requirements:**
  - Import 100 valid records
  - Import 100 records with 5 errors
  - Verify progress updates

**P5-E4-S5-T2: Add import progress UI**
- **ID:** P5-E4-S5-T2
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S5-T1
- **Description:**
  - Show progress bar with percentage
  - Display current status: "Importing row 45 of 250..."
  - Real-time error log (last 10 errors visible)
  - Show elapsed time and estimated time remaining
  - Cancel button (stops import mid-process)
- **Acceptance Criteria:**
  - Progress bar updates smoothly
  - Status text updates per row
  - Error log shows recent errors
  - Cancel button works
- **Validation Requirements:**
  - Start import and watch progress
  - Cancel mid-import
  - Verify error log updates

**P5-E4-S5-T3: Add import summary screen**
- **ID:** P5-E4-S5-T3
- **Confidence:** 92%
- **Estimate:** 2 hours
- **Prerequisites:** P5-E4-S5-T2
- **Description:**
  - Show import results:
    - "Imported 245 of 250 records"
    - "5 errors. [Download Error Report]"
  - Error report as CSV with:
    - Row number, field name, error message, original value
  - Success message with link to list view
  - "Import Another File" button
- **Acceptance Criteria:**
  - Summary shows correct counts
  - Error report downloadable
  - Error report contains all failed rows
  - Navigation buttons work
- **Validation Requirements:**
  - Complete import with errors
  - Download error report
  - Verify error report contents

---

### Epic 5: Bulk Delete Operations (E5)

#### P5-E5-S1: Bulk Delete UI

**P5-E5-S1-T1: Add bulk selection checkboxes**
- **ID:** P5-E5-S1-T1
- **Confidence:** 92%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Add checkboxes to all list views (React Admin BulkActionsToolbar)
  - "Select All" checkbox in header
  - Display selected count: "3 selected"
  - Clear selection button
  - Selection persists across page changes
- **Acceptance Criteria:**
  - Checkboxes appear in all list views
  - Select all works (current page only)
  - Selection count accurate
  - Clear selection works
- **Validation Requirements:**
  - Select 5 records
  - Select all on current page
  - Clear selection

**P5-E5-S1-T2: Implement two-step delete confirmation**
- **ID:** P5-E5-S1-T2
- **Confidence:** 88%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E5-S1-T1
- **Description:**
  - Add "Delete Selected" button to bulk actions toolbar
  - Step 1: Confirmation dialog
    - "Delete 12 selected items?"
    - "This cannot be undone."
    - Cancel / Delete buttons
  - Step 2: Type-to-confirm dialog
    - "Type DELETE to confirm"
    - Text input (must match exactly)
    - Submit disabled until "DELETE" typed
  - Show success toast after deletion
- **Acceptance Criteria:**
  - Two-step confirmation required
  - Must type "DELETE" exactly
  - Toast shows deletion count
  - List refreshes after delete
- **Validation Requirements:**
  - Attempt delete without typing DELETE
  - Complete full delete flow
  - Verify records deleted

**P5-E5-S1-T3: Add bulk delete tests**
- **ID:** P5-E5-S1-T3
- **Confidence:** 85%
- **Estimate:** 1 hour
- **Prerequisites:** P5-E5-S1-T2
- **Description:**
  - Write integration tests for bulk delete
  - Test selection behavior
  - Test confirmation flow
  - Test deletion execution
  - Mock data provider delete method
- **Acceptance Criteria:**
  - Tests cover selection and deletion
  - Confirmation flow tested
  - Mock verifies correct IDs passed
- **Validation Requirements:**
  - All tests pass

---

### Epic 6: Data Validation & Error Handling (E6)

#### P5-E6-S1: Import Validation

**P5-E6-S1-T1: Extend Zod schemas for import validation**
- **ID:** P5-E6-S1-T1
- **Confidence:** 88%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Description:**
  - Create import-specific Zod schemas in `src/atomic-crm/validation/imports.ts`
  - Add schemas for: organizations, contacts, opportunities, products
  - Include additional validations:
    - Duplicate detection (name + email)
    - Related entity lookups (organization exists)
    - Enum value validation
  - Provide detailed error messages
- **Acceptance Criteria:**
  - Schemas validate import data
  - Error messages user-friendly
  - Duplicate detection works
  - Related entity lookups work
- **Validation Requirements:**
  - Validate contact with invalid email
  - Validate duplicate contact
  - Validate contact with non-existent organization

**P5-E6-S1-T2: Implement duplicate detection**
- **ID:** P5-E6-S1-T2
- **Confidence:** 82%
- **Estimate:** 3 hours
- **Prerequisites:** P5-E6-S1-T1
- **Description:**
  - Check for duplicates during import preview
  - Rules by resource:
    - Contacts: first_name + last_name + email
    - Organizations: name (case-insensitive)
    - Products: name (case-insensitive)
  - Query existing records for matches
  - Flag duplicates as warnings (not errors)
  - Allow user to choose: skip, update, or import as new
- **Acceptance Criteria:**
  - Duplicates detected correctly
  - Warnings shown in preview
  - User can choose action per duplicate
  - Update existing record option works
- **Validation Requirements:**
  - Import contact that already exists
  - Choose "Skip" option
  - Choose "Update" option

**P5-E6-S1-T3: Add validation error reporting**
- **ID:** P5-E6-S1-T3
- **Confidence:** 90%
- **Estimate:** 1 hour
- **Prerequisites:** P5-E6-S1-T1
- **Description:**
  - Generate detailed error report for validation failures
  - Include: row number, column name, error type, original value
  - Group errors by type (missing field, invalid format, etc.)
  - Show error distribution chart (optional: simple bar chart)
- **Acceptance Criteria:**
  - Error report downloadable as CSV
  - All validation errors included
  - Errors grouped by type
  - Report human-readable
- **Validation Requirements:**
  - Import data with 10 validation errors
  - Download error report
  - Verify all errors present

#### P5-E6-S2: Export Validation

**P5-E6-S2-T1: Add export data validation**
- **ID:** P5-E6-S2-T1
- **Confidence:** 90%
- **Estimate:** 1 hour
- **Prerequisites:** P5-E1-S1-T3
- **Description:**
  - Validate data before export
  - Check for null/undefined values (replace with empty string)
  - Handle special characters in CSV
  - Verify column count matches headers
  - Log warnings for data issues (don't block export)
- **Acceptance Criteria:**
  - Export handles null values
  - Special characters escaped
  - Column count validated
  - Warnings logged but don't block
- **Validation Requirements:**
  - Export data with null values
  - Export data with special characters
  - Verify CSV valid

**P5-E6-S2-T2: Add export error handling**
- **ID:** P5-E6-S2-T2
- **Confidence:** 92%
- **Estimate:** 1 hour
- **Prerequisites:** P5-E6-S2-T1
- **Description:**
  - Show error toast if export fails
  - Handle edge cases:
    - No data to export
    - Export too large (> 100,000 rows)
    - Browser blocks download
  - Provide fallback: show CSV in modal for copy/paste
- **Acceptance Criteria:**
  - Error messages shown for failures
  - Empty data handled gracefully
  - Large exports show warning
  - Fallback modal works
- **Validation Requirements:**
  - Export empty list
  - Export 50,000 rows (if possible)
  - Test fallback modal

---

## Testing Strategy

### Unit Tests
- **Coverage Target:** 75% minimum
- **Focus Areas:**
  - CSV export utility (`csvExport.ts`)
  - Field matching algorithm (`fieldMatcher.ts`)
  - CSV processor (`csvProcessor.ts`)
  - Validation schemas (`imports.ts`)

### Integration Tests
- **Import Flow:** File upload → Column mapping → Preview → Import
- **Export Flow:** Apply filters → Export → Verify CSV
- **Bulk Delete:** Select records → Confirm → Verify deletion
- **Reports:** Generate report → Apply filters → Export CSV

### E2E Tests (Playwright)
- **Report Generation:** Navigate to report → Apply filters → Export CSV
- **CSV Import:** Upload file → Map columns → Import → Verify records created
- **Bulk Delete:** Select 10 records → Delete → Verify removed from list

### Manual Testing Checklist
- [ ] Export 1000+ records, verify performance
- [ ] Import CSV with various encodings (UTF-8, UTF-16)
- [ ] Test column mapping with misspelled headers
- [ ] Bulk delete 50+ records, verify confirmation flow
- [ ] Generate all three reports with filters applied
- [ ] Test import error handling (invalid data, duplicates)

---

## Migration Tasks

### Database Migrations

**P5-M1: Create opportunities_by_principal view**
```sql
-- File: supabase/migrations/20251103000001_add_opportunities_by_principal_view.sql
CREATE OR REPLACE VIEW opportunities_by_principal_view AS
SELECT
  po.id AS principal_id,
  po.name AS principal_name,
  co.id AS customer_org_id,
  co.name AS customer_org_name,
  o.id AS opportunity_id,
  o.name AS opportunity_name,
  o.stage,
  o.status,
  o.expected_close_date,
  s.full_name AS owner_name
FROM opportunities o
LEFT JOIN organizations co ON o.customer_organization_id = co.id
LEFT JOIN organizations po ON co.parent_organization_id = po.id
LEFT JOIN sales s ON o.owner_id = s.id
WHERE o.status != 'deleted';

GRANT SELECT ON opportunities_by_principal_view TO authenticated;
```

**P5-M2: Create weekly_activity_summary view**
```sql
-- File: supabase/migrations/20251103000002_add_weekly_activity_view.sql
CREATE OR REPLACE VIEW weekly_activity_summary AS
SELECT
  a.id AS activity_id,
  a.created_at,
  a.activity_type,
  a.description,
  s.id AS user_id,
  s.full_name AS user_name,
  COALESCE(c.name, o.name, op.name) AS related_entity_name
FROM activities a
LEFT JOIN sales s ON a.created_by_id = s.id
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN organizations o ON a.organization_id = o.id
LEFT JOIN opportunities op ON a.opportunity_id = op.id;

GRANT SELECT ON weekly_activity_summary TO authenticated;
```

### Type Generation
```bash
# After migrations applied
npm run gen:types
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing (75%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Migrations tested on staging database
- [ ] Type generation completed
- [ ] Manual testing checklist completed

### Deployment Steps
1. Apply migrations to cloud database:
   ```bash
   npm run db:cloud:push
   ```
2. Verify views created correctly (query in Supabase dashboard)
3. Deploy frontend to Vercel
4. Run smoke tests on production:
   - Generate Opportunities by Principal report
   - Import 5-row CSV
   - Export filtered list
   - Bulk delete 3 test records

### Post-Deployment
- [ ] Monitor error logs for import/export issues
- [ ] Verify CSV encoding handling (UTF-8, UTF-16)
- [ ] Check report performance with production data
- [ ] Gather user feedback on column mapping UX

---

## Risk Assessment

### High Risk Items

**1. Column Mapping UX Complexity (P5-E4-S3-T2)**
- **Risk:** Drag-and-drop UI may be too complex for MVP timeline
- **Mitigation:** SPIKE (P5-E4-S1-T1) to validate approach early
- **Fallback:** Use dropdown-based mapping (simpler, proven pattern)
- **Decision Point:** After SPIKE completed (Day 1)

**2. Field Matching Algorithm Accuracy (P5-E4-S3-T1)**
- **Risk:** Auto-matching may produce incorrect mappings
- **Mitigation:** Confidence scores + manual override always available
- **Fallback:** Disable auto-matching, require manual mapping
- **Decision Point:** After SPIKE (P5-E4-S1-T3) and initial testing

**3. Large File Import Performance (P5-E4-S5-T1)**
- **Risk:** Importing 5000+ rows may timeout or freeze UI
- **Mitigation:** Batch imports (50 per batch) with progress updates
- **Fallback:** Reduce max file size to 5MB (2500 rows)
- **Decision Point:** During integration testing

### Medium Risk Items

**1. CSV Encoding Detection (P5-E4-S2-T3)**
- **Risk:** Edge cases (mixed encoding, non-standard BOMs)
- **Mitigation:** SPIKE (P5-E4-S1-T2) + manual encoding override
- **Fallback:** Default to UTF-8, require manual selection

**2. Duplicate Detection Performance (P5-E6-S1-T2)**
- **Risk:** Checking 1000s of existing records during import preview
- **Mitigation:** Query with indexed fields (email, name), limit to 1000 checks
- **Fallback:** Skip duplicate detection for large imports (user warning)

### Low Risk Items

**1. Export Button Integration (P5-E1-S1-T2)**
- **Risk:** React Admin bulk action conflicts
- **Mitigation:** Well-documented React Admin pattern, existing examples

**2. Bulk Delete Confirmation (P5-E5-S1-T2)**
- **Risk:** User confusion with two-step process
- **Mitigation:** Clear messaging, common pattern (GitHub uses same flow)

---

## Success Metrics

### Feature Adoption
- **Reports:** 80% of users run Opportunities by Principal report weekly
- **Import:** 50% of users import CSVs during first month
- **Export:** 70% of users export filtered lists monthly
- **Bulk Delete:** 30% of users perform bulk delete quarterly

### Performance Targets
- **Report Generation:** < 2 seconds for 1000 opportunities
- **CSV Export:** < 3 seconds for 5000 records
- **CSV Import:** < 5 seconds for 500 records
- **Column Mapping:** Auto-match accuracy > 85% for common fields

### Quality Metrics
- **Import Error Rate:** < 5% of imports fail validation
- **Export Error Rate:** < 1% of exports fail
- **Bulk Delete Errors:** < 1% of bulk deletes fail
- **User Reported Bugs:** < 3 bugs per 100 imports

---

## Dependencies

### External Libraries
- **PapaParse:** CSV parsing with encoding detection
- **React DnD:** Drag-and-drop for column mapping (if chosen in SPIKE)
- **date-fns:** Date range calculations for Weekly Activity report
- **Levenshtein:** Fuzzy string matching for field auto-matching

### Internal Dependencies
- **React Admin:** BulkActionsToolbar, FilterList, Datagrid
- **Supabase Data Provider:** Bulk create, filtered queries
- **Zod Validation Schemas:** Extended for import validation
- **CSV Processor (existing):** `csvProcessor.ts` from contacts module

### Database Dependencies
- **Views:** `opportunities_by_principal_view`, `weekly_activity_summary`
- **Triggers:** Activity logging triggers (must be functional)
- **RLS Policies:** Reports must respect user permissions

---

## Rollout Plan

### Phase 5a: Export Infrastructure (Week 9, Days 1-2)
- Deploy CSV export utility
- Add export buttons to all list views
- Test with production data volumes

### Phase 5b: Reports (Week 9, Days 3-4)
- Deploy Opportunities by Principal report ⭐
- Deploy Weekly Activity report
- User training on report usage

### Phase 5c: Import (Week 9, Days 5-7)
- Deploy import dialog (file upload only)
- Deploy column mapping UI
- Deploy import execution
- User testing with sample CSVs

### Phase 5d: Bulk Operations (Week 9, Day 8)
- Deploy bulk delete
- User training on bulk operations

### Phase 5e: Validation & Polish (Week 9, Days 9-10)
- Deploy validation improvements
- Fix bugs from user testing
- Performance optimization

---

## Notes

### Design Decisions

**1. CSV-Only Exports (No Excel/PDF)**
- **Rationale:** Simplicity, universal compatibility, no dependencies
- **Trade-off:** Users must open in Excel/Google Sheets for formatting
- **Future:** Excel export can be added in Phase 2 if requested

**2. Manual Report Generation (No Scheduling)**
- **Rationale:** MVP scope, infrastructure complexity
- **Trade-off:** Users must remember to run reports
- **Future:** Email scheduling in Phase 2

**3. Dropdown Column Mapping (Not Drag-Drop)**
- **Rationale:** Simpler implementation, touch-friendly (iPad)
- **Trade-off:** Less intuitive than drag-drop
- **Future:** Drag-drop can be added based on user feedback

**4. Bulk Delete Only (No Bulk Edit)**
- **Rationale:** Delete is highest priority cleanup operation
- **Trade-off:** Users must edit records individually
- **Future:** Bulk edit in Phase 2 if needed

### Known Limitations

**1. Import File Size: 10MB Max**
- Typical CSV: 5000 rows with 10 columns
- Exceeding limit requires splitting file
- Future: Increase to 50MB with streaming upload

**2. Duplicate Detection: 1000 Record Limit**
- Performance constraint for large databases
- May miss duplicates if > 1000 existing records
- Future: Background job for large duplicate checks

**3. Column Auto-Matching: English Only**
- Field matching optimized for English column names
- May not work well for international CSVs
- Future: Multi-language support

**4. Report Performance: 10,000 Record Limit**
- Reports may be slow with > 10,000 opportunities
- Requires pagination or filtering for large datasets
- Future: Server-side aggregation for better performance

---

## Appendix

### Task Summary by Epic

| Epic | Tasks | Time Estimate | Confidence |
|------|-------|---------------|------------|
| E1: CSV Export | 4 | 10-12h | 95% |
| E2: Principal Report ⭐ | 7 | 12-14h | 92% |
| E3: Activity Report | 5 | 8-10h | 90% |
| E4: CSV Import | 15 | 16-20h | 70% |
| E5: Bulk Delete | 3 | 6-8h | 90% |
| E6: Validation | 5 | 6-8h | 85% |
| **Total** | **39** | **58-72h** | **87%** |

### Complexity Distribution

- **Low Complexity (2h):** 12 tasks (31%)
- **Medium Complexity (3-4h):** 18 tasks (46%)
- **High Complexity (5h):** 9 tasks (23%)

### Risk Distribution

- **High Risk:** 3 tasks (8%)
- **Medium Risk:** 8 tasks (21%)
- **Low Risk:** 28 tasks (71%)

### Critical Path

1. **Day 1-2:** Export infrastructure (E1) - blocks report exports
2. **Day 3-4:** Opportunities by Principal report (E2) ⭐ - highest priority
3. **Day 5-7:** CSV import foundation and column mapping (E4) - highest complexity
4. **Day 8:** Weekly Activity report (E3) - can be parallel with Day 7
5. **Day 9:** Bulk delete (E5) - quick win
6. **Day 10:** Validation and polish (E6) - final cleanup

### SPIKE Results Dependencies

**MUST complete before implementation:**
- P5-E4-S1-T1 (Column Mapping UX) → Before P5-E4-S3-T2
- P5-E4-S1-T2 (Encoding Detection) → Before P5-E4-S2-T3
- P5-E4-S1-T3 (Field Matching Algorithm) → Before P5-E4-S3-T1

**Deliverables:** 3 SPIKE documents in `docs/spikes/`

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | Claude Code | Initial plan created |

---

**END OF PHASE 5 IMPLEMENTATION PLAN**
