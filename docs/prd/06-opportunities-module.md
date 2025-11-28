---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 7 (Pipeline Management) for current requirements. Key change: 7 stages (not 8).

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Opportunities Module ⭐ PRINCIPAL TRACKING (MOST IMPORTANT FEATURE)
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Opportunities table schema and 3-organization tracking
- 🎨 [Design System](./15-design-tokens.md) - Kanban boards, forms, and detail pages
- 🔗 [Organizations Module](./04-organizations-module.md) - Customer/Principal/Distributor relationships
- 🔗 [Contacts Module](./05-contacts-module.md) - Contact associations
- 🔗 [Products Module](./07-products-module.md) - Product associations via junction table
- 📊 [Reports](./09-reports.md) - Opportunities by Principal report
- 🎯 [Activity Tracking](./10-activity-tracking.md) - Stage change logging
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | 🚧 **95%** |
| **Confidence** | 🟢 **HIGH** - Production ready, enterprise features |
| **Files** | 69 total (46 implementation, 23 tests) |
| **CRUD Operations** | ✅ List, Show, Edit, Create all complete |
| **Database Schema** | ✅ 13 migrations, 3 views, full RLS |
| **Validation** | ✅ Comprehensive Zod schemas (234 lines) |
| **Advanced Features** | ✅ Kanban, Quick Add, Multi-view, Export, Bulk Actions |

**Completed Requirements:**
- ✅ Kanban board with drag-and-drop (@hello-pangea/dnd)
- ✅ 8-stage pipeline (new_lead → closed_won/lost)
- ✅ Quick Add dialog for trade show booth lead capture
- ✅ Multi-view switcher (Kanban/List/Campaign-grouped)
- ✅ Principal tracking ⭐ (3-org model: customer/principal/distributor)
- ✅ Products association (post-pricing removal)
- ✅ Advanced filtering with presets (Principal, Status, Stage, Priority, Owner)
- ✅ Bulk actions (Export, Stage update, Archive)
- ✅ Archive/restore functionality
- ✅ Activity timeline with filters
- ✅ Change log with audit trail
- ✅ Campaign and workflow tracking
- ✅ Related opportunities linking
- ✅ Auto-generated opportunity naming
- ✅ Product filtering by principal
- ✅ Database migrations (13 files)
- ✅ Comprehensive validation
- ✅ Strong test coverage (23 test files, 33% of codebase)

**Unfinished Tasks:**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Add `recordRepresentation` to index.ts | ❌ Missing | 🟢 HIGH | 10 min |
| E2E tests for kanban workflows | ❌ Missing | 🟡 MEDIUM | 1 day |

**Details:**
- **recordRepresentation:** Simple 1-line export for consistent UI labels across app
- **E2E tests:** Would improve confidence in full drag-and-drop workflows but not blocking launch

**Blockers:** None

---

# 3.4 Opportunities Module ⭐ PRINCIPAL TRACKING (MOST IMPORTANT FEATURE)

**Critical Business Need:** Track which Principal (brand/manufacturer) each opportunity is for. This is the #1 most important feature for reporting and pipeline management.

## Pipeline View (Kanban Board)

**Visual Design:**
- Horizontal swim lanes for each stage (8 stages):
  1. **New Lead** (Lightest blue) - Initial lead discovery
  2. **Initial Outreach** - First contact attempt
  3. **Sample/Visit Offered** - Offered product sample or site visit
  4. **Awaiting Response** - Waiting for customer feedback
  5. **Feedback Logged** - Customer response received
  6. **Demo Scheduled** - Demo/cookup scheduled
  7. **Closed Won** (Green) - Deal won!
  8. **Closed Lost** (Red) - Deal lost

**Stage Columns:**
- Header: Stage name + count badge
- Example: "New Lead [12]"
- Color-coded background (subtle gradient)
- Scrollable horizontally on smaller screens

**Opportunity Cards:**
```
┌───────────────────────────────────────┐
│ [Priority Badge]  [Owner Avatar]      │
│                                        │
│ Customer Organization Name (primary)   │
│ 🏢 Principal: Brand Name ⭐ KEY       │
│ Opportunity Name                       │
│                                        │
│ 📅 Expected Close: Dec 15, 2025       │
│ 🏷️  Tags: urgent, big-deal            │
└───────────────────────────────────────┘
```

**Key Card Elements:**
- **Priority Badge**: Color-coded (low/medium/high/critical)
- **Principal Name**: ⭐ PROMINENT - this is what we track
- **Customer Organization**: Who the deal is with
- **Tags**: Quick visual categorization

**Interactions:**
- **Drag-and-drop** between stages:
  - Pick up card (click and hold or touch)
  - Visual feedback: Card lifts with shadow, column highlights when hovering
  - Drop in new column
  - Confirmation modal: "Move [Opp Name] from [Old Stage] to [New Stage]?"
    - Optional note field: "Add a note about this stage change"
    - [Cancel] [Confirm] buttons
  - Auto-creates activity log entry on confirm
