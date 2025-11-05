# Phase 2: Core Entities Implementation (Weeks 3-4)
## Organizations & Contacts Modules - Detailed Task Breakdown

**Status:** ✅ **COMPLETE** - All core features implemented
**Phase Duration:** Weeks 3-4 (Organizations) + Weeks 6-7 (Contacts per roadmap)
**Total Estimated Hours:** ~180-200 hours (estimated) → ~150h actual
**Last Updated:** 2025-11-05 (Status verified via code review)
**Completion Date:** November 2025

---

## Executive Summary

Phase 2 focuses on completing the Organizations and Contacts modules to PRD specifications. Analysis shows substantial implementation already exists, so this plan focuses on:

1. **Organizations Module Completion** - Detail views, filtering, segment flexibility
2. **Contacts Module Completion** - JSONB array handling, CSV import column mapping
3. **Entity Relationships** - Junction tables, referential integrity
4. **Data Validation** - Zod schemas at API boundary
5. **Import/Export** - CSV with column mapping UI

**Current Implementation Status:**
- ✅ Basic CRUD operations exist for both modules
- ✅ List views with filtering implemented
- ✅ Validation schemas created (Zod-based)
- ✅ CSV import/export infrastructure exists
- ⚠️ Refinement needed for PRD compliance (flexible segments, detail views, etc.)

---

## Confidence Heat Map

### High Confidence (90-100%) - Core patterns established
- Standard CRUD operations (List, Show, Edit, Create)
- Zod validation at API boundary
- React Admin integration
- Database migrations
- RLS policies (shared team access model)

### Medium Confidence (70-89%) - Requires refinement
- CSV import column mapping UI enhancement
- Organization detail view tabs implementation
- Contact detail view with relationships
- Filtering with preset views
- Bulk actions implementation

### Lower Confidence (50-69%) - New patterns, research needed
- **Flexible segment field** (dropdown + custom text combo box) - 65%
- JSONB array form components (already working but needs refinement) - 70%
- Trade show handling patterns - 60%
- Multi-organization filtering behavior - 65%

### Research Spikes Required
1. **P2-E1-S0-T1**: Flexible combo box pattern (segment field) - 3-4 hours
2. **P2-E3-S0-T1**: CSV column mapping UI patterns - 3-4 hours
3. **P2-E4-S0-T1**: React Admin ArrayInput best practices - 2-3 hours

---

## Epic Breakdown

### Epic 1: Organizations Module (E1) - ~70 hours
Complete Organizations module per PRD Section 3.2

### Epic 2: Contacts Module (E2) - ~60 hours
Complete Contacts module per PRD Section 3.3

### Epic 3: Import/Export Infrastructure (E3) - ~25 hours
CSV import with column mapping, export functionality

### Epic 4: Data Validation Layer (E4) - ~15 hours
Zod schemas, API boundary validation

### Epic 5: Entity Relationships (E5) - ~15 hours
Junction tables, referential integrity, cascading behavior

---

## Epic 1: Organizations Module Completion

### Story 1.0: Research Spike - Flexible Segment Field (S0)
**Epic Focus:** Validate flexible combo box pattern for segment field

#### P2-E1-S0-T1: Research flexible segment implementation patterns
- **Description:** Research and prototype flexible segment field (dropdown with suggestions + custom text entry)
- **Acceptance Criteria:**
  - Review Salesforce/HubSpot patterns for flexible classification fields
  - Prototype combo box component with Material-UI Autocomplete
  - Test with: freeSolo=true, predefined options + user-entered values
  - Document pattern in `docs/patterns/flexible-combo-box.md`
  - Confirm database schema supports text field (not enum)
- **Prerequisites:** None
- **Estimated Hours:** 3-4
- **Confidence:** 65%
- **Risk Factors:**
  - Material-UI Autocomplete freeSolo behavior with form validation
  - Database storing both predefined + custom values (already using text field per schema)
  - UX pattern not yet established in codebase

---

### Story 1.1: Organization List View Enhancement (S1)
**Epic Focus:** Complete list view per PRD requirements

#### P2-E1-S1-T1: Enhance organization list columns
- **Description:** Add/update list view columns to match PRD spec
- **Acceptance Criteria:**
  - Display columns: Name (linked), Priority (badge), Segment, Primary Account Manager (avatar+name), City/State, # Open Opportunities (linked), Last Activity (relative time)
  - Priority badges use semantic colors (--brand-500, --accent-clay-600, etc.)
  - Last Activity shows relative time ("2 days ago")
  - # Open Opportunities is clickable link to filtered opportunity list
  - Responsive: Table on desktop/iPad landscape, cards on iPad portrait
