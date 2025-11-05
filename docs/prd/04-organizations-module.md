---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Organizations Module
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Organizations table schema
- 🎨 [Design System](./15-design-tokens.md) - List views, forms, and detail pages
- 🔗 [Contacts Module](./05-contacts-module.md) - Linked entities
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Organization relationships
- 📊 [Import/Export](./13-import-export.md) - CSV import/export patterns
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **100%** |
| **Confidence** | 🟢 **HIGH** - Production ready |
| **Files** | 32 total (26 implementation, 6 tests) |
| **CRUD Operations** | ✅ List, Show, Edit, Create all complete |
| **Database Schema** | ✅ Full schema with RLS policies |
| **Validation** | ✅ Comprehensive Zod schemas |
| **Advanced Features** | ✅ CSV Import/Export, Filtering, Bulk actions |

**Completed Requirements:**
- ✅ List view with responsive table/cards
- ✅ Advanced filtering (Priority, Segment, State, Account Manager)
- ✅ Search functionality (name, city)
- ✅ Bulk actions (Export, Assign, Update Priority)
- ✅ Detail view with tabs (Opportunities, Contacts, Activity, Details)
- ✅ CRUD operations with validation
- ✅ CSV Import/Export with column aliasing
- ✅ Priority system (A/B/C/D badges)
- ✅ Weekly Priority toggle
- ✅ Account manager assignment
- ✅ Database migrations with RLS
- ✅ Test coverage

**Unfinished Tasks:** None

**Blockers:** None

---

# 3.2 Organizations Module

## List View Features

**Layout:**
- Responsive table/card view (table on desktop/iPad landscape, cards on iPad portrait)
- Columns:
  - Organization Name (primary, bold, linked)
  - Priority (color-coded badge with semantic colors)
  - Segment
  - Primary Account Manager (avatar + name)
  - City, State
  - # Open Opportunities (linked, filtered view)
  - Last Activity Date (relative time: "2 days ago")

**Interactions:**
- Click row → Navigate to detail page
- Hover row → Highlight with subtle elevation change
- Sort by any column (click header)
- Multi-column sort (Shift+Click)

**Filtering:**
- Filter panel (collapsible sidebar on desktop, slide-over on tablet)
- Filters available:
  - **Priority** (multi-select checkboxes with color indicators: A, B, C, D)
  - **Segment** (multi-select dropdown with all segments in database - includes both default + custom)
  - **Account Manager** (searchable multi-select)
  - **State** (multi-select dropdown)
  - **Has Open Opportunities** (toggle: Yes/No/All)
  - **Weekly Priority** (toggle: Yes/No/All)
- Applied filters shown as removable chips above table
- "Clear all filters" button
- Filter presets: "My Accounts", "Priority A", "Weekly Priority"

**Search:**
- Search box above table (within module, not global)
- Searches: Organization Name, City
- Real-time filtering as user types
- Clear button (X) in search field

**Bulk Actions:**
- Select multiple rows via checkboxes
- Actions available:
  - Export to CSV
  - Assign Account Manager
  - Update Priority Level
  - Add to Weekly Priority
- Confirmation modal before applying bulk changes

**Quick Actions (per row):**
- View (eye icon) → Navigate to detail page
- Edit (pencil icon) → Open edit modal/slide-over
- Add Opportunity (plus icon) → Quick create opportunity modal
- Add Contact (user-plus icon) → Quick create contact modal

## Detail View

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Organizations > [Organization Name]             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Organization Summary Card                            │   │
│  │  [Priority Badge] Organization Name                  │   │
│  │  Segment Badge                                       │   │
│  │  ────────────────────────────────────────────────   │   │
│  │  📞 Phone  🔗 LinkedIn                               │   │
│  │  📍 Address (City, State ZIP)                        │   │
│  │  👤 Primary Manager    👤 Secondary Manager          │   │
│  │  ────────────────────────────────────────────────   │   │
│  │  📝 Notes (expandable)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Opportunities] [Contacts] [Activity Feed] [Details] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │  [Tab Content Area]                                  │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Edit Organization Button] [Action Menu ▼]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Opportunities Tab:**
- Sortable table showing all opportunities for this organization
- Columns: Status Badge, Stage Badge, Opportunity Name (linked), Product, Volume, Deal Owner
- Filter by Status/Stage (within tab)
- "Create New Opportunity" button (prominent, primary action)
- Empty state: "No opportunities yet. Create your first opportunity to start tracking sales."