- **Click card** → Navigate to opportunity detail page
- **Horizontal scroll** on iPad if stages overflow viewport

**Filtering (Critical for Principal Tracking):**
- Filter toolbar above board:
  - **Principal** ⭐ KEY FILTER (searchable multi-select) - Group deals by brand
  - **Status** (multi-select: active, closed, on_hold)
  - **Stage** (multi-select checkboxes)
  - **Priority** (multi-select with color badges: low, medium, high, critical)
  - **Opportunity Owner** (multi-select with avatars)
  - **Customer Organization** (searchable multi-select)
  - **Tags** (multi-select)
- Applied filters shown as chips
- "Clear all" button

**Sorting within Stage:**
- Sort dropdown per column:
  - By Expected Close Date (default)
  - By Priority (critical → low)
  - By Customer Organization Name (A-Z)
  - By Principal Name (A-Z) ⭐

## List View (Table)

**Layout:**
- Comprehensive sortable/filterable table
- Columns:
  - **Priority** (color badge, sortable)
  - **Customer Organization** (linked)
  - **Principal** ⭐ (linked, bold) - MOST IMPORTANT COLUMN
  - **Opportunity Name** (linked)
  - **Status** (colored badge: active=Blue, closed=Gray, on_hold=Yellow)
  - **Stage** (badge with color gradient)
  - **Expected Close Date** (sortable, highlight if past due in red)
  - **Tags** (chips, clickable to filter)
  - **Next Action** (text snippet)
  - **Next Action Date** (sortable, highlight if overdue)
  - **Opportunity Owner** (avatar + name, sortable)
  - **Last Activity** (relative time: "2 days ago", sortable)
- Row hover: Subtle elevation and action icons appear (View, Edit)
- Click row → Navigate to detail page

**Advanced Filtering:**
- Comprehensive filter panel (collapsible sidebar)
- Filters available:
  - **Principal** ⭐ (searchable multi-select) - Filter by brand/manufacturer
  - **Status** (multi-select: active, closed, on_hold)
  - **Stage** (multi-select checkboxes for all 8 stages)
  - **Priority** (multi-select: low, medium, high, critical)
  - **Tags** (multi-select with type-ahead search)
  - **Opportunity Owner** (searchable multi-select)
  - **Customer Organization** (searchable multi-select)
  - **Lead Source** (multi-select: referral, trade_show, website, etc.)
  - **Date Ranges**:
    - Expected Close Date (date range picker)
    - Next Action Date (date range picker)
  - **Has Next Action** (toggle: Yes/No/All)
- Filter logic: AND between filter types, OR within multi-select
- Module-level search: Searches opportunity name, customer org name, principal name

**Saved Filter Views:**
- Preset views available to all users:
  - **"By Principal"** ⭐ (Group by principal, show all opportunities per brand)
  - "My Opportunities" (Current user is owner)
  - "Closing This Month" (Expected close within 30 days)
  - "High Priority" (Priority = high or critical)
  - "Needs Action" (Next action date overdue or today)
  - "Recent Wins" (Stage = closed_won, last 30 days)
- Admin can create system-wide views
- "Save current filters as view" button (future phase)

**Bulk Actions:**
- Select multiple opportunities via checkboxes
- Actions:
  - **Change Status** (bulk status update: active/on_hold/closed with confirmation)
  - **Change Stage** (bulk stage update with confirmation)
  - **Assign Owner** (reassign to another user)
  - **Add Tags** (add tags to selected opportunities)
  - **Export to CSV** (respects current filters, includes Principal column ⭐)
- Bulk action confirmation modal shows count and list of affected opportunities

## Detail View

**Header Section:**
- **Breadcrumb**: Opportunities > [Customer Org] > [Opp Name]
- **Opportunity Name** (large, editable inline)
- **Badges**: [Status Badge] [Stage Badge] [Priority Badge]
- **Actions**: [Edit Button - Opens Modal] [Delete Button]

**Key Information Cards (3-Organization Tracking):**
```
┌──────────────────────────────────────────────────────┐
│ 🏢 Customer Organization: [Restaurant Name] (linked) │
│ ⭐ Principal: [Brand Name] (linked) MOST IMPORTANT   │
│ 📦 Distributor: [Distributor Name] (linked)          │
│ 👤 Opportunity Owner: [User Name] (avatar)           │
│ 📅 Expected Close: Dec 15, 2025 (30 days away)       │
│ 📊 Created: Nov 1, 2025 by Jane Doe                  │
└──────────────────────────────────────────────────────┘
```