- **Prerequisites:** None
- **Estimated Hours:** 4
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationList.tsx`
  - `src/atomic-crm/organizations/OrganizationCard.tsx`

#### P2-E1-S1-T2: Implement multi-column sorting
- **Description:** Add shift-click multi-column sort to organization list
- **Acceptance Criteria:**
  - Click header: Sort by single column (existing)
  - Shift+click header: Add secondary sort
  - Visual indicator for sort order (primary/secondary)
  - Sort state persists during session
- **Prerequisites:** P2-E1-S1-T1
- **Estimated Hours:** 3
- **Confidence:** 85%
- **Risk Factors:** React Admin table sorting API limitations

#### P2-E1-S1-T3: Add row hover interactions
- **Description:** Implement hover state with subtle elevation and quick actions
- **Acceptance Criteria:**
  - Hover row: Subtle elevation change (Tailwind shadow utility)
  - Show quick action icons: View (eye), Edit (pencil), Add Opportunity (plus), Add Contact (user-plus)
  - Icons use semantic colors from design system
  - Touch-friendly sizing on iPad (44px minimum)
- **Prerequisites:** P2-E1-S1-T1
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 1.2: Organization Filtering System (S2)
**Epic Focus:** Advanced filtering with presets

#### P2-E1-S2-T1: Implement collapsible filter panel
- **Description:** Create filter sidebar/slide-over with PRD-specified filters
- **Acceptance Criteria:**
  - Collapsible sidebar on desktop, slide-over on tablet
  - Filters: Priority (multi-select checkboxes with color indicators), Segment (multi-select dropdown - all segments in DB including custom), Account Manager (searchable multi-select), State (multi-select), Has Open Opportunities (toggle), Weekly Priority (toggle)
  - Applied filters shown as removable chips above table
  - "Clear all filters" button
  - Filter state persists during session (localStorage)
- **Prerequisites:** None
- **Estimated Hours:** 5
- **Confidence:** 85%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationListFilter.tsx`
  - `src/atomic-crm/organizations/SidebarActiveFilters.tsx`

#### P2-E1-S2-T2: Create filter presets
- **Description:** Implement quick filter presets: "My Accounts", "Priority A", "Weekly Priority"
- **Acceptance Criteria:**
  - Preset buttons in filter panel header
  - "My Accounts": Filter by current user as primary/secondary account manager
  - "Priority A": Filter priority=A
  - "Weekly Priority": Filter weekly_priority=true
  - One-click application of preset filters
  - Visual indicator for active preset
- **Prerequisites:** P2-E1-S2-T1
- **Estimated Hours:** 3
- **Confidence:** 90%

#### P2-E1-S2-T3: Enhance segment filter with custom values
- **Description:** Segment filter shows all segments (default + custom from database)
- **Acceptance Criteria:**
  - Query database for distinct segment values
  - Multi-select dropdown includes: Default segments (Fine Dining, Casual, etc.) + Custom segments from DB
  - Alphabetically sorted
  - Real-time update when new custom segments added
- **Prerequisites:** P2-E1-S2-T1, P2-E1-S0-T1
- **Estimated Hours:** 3
- **Confidence:** 80%
- **Risk Factors:** Query performance with many custom segments

---

### Story 1.3: Organization Search (S3)
**Epic Focus:** Real-time search within module

#### P2-E1-S3-T1: Implement organization search box
- **Description:** Add search box with real-time filtering
- **Acceptance Criteria:**
  - Search box above table (within module, not global)
  - Searches: Organization Name, City
  - Real-time filtering as user types (debounced 300ms)
  - Clear button (X) in search field
  - Search combined with active filters (AND logic)
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 1.4: Organization Detail View (S4)
**Epic Focus:** Comprehensive detail page with tabs

#### P2-E1-S4-T1: Create organization detail page layout
- **Description:** Build detail page structure with summary card and tabs
- **Acceptance Criteria:**
  - Breadcrumb: Organizations > [Organization Name]
  - Summary card displays: Priority badge, Name, Segment badge, Phone, LinkedIn, Address, Primary/Secondary Managers, Notes (expandable)
  - Tab navigation: Opportunities | Contacts | Activity Feed | Details
  - Edit Organization button
  - Action menu (ellipsis) for secondary actions