**Contacts Tab:**
- Card grid or list of all contacts
- Each contact card shows: Name, Position, Email (mailto), Phone (tel)
- Quick add contact (inline form or modal)
- Empty state: "No contacts yet. Add your first contact to connect with this organization."

**Activity Feed Tab:**
- Reverse chronological list of all activities related to this organization
- Each activity entry:
  - User avatar and name
  - Activity type icon (phone, email, meeting, etc.)
  - Timestamp (relative: "3 hours ago")
  - Description
  - Linked entities (opportunities, contacts mentioned)
- Filter by activity type (dropdown)
- Date range picker
- Pagination or infinite scroll

**Details Tab:**
- Full organization data in organized sections:
  - **Basic Information**: Name, Priority, Segment
  - **Distribution**: Distributor (if applicable), Distributor Rep Name
  - **Account Management**: Primary/Secondary Account Managers, Weekly Priority
  - **Contact Information**: Phone, LinkedIn, Full Address
  - **Notes**: Rich text field
  - **System Information** (read-only): Created by/date, Updated by/date
- Inline editing where applicable (click field to edit)
- Save/Cancel buttons appear when editing

## Create/Edit Forms

**Form Structure:**
- Modal (on desktop) or slide-over panel (on tablet) for create/edit
- Sections with clear headers and visual separation:

**1. Basic Information**
- Organization Name* (text input, auto-trim whitespace)
- Priority Level* (radio buttons with color indicators: A, B, C, D)
- Segment* (flexible combo box: dropdown with suggestions + ability to type custom value)
  - **Suggested defaults:** Fine Dining, Casual, Gastropub, Ethnic, Pizza, Chain/Group, Distributor, Management Company, Catering
  - **Custom values allowed:** Users can type any segment name not in the default list
  - **Industry pattern:** Follows Salesforce/HubSpot standard for flexible classification fields

**2. Distribution** (collapsible section)
- Distributor (searchable dropdown of Organizations with Segment="Distributor")
- Distributor Rep Name (text input)

**3. Account Management**
- Primary Account Manager (searchable dropdown of Users with role Account Manager/Manager)
- Secondary Account Manager (same as above)
- Weekly Priority (checkbox)

**4. Contact Information**
- Phone (text input with format validation: (XXX) XXX-XXXX or XXX-XXX-XXXX)
- LinkedIn URL (URL input with validation)
- Street Address (text input)
- City (text input)
- State (dropdown: IL, IN, OH, MI, KY, NY, etc.)
- ZIP Code (text input, 5-digit validation)

**5. Notes**
- Multi-line text area (auto-expanding)
- Character count indicator (if limit exists)

**Form Behavior:**
- Required fields marked with red asterisk (*)
- Real-time validation on blur (green checkmark or red error message)
- Unique name validation: "An organization with this name already exists. [View Organization]"
- Auto-save drafts every 30 seconds (indicator: "Draft saved at HH:MM")
- Confirm on cancel if unsaved changes: "You have unsaved changes. Discard changes?"
- Submit button disabled until all required fields valid
- Success toast: "Organization created successfully" with link to view
- Error handling: Display specific error messages near relevant fields

## Import/Export

**CSV Import:**
- Import button in list view toolbar
- Upload CSV file (drag-and-drop or file picker)
- Column mapping interface:
  - Show preview of CSV (first 5 rows)
  - Map CSV columns to Organization fields via dropdowns
  - Detect headers automatically or allow "First row is header" toggle
- Validation report before commit:
  - Show errors (missing required fields, format errors, duplicates)
  - Show warnings (similar names, empty optional fields)
  - Allow user to fix errors or skip rows
- Import progress indicator
- Success summary: "Imported 45 of 50 organizations. 5 skipped due to errors. [View Error Report]"

**CSV Export:**
- Export button in list view toolbar
- Export respects current filters (option to export all or filtered)
- Filename format: `organizations_export_YYYY-MM-DD.csv`
- Columns: All Organization fields in logical order
- Download link or automatic download (browser-dependent)

**Template Download:**
- "Download CSV Template" link
- Provides empty CSV with correct column headers
- Includes sample row with example data and format notes