**Workflow Management Section:**
- **Tags**: [urgent] [big-deal] [repeat-customer] (chips, clickable)
- **Next Action**: "Follow up call to discuss pricing" (editable inline)
- **Next Action Date**: Nov 10, 2025 (editable, highlights if overdue)
- **Decision Criteria**: "Price and delivery timeline are key factors" (expandable text area)

**Products Section:**
- Table of associated products (M:N relationship via junction table)
- Columns: Product Name, Principal, Notes
- "Add Product" button opens modal to associate more products

**Related Contacts:**
- Card grid of contacts from customer organization
- Quick actions: View, Call, Email (mailto:)

**Activity Timeline:**
- **Quick Add Activity** form at top:
  - Activity Type dropdown (Call, Email, Meeting, Note)
  - Date picker (defaults to today)
  - Description textarea
  - "Log Activity" button
- **Activity Feed** (reverse chronological):
  - User avatar, type icon, timestamp, description
  - "Load more" button if >20 activities

**Change Log Tab (Field-Level Audit Trail) ⭐ CRITICAL:**
- Shows complete history of ALL field changes (old value → new value)
- Format:
  ```
  Nov 3, 2025 2:30 PM - John Smith
    Priority: medium → high
    Stage: new_lead → initial_outreach

  Nov 1, 2025 10:15 AM - Jane Doe
    Created opportunity
  ```
- Filter by: Field name, User, Date range
- Export to CSV
- **Note:** This requires audit_trail table implementation (see ADR-0006)

## Create/Edit Forms

**Form Approach: Side Panel (Material-UI Drawer)**
- Opens as side panel from the right (industry standard for in-context editing)
- Width: 600px on desktop, 80% on iPad
- Overlay backdrop with close on outside click
- Sticky header with form title and close button
- Scrollable content area
- Sticky footer with Save/Cancel buttons
- Sections organized with clear headers

**Form Sections:**

**1. Organizations (3-org tracking) ⭐**
- **Customer Organization*** (searchable dropdown)
  - Who the deal is with (the restaurant/customer)
- **Principal Organization*** (searchable dropdown)
  - ⭐ MOST IMPORTANT: Which brand/manufacturer (Fishpeople, Ocean Hugger, etc.)
- **Distributor Organization** (searchable dropdown, optional)
  - Which distributor (if applicable)

**2. Opportunity Details**
- **Opportunity Name*** (text input with helper text)
  - **Naming Convention Helper Text:**
    ```
    Tips for naming opportunities:
    • Include customer name: "Roka Akor - Tuna Roll Program"
    • For trade shows: "NRA Show 2025 - {Customer} - {Principal}"
    • For multi-location: "Whole Foods - {Principal} - {Region}"
    • For trials: "{Customer} - {Principal} Trial Q1 2025"
    ```
  - **Auto-generate button** (refresh icon) generates name based on:
    - Customer Organization + Principal + Current Quarter/Year
    - Example: "Nobu Miami - Ocean Hugger - Q1 2025"
- **Description** (textarea, 3-4 rows)
- **Status** (dropdown: active [default], closed, on_hold)
- **Stage** (dropdown with flexible transitions allowed):
  - new_lead [default]
  - initial_outreach
  - sample_visit_offered
  - awaiting_response
  - feedback_logged
  - demo_scheduled
  - closed_won
  - closed_lost
  - **Note:** Users can move between any stages (no restrictions)
- **Priority** (radio buttons: low, medium [default], high, critical)

**3. Timeline**
- **Expected Close Date*** (date picker, defaults to today + 90 days)
- **Next Action Date** (date picker, optional)

**4. Workflow Management**
- **Tags** (multi-select with type-ahead, e.g., "urgent", "big-deal")
- **Next Action** (text input, e.g., "Follow up call to discuss pricing")
- **Decision Criteria** (textarea, 2-3 rows, e.g., "Price and delivery timeline")

**5. Contacts**
- **Customer Contacts*** (multi-select dropdown)
  - Filtered by selected Customer Organization
  - At least one contact required
  - Shows: Full Name, Position
  - "Add New Contact" button opens contact creation in modal

**6. Products (Junction Table Pattern)**
- **Associated Products*** (repeatable section)
  - Product dropdown (filtered by selected Principal)
  - Notes field (optional, per product)
  - "Add Product" button to add more products
  - At least one product required
- **Database Implementation:**
  - Junction table: `opportunity_products`
  - Fields: `opportunity_id`, `product_id`, `notes`
  - No quantity/pricing fields (removed per architecture decision)

**7. Ownership & Source**
- **Opportunity Owner*** (user dropdown, defaults to current user)
- **Account Manager** (user dropdown, optional)
- **Lead Source** (dropdown: referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer)

**8. Campaign Grouping (for Trade Shows)**
- **Campaign** (optional searchable dropdown)
  - Used to group related opportunities (e.g., "NRA Show 2025")
  - Allows tracking multiple opportunities from same event