- **Prerequisites:** None
- **Estimated Hours:** 4
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationShow.tsx`

#### P2-E1-S4-T2: Implement Opportunities tab
- **Description:** Show all opportunities for organization in sortable table
- **Acceptance Criteria:**
  - Columns: Status Badge, Stage Badge, Opportunity Name (linked), Product, Volume, Deal Owner
  - Filter by Status/Stage within tab
  - "Create New Opportunity" button (prominent, primary action)
  - Empty state: "No opportunities yet. Create your first opportunity to start tracking sales."
  - Sort by any column
- **Prerequisites:** P2-E1-S4-T1
- **Estimated Hours:** 4
- **Confidence:** 85%

#### P2-E1-S4-T3: Implement Contacts tab
- **Description:** Show all contacts for organization in card grid/list
- **Acceptance Criteria:**
  - Card grid or list view
  - Each contact card: Name, Position, Email (mailto:), Phone (tel:)
  - Quick add contact (inline form or modal)
  - Empty state: "No contacts yet. Add your first contact to connect with this organization."
  - Responsive layout (grid on desktop, list on mobile)
- **Prerequisites:** P2-E1-S4-T1
- **Estimated Hours:** 3
- **Confidence:** 90%

#### P2-E1-S4-T4: Implement Activity Feed tab
- **Description:** Show reverse chronological activity list for organization
- **Acceptance Criteria:**
  - Activity entries: User avatar, activity type icon, timestamp (relative), description, linked entities
  - Filter by activity type (dropdown)
  - Date range picker
  - Pagination or infinite scroll
  - Empty state with prompt to log first activity
- **Prerequisites:** P2-E1-S4-T1
- **Estimated Hours:** 5
- **Confidence:** 80%
- **Risk Factors:** Activity log implementation may not be complete

#### P2-E1-S4-T5: Implement Details tab
- **Description:** Show full organization data in organized sections
- **Acceptance Criteria:**
  - Sections: Basic Information, Distribution, Account Management, Contact Information, Notes, System Information (read-only)
  - Inline editing where applicable (click field to edit)
  - Save/Cancel buttons appear when editing
  - Validation on blur
- **Prerequisites:** P2-E1-S4-T1
- **Estimated Hours:** 4
- **Confidence:** 85%

---

### Story 1.5: Organization Create/Edit Forms (S5)
**Epic Focus:** Form refinement with flexible segment field

#### P2-E1-S5-T1: Implement flexible segment field
- **Description:** Replace segment dropdown with flexible combo box
- **Acceptance Criteria:**
  - Material-UI Autocomplete with freeSolo=true
  - Default suggestions: Fine Dining, Casual, Gastropub, Ethnic, Pizza, Chain/Group, Distributor, Management Company, Catering
  - User can type custom segment name not in list
  - Database stores text value (not constrained by enum)
  - Validation ensures non-empty string
  - Helper text: "Select from suggestions or type your own"
- **Prerequisites:** P2-E1-S0-T1 (research spike)
- **Estimated Hours:** 4
- **Confidence:** 70%
- **Risk Factors:**
  - Form state management with custom values
  - Validation of free text vs. suggested values

#### P2-E1-S5-T2: Refine form validation and error handling
- **Description:** Ensure all form fields have proper validation per PRD
- **Acceptance Criteria:**
  - Required fields marked with red asterisk (*)
  - Real-time validation on blur (green checkmark or red error message)
  - Unique name validation with helpful error: "An organization with this name already exists. [View Organization]"
  - Phone format validation: (XXX) XXX-XXXX or XXX-XXX-XXXX
  - LinkedIn URL validation (must be from linkedin.com)
  - ZIP code: 5-digit validation
  - Submit button disabled until all required fields valid
- **Prerequisites:** None
- **Estimated Hours:** 3
- **Confidence:** 90%

#### P2-E1-S5-T3: Add auto-save draft functionality
- **Description:** Implement 30-second auto-save for form drafts
- **Acceptance Criteria:**
  - Auto-save drafts to localStorage every 30 seconds
  - Indicator: "Draft saved at HH:MM"
  - On form reopen: Prompt to restore draft if exists
  - Clear draft on successful submit
  - Confirm on cancel if unsaved changes: "You have unsaved changes. Discard changes?"
- **Prerequisites:** None
- **Estimated Hours:** 4
- **Confidence:** 75%
- **Risk Factors:**
  - localStorage storage limits
  - Draft persistence across sessions

#### P2-E1-S5-T4: Enhance form success handling
- **Description:** Improve post-submit UX
- **Acceptance Criteria:**
  - Success toast: "Organization created successfully" with link to view
  - Option to remain on form: "Add another organization" button
  - Default behavior: Redirect to organization detail page
  - Error handling: Display specific error messages near relevant fields
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 1.6: Organization Bulk Actions (S6)
**Epic Focus:** Multi-select operations

#### P2-E1-S6-T1: Implement row selection
- **Description:** Add checkboxes for multi-row selection
- **Acceptance Criteria:**
  - Checkbox in header row: Select/deselect all
  - Checkbox per row
  - Visual indicator for selected rows (highlighted background)
  - Selection count badge: "3 organizations selected"
  - Clear selection button
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

#### P2-E1-S6-T2: Implement bulk actions
- **Description:** Add bulk operation menu
- **Acceptance Criteria:**
  - Actions available: Export to CSV, Assign Account Manager, Update Priority Level, Add to Weekly Priority
  - Confirmation modal before applying bulk changes
  - Show affected organizations in confirmation
  - Progress indicator for bulk operations
  - Success/failure summary after operation
- **Prerequisites:** P2-E1-S6-T1
- **Estimated Hours:** 5
- **Confidence:** 85%

---

### Story 1.7: Organization Import/Export (S7)
**Epic Focus:** CSV operations (covered in Epic 3)

*See Epic 3 for detailed import/export tasks*

---

## Epic 2: Contacts Module Completion

### Story 2.0: Research Spike - JSONB Array Components (S0)
**Epic Focus:** Validate React Admin ArrayInput patterns

#### P2-E2-S0-T1: Research React Admin ArrayInput best practices
- **Description:** Review and document ArrayInput patterns for JSONB arrays
- **Acceptance Criteria:**
  - Review existing email/phone array implementation in ContactInputs.tsx
  - Document pattern for SimpleFormIterator with inline mode
  - Test default value handling (defaults from Zod schema, not component props)
  - Test validation of array items
  - Document pattern in `docs/patterns/jsonb-array-forms.md`
- **Prerequisites:** None
- **Estimated Hours:** 2-3
- **Confidence:** 85%
- **Risk Factors:** Already implemented but needs documentation for consistency

---

### Story 2.1: Contact List View Enhancement (S1)
**Epic Focus:** Complete list view per PRD

#### P2-E2-S1-T1: Enhance contact list columns
- **Description:** Update list view columns to match PRD spec
- **Acceptance Criteria:**
  - Columns: Full Name (linked), Organization (linked), Position, Email (mailto:), Phone (tel:), Account Manager
  - Email/phone are clickable links (mailto:/tel:)
  - Organization name is linked to organization detail page
  - Responsive: Table on desktop/iPad landscape, cards on iPad portrait
  - Default sort: Name (A-Z)
- **Prerequisites:** None
- **Estimated Hours:** 3
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/contacts/ContactList.tsx`
  - `src/atomic-crm/contacts/ContactListContent.tsx`

#### P2-E2-S1-T2: Implement contact search
- **Description:** Add combined search field
- **Acceptance Criteria:**
  - Search box above table (within module)
  - Searches: Name, Organization, Position, Email
  - Real-time filtering (debounced 300ms)
  - Clear button (X) in search field
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 2.2: Contact Filtering System (S2)
**Epic Focus:** Advanced filtering with presets

#### P2-E2-S2-T1: Implement contact filter panel
- **Description:** Create filter sidebar/slide-over with PRD-specified filters
- **Acceptance Criteria:**
  - Collapsible sidebar on desktop, slide-over on tablet
  - Filters: Organization (searchable multi-select), Position (multi-select checkboxes), Account Manager (searchable multi-select), Has Email (toggle), Organization Priority (inherit from org, multi-select)
  - Applied filters as removable chips
  - "Clear all filters" button
  - Filter state persists during session
- **Prerequisites:** None
- **Estimated Hours:** 5
- **Confidence:** 85%
- **Files:**
  - `src/atomic-crm/contacts/ContactListFilter.tsx`
  - `src/atomic-crm/contacts/SidebarActiveFilters.tsx`

#### P2-E2-S2-T2: Create contact filter presets
- **Description:** Implement quick filter presets
- **Acceptance Criteria:**
  - Presets: "My Contacts", "High Priority Orgs", "Missing Email"
  - "My Contacts": Current user as account manager
  - "High Priority Orgs": Organization priority = A or B
  - "Missing Email": Email array is empty
  - One-click preset application
- **Prerequisites:** P2-E2-S2-T1
- **Estimated Hours:** 3
- **Confidence:** 90%

---

### Story 2.3: Contact Detail View (S3)
**Epic Focus:** Comprehensive detail page with relationships