- **Related To** (optional reference to parent opportunity)
  - Links trade show opportunities together

**9. Notes**
- **Notes** (textarea, 4-5 rows, rich text optional for MVP)

**Form Validation:**
- **Required Fields** (marked with *):
  - Customer Organization
  - Principal Organization ⭐
  - Opportunity Name
  - Expected Close Date
  - Opportunity Owner
  - At least one Contact from Customer Organization
  - At least one Product (filtered by Principal)
- **Real-time validation** on blur (inline red error messages)
- **Form-level validation** on submit (scroll to first error)
- **Smart Defaults:**
  - Stage: new_lead
  - Status: active
  - Priority: medium
  - Expected Close Date: today + 90 days
  - Opportunity Owner: current user

**Form Actions:**
- **Save** button (primary, bottom right)
- **Cancel** button (secondary, bottom left)
- If unsaved changes on cancel: "Discard changes?" confirmation

**Success Handling:**
- Modal closes
- Toast notification: "Opportunity '[Name]' created successfully"
- Redirects to opportunity detail page OR returns to list (user preference)
- Option to remain on form for rapid entry: "Add another opportunity" button
- Default behavior: Redirect to opportunity detail page

## Opportunity Actions

**Clone Opportunity:**
- Button in detail view action bar
- Opens create form pre-filled with:
  - Same organization, product, principal, source, deal owner
  - New opportunity name: "[Original Name] - Copy"
  - Reset: Start Date = Today, Status = Open, Stage = Lead-discovery-1
- Use case: Repeat business, similar deals with same customer

**Merge Opportunities:**
- Admin-only feature
- Use case: Duplicate opportunities detected
- Select 2+ opportunities → "Merge" action
- Merge modal:
  - Choose primary opportunity (keeps ID)
  - Select fields to keep from each opportunity
  - Combine notes and activities from all
  - Delete merged opportunities
- Confirmation: "This action cannot be undone. [Cancel] [Merge Opportunities]"

**Archive Opportunity:**
- Soft delete (sets deleted_at timestamp, active=false)
- Available in Action Menu (ellipsis icon)
- Confirmation: "Archive '[Opp Name]'? You can restore it later from archived opportunities. [Cancel] [Archive]"
- Archived opportunities visible in "Archived" filter view
- Restore action available for admins

## Trade Show Handling (Multiple Principals)

**Business Scenario:**
- Trade shows often involve conversations with same customer about multiple principals/brands
- Industry best practice: Create separate opportunities per principal (not combined)
- Enables accurate pipeline tracking per brand

**Implementation Pattern:**
1. **Separate Opportunities per Principal:**
   - Customer meets about Ocean Hugger AND Fishpeople at NRA Show
   - Create TWO opportunities:
     - "NRA Show 2025 - Nobu Miami - Ocean Hugger"
     - "NRA Show 2025 - Nobu Miami - Fishpeople"

2. **Campaign Grouping:**
   - Campaign field links related opportunities (e.g., "NRA Show 2025")
   - Enables filtering/reporting on all opportunities from an event
   - Visual grouping in list view when filtered by campaign

3. **Visual Display:**
   - When viewing campaign-filtered list: Group opportunities in cards/sections by customer
   - Show principal badge prominently on each opportunity
   - Example layout:
     ```
     Campaign: NRA Show 2025
     ┌─────────────────────────────────────┐
     │ Nobu Miami (2 opportunities)        │
     │  • Ocean Hugger - New Lead          │
     │  • Fishpeople - Sample Offered      │
     └─────────────────────────────────────┘
     ```

4. **Booth Visitor Tracking:**
   - Create minimal opportunity for booth visitors
   - Name: "NRA 2025 - {Contact Name} - {Principal}"
   - Can convert to full opportunity later if interest develops

## Multi-Brand Filtering Behavior

**Scenario:** User represents multiple principals and needs focused views

**Filter Implementation (Based on Industry Best Practices):**
1. **"All My Principals" View (Default):**
   - Shows opportunities for all principals user represents
   - No automatic filtering - user sees full pipeline

2. **Principal Filter (Prominent in UI):**
   - Multi-select dropdown at top of list/kanban view
   - Allows focusing on one or more principals
   - Persists during session but resets on page reload

3. **Visual Differentiation:**
   - Principal name shown prominently on every opportunity card/row
   - Optional: Color-coded badges per principal (admin-configurable)

4. **Saved Views per Principal:**
   - Quick filter buttons: "Ocean Hugger Only", "Fishpeople Only", etc.
   - Created by admin, available to all users
   - One-click filtering to specific principal pipeline

5. **Reports by Principal:**
   - All reports include Principal as a grouping option
   - Pipeline report shows separate sections per principal
   - Export includes principal column for pivot table analysis