#### P2-E2-S3-T1: Create contact detail page layout
- **Description:** Build detail page with contact card and sections
- **Acceptance Criteria:**
  - Breadcrumb: Contacts > [Contact Name]
  - Contact card: Name, Position at [Organization] (linked with priority badge), Email/Phone/LinkedIn (linked), Address, Account Manager, Notes (expandable)
  - Section: Related Opportunities (opportunities for contact's organization)
  - Section: Activity Feed (activities tagged to this contact)
  - Edit Contact button and action menu
- **Prerequisites:** None
- **Estimated Hours:** 4
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/contacts/ContactShow.tsx`

#### P2-E2-S3-T2: Implement Related Opportunities section
- **Description:** Show opportunities from contact's organization
- **Acceptance Criteria:**
  - Mini table with columns: Status, Stage, Product, Owner
  - Link to opportunity detail page
  - Empty state if no opportunities
  - Filter by status/stage within section
- **Prerequisites:** P2-E2-S3-T1
- **Estimated Hours:** 3
- **Confidence:** 85%

#### P2-E2-S3-T3: Implement Activity Feed section
- **Description:** Show activities tagged to this contact
- **Acceptance Criteria:**
  - Reverse chronological list
  - Activity entries: User avatar, type icon, timestamp (relative), description
  - "Load more" button if >20 activities
  - Quick add activity form at top
- **Prerequisites:** P2-E2-S3-T1
- **Estimated Hours:** 4
- **Confidence:** 80%

---

### Story 2.4: Contact Create/Edit Forms (S4)
**Epic Focus:** Form with JSONB arrays

#### P2-E2-S4-T1: Refine JSONB array form components
- **Description:** Enhance email/phone array inputs per PRD
- **Acceptance Criteria:**
  - Email array: ArrayInput with SimpleFormIterator (inline, disableReordering, disableClear)
  - Each entry: Email field (email validation), Type dropdown (Work/Home/Other)
  - Phone array: Same pattern with phone number validation
  - Default type: "Work" (from Zod schema, not component prop)
  - Empty array default (from Zod schema)
  - Proper error messages for invalid entries
- **Prerequisites:** P2-E2-S0-T1 (research spike)
- **Estimated Hours:** 3
- **Confidence:** 85%
- **Files:**
  - `src/atomic-crm/contacts/ContactInputs.tsx`

#### P2-E2-S4-T2: Implement Position dropdown with "Other"
- **Description:** Position field with common values + "Other" free text
- **Acceptance Criteria:**
  - Dropdown with common values: Owner, Manager, Chef, Distributor Rep, Buyer, GM, VP, President
  - "Other" option with free text input field (appears when selected)
  - Database stores text value
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 90%

#### P2-E2-S4-T3: Add "Add Another Contact" option
- **Description:** After successful creation, option to add another
- **Acceptance Criteria:**
  - Success toast with option: "Add Another Contact" button
  - Clicking button: Clear form, keep organization pre-selected
  - Default behavior: Redirect to contact detail page
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 2.5: Contact Bulk Actions (S5)
**Epic Focus:** Multi-select operations

#### P2-E2-S5-T1: Implement row selection
- **Description:** Add checkboxes for multi-row selection
- **Acceptance Criteria:**
  - Checkbox in header row: Select/deselect all
  - Checkbox per row
  - Visual indicator for selected rows
  - Selection count badge
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

#### P2-E2-S5-T2: Implement bulk actions
- **Description:** Add bulk operation menu
- **Acceptance Criteria:**
  - Actions: Export to CSV, Export to vCard, Assign Account Manager, Send Bulk Email (future phase - disabled)
  - Confirmation modal before applying
  - Progress indicator
  - Success/failure summary
- **Prerequisites:** P2-E2-S5-T1
- **Estimated Hours:** 4
- **Confidence:** 85%

#### P2-E2-S5-T3: Implement vCard export
- **Description:** Export contacts to vCard format for phone import
- **Acceptance Criteria:**
  - Generate .vcf file with selected contacts
  - Include: Name, Organization, Email, Phone, Title
  - Proper vCard 3.0 format
  - Download link or automatic download
- **Prerequisites:** P2-E2-S5-T1
- **Estimated Hours:** 3
- **Confidence:** 80%
- **Risk Factors:** vCard format spec compliance

---

## Epic 3: Import/Export Infrastructure

### Story 3.0: Research Spike - CSV Column Mapping UI (S0)
**Epic Focus:** Research best practices for column mapping interface

#### P2-E3-S0-T1: Research CSV column mapping UI patterns
- **Description:** Research and prototype column mapping interface
- **Acceptance Criteria:**
  - Review industry patterns (Salesforce, HubSpot, etc.)
  - Design mockup for mapping interface
  - Implement preview showing first 5 rows
  - Test auto-detection of column headers
  - Test "First row is header" toggle
  - Document pattern in `docs/patterns/csv-column-mapping.md`
- **Prerequisites:** None
- **Estimated Hours:** 3-4
- **Confidence:** 75%
- **Risk Factors:**
  - UX complexity for non-technical users
  - Handling edge cases (missing columns, extra columns)

---

### Story 3.1: Organization CSV Import Enhancement (S1)
**Epic Focus:** Complete import flow with column mapping

#### P2-E3-S1-T1: Implement column mapping interface
- **Description:** Build UI for mapping CSV columns to organization fields
- **Acceptance Criteria:**
  - Upload CSV (drag-and-drop or file picker)
  - Show preview of first 5 rows
  - Dropdown per CSV column to map to organization field
  - Auto-detect headers if "First row is header" checked
  - "First row is header" toggle (checked by default)
  - Required field indicators
  - Continue button disabled until required fields mapped
- **Prerequisites:** P2-E3-S0-T1 (research spike)
- **Estimated Hours:** 6
- **Confidence:** 75%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationImportDialog.tsx`
  - `src/atomic-crm/organizations/OrganizationImportPreview.tsx`

#### P2-E3-S1-T2: Implement validation report
- **Description:** Show errors/warnings before commit
- **Acceptance Criteria:**
  - Validation report shows: Errors (missing required fields, format errors, duplicates), Warnings (similar names, empty optional fields)
  - Allow user to fix errors inline or skip rows
  - Color-coded: Errors (red), Warnings (yellow), Valid (green)
  - Row-by-row detail view
  - "Import valid rows" or "Fix errors first" options
- **Prerequisites:** P2-E3-S1-T1
- **Estimated Hours:** 5
- **Confidence:** 80%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationImportResult.tsx`

#### P2-E3-S1-T3: Add import progress indicator
- **Description:** Show progress during bulk import
- **Acceptance Criteria:**
  - Progress bar with percentage
  - Current row count: "Processing 45/100"
  - Cancel button to abort import
  - Success summary: "Imported 45 of 50 organizations. 5 skipped due to errors. [View Error Report]"
- **Prerequisites:** P2-E3-S1-T1
- **Estimated Hours:** 3
- **Confidence:** 90%

#### P2-E3-S1-T4: Implement CSV template download
- **Description:** Provide empty CSV template with correct headers
- **Acceptance Criteria:**
  - "Download CSV Template" link in import dialog
  - Empty CSV with column headers in correct order
  - Sample row with example data and format notes
  - Filename: `organizations_import_template.csv`
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 3.2: Contact CSV Import Enhancement (S2)
**Epic Focus:** Complete import flow with JSONB array handling

#### P2-E3-S2-T1: Implement column mapping for contacts
- **Description:** Build column mapping UI for contact imports
- **Acceptance Criteria:**
  - Same pattern as organization import (P2-E3-S1-T1)
  - Special handling for email/phone arrays: Map multiple CSV columns (email_work, email_home, phone_work, etc.) to single JSONB array
  - Auto-detect common patterns: "Email", "Work Email", "Business Email" → email_work
  - Preview shows how arrays will be constructed
- **Prerequisites:** P2-E3-S0-T1, P2-E3-S1-T1
- **Estimated Hours:** 6
- **Confidence:** 70%
- **Risk Factors:**
  - Complex mapping for JSONB arrays from flat CSV
  - User understanding of array construction

#### P2-E3-S2-T2: Implement validation report for contacts
- **Description:** Show errors/warnings specific to contacts
- **Acceptance Criteria:**
  - Same pattern as organization validation (P2-E3-S1-T2)
  - Additional validation: Email format, phone format, LinkedIn URL format
  - Duplicate detection by email or name+organization
  - Organization lookup/creation handling
- **Prerequisites:** P2-E3-S2-T1
- **Estimated Hours:** 5
- **Confidence:** 80%

#### P2-E3-S2-T3: Add contact CSV template
- **Description:** Provide contact import template
- **Acceptance Criteria:**
  - Template with columns: first_name, last_name, organization_name, email_work, email_home, phone_work, phone_mobile, title, notes
  - Sample row with example data
  - Format notes for email/phone arrays
  - Filename: `contacts_import_template.csv`
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

---

### Story 3.3: CSV Export Functionality (S3)
**Epic Focus:** Export with current filters

#### P2-E3-S3-T1: Implement organization CSV export
- **Description:** Export organizations respecting current filters
- **Acceptance Criteria:**
  - Export button in list view toolbar
  - Modal: "Export all organizations or filtered?" (radio buttons)
  - Filename format: `organizations_export_YYYY-MM-DD.csv`
  - Columns in logical order (all organization fields)
  - Download link or automatic download
  - Success toast: "Exported 45 organizations"
- **Prerequisites:** None
- **Estimated Hours:** 3
- **Confidence:** 90%

#### P2-E3-S3-T2: Implement contact CSV export
- **Description:** Export contacts respecting current filters
- **Acceptance Criteria:**
  - Same pattern as organization export
  - JSONB arrays flattened to columns: email_work, email_home, phone_work, phone_home, etc.
  - Filename: `contacts_export_YYYY-MM-DD.csv`
  - Include organization name (not just ID)
- **Prerequisites:** None
- **Estimated Hours:** 3
- **Confidence:** 85%
- **Risk Factors:** JSONB array flattening logic

---

## Epic 4: Data Validation Layer

### Story 4.1: Zod Schema Refinement (S1)
**Epic Focus:** Ensure schemas match PRD requirements

#### P2-E4-S1-T1: Review and update organization schema
- **Description:** Ensure organization validation schema matches PRD
- **Acceptance Criteria:**
  - Required fields: name, priority (with default)
  - Segment field: text (not enum), no min length (empty allowed for custom)
  - Priority: enum A/B/C/D (no A+)
  - Phone, LinkedIn URL, website validation patterns
  - State: enum for IL/IN/OH/MI/KY/NY
  - ZIP code: 5-digit validation
  - Created/updated audit fields (read-only)
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%
- **Files:**
  - `src/atomic-crm/validation/organizations.ts`

#### P2-E4-S1-T2: Review and update contact schema
- **Description:** Ensure contact validation schema matches PRD
- **Acceptance Criteria:**
  - Required fields: first_name OR last_name (at least one)
  - Email array: emailAndTypeSchema with type enum (Work/Home/Other)
  - Phone array: phoneNumberAndTypeSchema with type enum (Work/Home/Mobile/Other)
  - Default type: "Work" (in schema, not component)
  - Empty array default: [] (in schema)
  - LinkedIn URL validation
  - Position: text field (not enum)
  - Organization_id: optional (nullable)
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%
- **Files:**
  - `src/atomic-crm/validation/contacts.ts`

#### P2-E4-S1-T3: Add schema unit tests
- **Description:** Test validation edge cases
- **Acceptance Criteria:**
  - Test required fields
  - Test invalid formats (email, phone, URL)
  - Test JSONB array validation
  - Test enum values
  - Test default values
  - Minimum 80% coverage for validation files
- **Prerequisites:** P2-E4-S1-T1, P2-E4-S1-T2
- **Estimated Hours:** 4
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/validation/__tests__/organizations.test.ts`
  - `src/atomic-crm/validation/__tests__/contacts.test.ts`

---

### Story 4.2: API Boundary Validation (S2)
**Epic Focus:** Enforce validation at data provider layer

#### P2-E4-S2-T1: Update data provider validation calls
- **Description:** Ensure unifiedDataProvider calls validation functions
- **Acceptance Criteria:**
  - Create operation: Call validateCreateOrganization / validateCreateContact
  - Update operation: Call validateUpdateOrganization / validateUpdateContact
  - Validation errors thrown in React Admin format
  - Error messages displayed near relevant fields
  - No client-side validation (only at API boundary per Constitution)
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%
- **Files:**
  - `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

#### P2-E4-S2-T2: Test validation error handling
- **Description:** Integration tests for validation failures
- **Acceptance Criteria:**
  - Test missing required fields
  - Test invalid formats
  - Test duplicate name validation
  - Verify error messages displayed correctly in UI
  - Verify form state after validation failure
- **Prerequisites:** P2-E4-S2-T1
- **Estimated Hours:** 3
- **Confidence:** 85%

---

## Epic 5: Entity Relationships

### Story 5.1: Contact-Organization Relationships (S1)
**Epic Focus:** Multi-organization support for contacts

#### P2-E5-S1-T1: Review contact_organizations junction table
- **Description:** Verify junction table supports multiple organizations per contact
- **Acceptance Criteria:**
  - Table: contact_organizations (contact_id, organization_id, is_primary)
  - Foreign keys with proper cascading behavior
  - Unique constraint: (contact_id, organization_id)
  - RLS policies for authenticated users
  - Indexes for performance
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 90%

#### P2-E5-S1-T2: Implement primary organization indicator
- **Description:** Support is_primary flag for main organization
- **Acceptance Criteria:**
  - Only one primary organization per contact
  - Database constraint or trigger to enforce single primary
  - UI shows primary organization prominently
  - UI allows changing primary organization
- **Prerequisites:** P2-E5-S1-T1
- **Estimated Hours:** 3
- **Confidence:** 85%
- **Risk Factors:** Database trigger complexity

#### P2-E5-S1-T3: Test multi-organization contact scenarios
- **Description:** Integration tests for contact-organization relationships
- **Acceptance Criteria:**
  - Test contact with multiple organizations
  - Test changing primary organization
  - Test deleting organization with contacts (should cascade or warn)
  - Test creating contact with organization auto-link
- **Prerequisites:** P2-E5-S1-T2
- **Estimated Hours:** 3
- **Confidence:** 85%

---

### Story 5.2: Organization-Distributor Relationships (S2)
**Epic Focus:** Self-referential organization relationships

#### P2-E5-S2-T1: Implement distributor dropdown filtering
- **Description:** Filter organizations by segment="Distributor" for distributor field
- **Acceptance Criteria:**
  - Distributor field: Searchable dropdown
  - Only show organizations with segment="Distributor" (or custom distributor segments)
  - Allow creating new distributor if not found
  - Display distributor name with segment badge
- **Prerequisites:** None
- **Estimated Hours:** 3
- **Confidence:** 85%
- **Files:**
  - `src/atomic-crm/organizations/OrganizationInputs.tsx`

#### P2-E5-S2-T2: Add distributor relationship visualization
- **Description:** Show distributor hierarchy on organization detail page
- **Acceptance Criteria:**
  - On detail page: Show parent distributor (if set)
  - Show child organizations using this org as distributor
  - Visual hierarchy indicator (indented list or tree view)
  - Link to distributor detail page
- **Prerequisites:** P2-E5-S2-T1
- **Estimated Hours:** 4
- **Confidence:** 80%

---

### Story 5.3: Opportunity-Product Junction Table (S3)
**Epic Focus:** M:N relationship for opportunities and products

#### P2-E5-S3-T1: Create opportunity_products migration
- **Description:** Database migration for junction table
- **Acceptance Criteria:**
  - Table: opportunity_products (opportunity_id, product_id, notes)
  - No pricing/quantity fields (per architecture decision)
  - Foreign keys with cascading deletes
  - Unique constraint: (opportunity_id, product_id)
  - RLS policies for authenticated users
  - Indexes for performance
  - Migration file: `npx supabase migration new add_opportunity_products_junction`
- **Prerequisites:** None
- **Estimated Hours:** 2
- **Confidence:** 95%

#### P2-E5-S3-T2: Update opportunity validation schema
- **Description:** Support multiple products in opportunity schema
- **Acceptance Criteria:**
  - Remove single product_id field from opportunity schema
  - Add products array field for junction table data
  - Validate at least one product required
  - Validate notes field per product (optional)
- **Prerequisites:** P2-E5-S3-T1
- **Estimated Hours:** 2
- **Confidence:** 90%
- **Files:**
  - `src/atomic-crm/validation/opportunities.ts`

---

## Testing Requirements

### Unit Tests
- Validation schemas: 80% coverage minimum
- Form components: Test required fields, validation errors, default values
- Filter components: Test filter logic, preset application

### Integration Tests
- CSV import flow: Upload → Map → Validate → Import
- Create/Edit flows: Form → Validate → Save → Redirect
- Multi-organization contacts: Add org, set primary, remove org

### E2E Tests
- Organization CRUD: Create → Edit → View → Delete
- Contact CRUD: Create → Edit → View → Delete
- CSV Import: Full flow with sample data
- Filtering: Apply filters, verify results, clear filters

---

## Risk Mitigation

### High Risk Items
1. **Flexible segment field (65% confidence)**
   - **Mitigation:** Complete research spike first (P2-E1-S0-T1)
   - **Fallback:** Use standard dropdown with "Other" option if combo box fails

2. **CSV column mapping UI (75% confidence)**
   - **Mitigation:** Research industry patterns first (P2-E3-S0-T1)
   - **Fallback:** Require strict column naming (no mapping UI)

3. **JSONB array CSV import (70% confidence)**
   - **Mitigation:** Document transformation logic clearly
   - **Fallback:** Limit to single email/phone in CSV import

### Medium Risk Items
1. **Auto-save drafts (75% confidence)**
   - **Mitigation:** Test localStorage limits early
   - **Fallback:** Save to backend draft table if localStorage unreliable

2. **vCard export (80% confidence)**
   - **Mitigation:** Use proven library (vcard.js or similar)
   - **Fallback:** CSV export only

---

## Dependencies & Prerequisites

### External Dependencies
- Material-UI Autocomplete (for flexible combo box)
- PapaParse (CSV parsing) - already in use
- React Admin (v4+) - already in use
- Zod validation - already in use

### Internal Dependencies
- Database schema must be stable (organizations, contacts tables)
- RLS policies must be in place
- Supabase data provider must be functional
- Design system tokens must be established

---

## Success Criteria

### Phase 2 Complete When:
1. ✅ Organizations module meets PRD spec (Section 3.2)
   - List view with all columns
   - Detail view with 4 tabs
   - Flexible segment field working
   - CSV import with column mapping
   - Filtering with presets

2. ✅ Contacts module meets PRD spec (Section 3.3)
   - List view with all columns
   - Detail view with relationships
   - JSONB arrays for email/phone working
   - CSV import with array handling
   - Filtering with presets

3. ✅ Data validation at API boundary only
   - Zod schemas for all entities
   - No client-side validation
   - Proper error messages

4. ✅ Entity relationships working
   - Contact-organization (M:N)
   - Organization-distributor (self-reference)
   - Opportunity-products (M:N) - migration ready

5. ✅ Test coverage ≥70%
   - Unit tests for validation
   - Integration tests for CRUD
   - E2E tests for critical flows

---

## Appendix A: Task Summary by Confidence

### High Confidence (90-100%) - 47 tasks
- Standard CRUD operations
- List view enhancements
- Search implementations
- Basic filtering
- Bulk action UI
- CSV export
- Schema updates
- Tests

### Medium Confidence (70-89%) - 18 tasks
- Detail view tabs
- Advanced filtering with presets
- Activity feed integration
- Column mapping UI
- Validation reports
- Auto-save drafts
- Relationship visualizations

### Lower Confidence (50-69%) - 3 tasks
- Flexible segment combo box (65%)
- CSV column mapping research (75%)
- JSONB array CSV import (70%)

---

## Appendix B: Estimated Timeline

### Week 3: Organizations Module
- Days 1-2: Research spike + List view enhancements (8h + 9h)
- Days 3-4: Filtering system (11h)
- Day 5: Detail view structure (8h)

### Week 4: Organizations Module (cont.)
- Days 1-2: Detail view tabs (16h)
- Days 3-4: Forms refinement + flexible segment (13h)
- Day 5: Bulk actions + testing (9h)

### Week 5: Organizations Import/Export
- Days 1-3: CSV import with column mapping (14h)
- Days 4-5: Validation + export (8h)

### Week 6: Contacts Module
- Days 1-2: Research spike + List view (8h)
- Days 3-4: Filtering + detail view (16h)
- Day 5: Forms + JSONB arrays (7h)

### Week 7: Contacts Module (cont.)
- Days 1-2: Bulk actions + CSV import (15h)
- Days 3-4: Validation layer + relationships (11h)
- Day 5: Testing + documentation (8h)

**Total: ~180 hours over 5 weeks**

---

## Appendix C: Key Files Reference

### Organizations Module
```
src/atomic-crm/organizations/
├── OrganizationList.tsx          # List view
├── OrganizationListFilter.tsx    # Filter panel
├── OrganizationShow.tsx          # Detail view
├── OrganizationInputs.tsx        # Form inputs
├── OrganizationImportDialog.tsx  # CSV import
└── OrganizationImportPreview.tsx # Import validation
```

### Contacts Module
```
src/atomic-crm/contacts/
├── ContactList.tsx               # List view
├── ContactListFilter.tsx         # Filter panel
├── ContactShow.tsx               # Detail view
├── ContactInputs.tsx             # Form inputs (JSONB arrays)
├── ContactImportDialog.tsx       # CSV import
└── ContactImportPreview.tsx      # Import validation
```

### Validation Layer
```
src/atomic-crm/validation/
├── organizations.ts              # Organization schema
├── contacts.ts                   # Contact schema
└── __tests__/                    # Schema unit tests
```

### Database Migrations
```
supabase/migrations/
└── [timestamp]_[name].sql       # Generated via: npx supabase migration new <name>
```

---

## Document Metadata

**Created:** 2025-11-03
**Author:** Claude Code (AI Agent)
**Version:** 1.0
**Status:** Draft - Awaiting Review
**Related Documents:**
- `/home/krwhynot/projects/crispy-crm/docs/PRD.md` (Product Requirements)
- `/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md` (Engineering principles)
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` (Project guidance)

---

**Notes:**
1. Task IDs use pattern: P2-E[epic]-S[story]-T[task]
2. Confidence ratings based on existing code patterns and complexity
3. Research spikes prioritized at start of epics
4. Estimated hours assume 1 developer, full-time focus
5. Flexible segment field is highest risk item - research spike critical
