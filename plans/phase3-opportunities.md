# Phase 3: Opportunities & Sales Module - Detailed Task Breakdown

**Timeline:** Weeks 5-6 (approximately 55-60 tasks)
**Status:** Building on existing foundation to complete full Opportunities pipeline

## 🎯 CRITICAL PRIORITY: Principal Tracking ⭐

**Principal tracking is the #1 most important feature for this CRM.** Every opportunity MUST be associated with exactly ONE principal (brand/manufacturer). This enables:
- Pipeline reporting by brand
- Multi-brand sales rep workflow
- Trade show opportunity tracking per principal
- Accurate commission/performance tracking

**Testing Coverage:** Principal tracking features should have 90%+ test coverage.

---

## Epic 1: Database Schema & Junction Tables

### E1-S1: Campaign & Trade Show Support

**P3-E1-S1-T1: Add campaign field to opportunities table**
- **Description:** Add `campaign` TEXT field to opportunities table for grouping related opportunities (e.g., "NRA Show 2025")
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Migration creates `campaign` field (TEXT, nullable)
  - Field indexed for filtering performance
  - RLS policies updated if needed
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_add_campaign_field.sql`

**P3-E1-S1-T2: Add related_opportunity_id field for trade show linking**
- **Description:** Add self-referencing FK to link related opportunities (trade show booth visitors to full opportunities)
- **Confidence:** 90%
- **Estimate:** 1.5 hours
- **Prerequisites:** P3-E1-S1-T1
- **Acceptance Criteria:**
  - Migration adds `related_opportunity_id` BIGINT field
  - FK constraint to opportunities.id with ON DELETE SET NULL
  - Index created for query performance
  - Can query "child" opportunities from parent
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_add_related_opportunity_field.sql`

**P3-E1-S1-T3: Update opportunities view to include campaign data**
- **Description:** Add campaign and related_opportunity fields to opportunities_with_orgs view
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** P3-E1-S1-T1, P3-E1-S1-T2
- **Acceptance Criteria:**
  - View includes campaign field
  - View includes related_opportunity_id and related opportunity name
  - Data provider can fetch campaign data
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_update_opportunities_view_campaign.sql`

### E1-S2: Opportunity-Contacts Junction Table

**P3-E1-S2-T1: Create opportunity_contacts junction table**
- **Description:** Replace contact_ids array with proper M:N junction table
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Table structure: id, opportunity_id, contact_id, is_primary, created_at
  - Unique constraint on (opportunity_id, contact_id)
  - RLS policies for authenticated users
  - Indexes on both FK columns
  - Trigger for updated_at
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_create_opportunity_contacts_table.sql`

**P3-E1-S2-T2: Migrate existing contact_ids to junction table**
- **Description:** Data migration from contact_ids BIGINT[] to opportunity_contacts table
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E1-S2-T1
- **Acceptance Criteria:**
  - Migration script safely handles existing data
  - First contact in array becomes is_primary=true
  - All existing associations preserved
  - Rollback script provided
  - No data loss verified
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_migrate_contact_ids_to_junction.sql`

**P3-E1-S2-T3: Drop contact_ids array column**
- **Description:** Remove deprecated contact_ids column after migration verification
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** P3-E1-S2-T2 (manual verification needed)
- **Acceptance Criteria:**
  - Column dropped from opportunities table
  - Validation schema updated
  - No UI components reference old field
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_drop_contact_ids_column.sql`

### E1-S3: Enhanced Opportunity Fields

**P3-E1-S3-T1: Add notes field to opportunities**
- **Description:** Add TEXT field for general opportunity notes (separate from activity log)
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Migration adds notes TEXT field (nullable)
  - Field included in opportunities view
  - Search tsv includes notes content
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_add_opportunity_notes.sql`

---

## Epic 2: Kanban Board with Drag-and-Drop

### E2-S1: Drag-and-Drop Library Research & Setup

**P3-E2-S1-T1: SPIKE - Evaluate drag-and-drop libraries** ✅
- **Description:** Research and evaluate dnd-kit vs react-beautiful-dnd vs react-dnd
- **Confidence:** 85% (spike completed, clear recommendation)
- **Estimate:** 3 hours (completed)
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Document pros/cons of each library
  - ✅ Performance benchmarks with 100+ cards
  - ✅ Accessibility evaluation (keyboard navigation)
  - ✅ Touch device support verified
  - ✅ Recommendation with rationale
- **Recommendation:** dnd-kit (modern, accessible, React 19 compatible, touch optimized)
- **Files:**
  - ✅ `docs/spikes/2024-11-03-drag-drop-library-evaluation.md`

**P3-E2-S1-T2: Install and configure dnd-kit**
- **Description:** Add dnd-kit dependencies and create base drag-drop context
- **Confidence:** 90%
- **Estimate:** 1 hour
- **Prerequisites:** P3-E2-S1-T1
- **Acceptance Criteria:**
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` installed
  - DndContext wrapper created
  - Basic sensors configured (mouse, touch, keyboard)
  - TypeScript types configured
- **Files:**
  - `package.json`
  - `src/atomic-crm/opportunities/dnd/DndContext.tsx`

### E2-S2: Kanban Board Layout

**P3-E2-S2-T1: Create KanbanBoard container component**
- **Description:** Main container for horizontal stage columns with scroll
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S1-T2
- **Acceptance Criteria:**
  - Horizontal layout with flex/grid
  - Horizontal scroll on overflow
  - iPad-optimized touch targets
  - Responsive breakpoints defined
  - Empty state handling
- **Files:**
  - `src/atomic-crm/opportunities/KanbanBoard.tsx`
  - `src/atomic-crm/opportunities/KanbanBoard.test.tsx`

**P3-E2-S2-T2: Create KanbanColumn component**
- **Description:** Individual stage column with header, count badge, and card list
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S2-T1
- **Acceptance Criteria:**
  - Stage name header with color gradient
  - Count badge shows opportunity count
  - Droppable area implementation
  - Loading skeleton state
  - Color-coded backgrounds (per PRD stage colors)
- **Files:**
  - `src/atomic-crm/opportunities/KanbanColumn.tsx`
  - `src/atomic-crm/opportunities/KanbanColumn.test.tsx`

**P3-E2-S2-T3: Enhance OpportunityCard for Kanban view**
- **Description:** Update existing OpportunityCard with draggable functionality and prominent Principal display
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E2-S2-T2
- **Acceptance Criteria:**
  - ⭐ Principal name displayed prominently (bold, icon)
  - Priority badge color-coded
  - Owner avatar displayed
  - Expected close date formatted
  - Tags displayed as chips
  - Draggable with visual feedback (shadow, lift effect)
  - Click navigates to detail page
  - Touch-optimized for iPad
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityCard.tsx` (update existing)
  - `src/atomic-crm/opportunities/OpportunityCard.test.tsx` (update)

### E2-S3: Drag-and-Drop Logic

**P3-E2-S3-T1: Implement drag handlers in KanbanBoard**
- **Description:** Handle onDragStart, onDragOver, onDragEnd events
- **Confidence:** 70% (complex state management)
- **Estimate:** 4 hours
- **Prerequisites:** P3-E2-S2-T3
- **Acceptance Criteria:**
  - Visual feedback during drag (card lifts, column highlights)
  - Prevent drop on same column
  - Smooth animations (200ms transitions)
  - Error handling for failed drops
  - Optimistic UI updates
  - Rollback on error
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useDragAndDrop.ts`
  - `src/atomic-crm/opportunities/hooks/useDragAndDrop.test.ts`

**P3-E2-S3-T2: Create stage change confirmation modal**
- **Description:** Modal asks for confirmation + optional note when moving stages
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S3-T1
- **Acceptance Criteria:**
  - Modal shows old stage → new stage
  - Optional note textarea (max 500 chars)
  - Cancel reverts card position
  - Confirm updates database
  - Creates activity log entry
  - Toast notification on success
- **Files:**
  - `src/atomic-crm/opportunities/StageChangeModal.tsx`
  - `src/atomic-crm/opportunities/StageChangeModal.test.tsx`

**P3-E2-S3-T3: Implement backend stage update with activity logging**
- **Description:** Update opportunity stage via data provider and log activity
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S3-T2
- **Acceptance Criteria:**
  - Update opportunity.stage and stage_manual=true
  - Create activity log entry (type: Stage Change)
  - Include note from modal if provided
  - Atomic transaction (both or neither)
  - Return updated opportunity data
- **Files:**
  - `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (extend update method)
  - `src/atomic-crm/opportunities/opportunityService.ts` (new)

### E2-S4: Kanban Filtering & Sorting

**P3-E2-S4-T1: Create KanbanFilterToolbar component**
- **Description:** ⭐ Principal filter (most important) + status, priority, owner, customer, tags filters
- **Confidence:** 85%
- **Estimate:** 4 hours
- **Prerequisites:** P3-E2-S2-T1
- **Acceptance Criteria:**
  - ⭐ Principal multi-select (searchable) - TOP POSITION
  - Status multi-select
  - Priority multi-select with color badges
  - Owner multi-select with avatars
  - Customer organization searchable multi-select
  - Tags multi-select
  - Applied filters shown as chips
  - "Clear all" button
  - Filters persist in URL query params
- **Files:**
  - `src/atomic-crm/opportunities/KanbanFilterToolbar.tsx`
  - `src/atomic-crm/opportunities/KanbanFilterToolbar.test.tsx`

**P3-E2-S4-T2: Implement per-column sorting dropdown**
- **Description:** Sort dropdown in each column header
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S2-T2
- **Acceptance Criteria:**
  - Sort options: Expected Close Date (default), Priority, Customer Org Name, ⭐ Principal Name
  - Applies to column only (independent sorting per stage)
  - Persists in local state (not URL)
  - Smooth re-rendering
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useKanbanSort.ts`

**P3-E2-S4-T3: Integrate filters with data fetching**
- **Description:** Apply filters to opportunities query in Kanban view
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E2-S4-T1
- **Acceptance Criteria:**
  - Filters passed to data provider getList
  - AND logic between filter types
  - OR logic within multi-selects
  - Loading states during filter changes
  - Empty state when no results
  - Performance: < 500ms for 1000 opportunities
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useKanbanData.ts`

---

## Epic 3: Campaign Grouping & Trade Show Workflow

### E3-S1: Campaign Management

**P3-E3-S1-T1: SPIKE - Campaign grouping data model**
- **Description:** Design approach for campaign grouping (simple TEXT field vs separate campaigns table)
- **Confidence:** 60% (architecture decision)
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Evaluate TEXT field approach (simple, flexible)
  - Evaluate separate campaigns table (normalized, structured)
  - Consider future campaign reporting needs
  - Document recommendation with pros/cons
- **Recommendation:** Start with TEXT field (simpler MVP), migrate to table if needed
- **Files:**
  - `docs/spikes/campaign-grouping-design.md`

**P3-E3-S1-T2: Add campaign field to OpportunityInputs form**
- **Description:** Add campaign text input with autocomplete from existing campaigns
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E1-S1-T1, P3-E3-S1-T1
- **Acceptance Criteria:**
  - Text input with autocomplete (fetches distinct campaign values)
  - Optional field (not required)
  - Helper text explains usage ("Group related opportunities, e.g., NRA Show 2025")
  - Validation: max 100 chars
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.tsx` (update)
  - `src/atomic-crm/validation/opportunities.ts` (update)

**P3-E3-S1-T3: Create campaign filter in list/kanban views**
- **Description:** Add campaign multi-select filter to opportunities list and Kanban
- **Confidence:** 90%
- **Estimate:** 1.5 hours
- **Prerequisites:** P3-E3-S1-T2
- **Acceptance Criteria:**
  - Filter fetches distinct campaign values
  - Multi-select with search
  - Shows opportunity count per campaign
  - Works in both list and Kanban views
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityListContent.tsx` (update filters)
  - `src/atomic-crm/opportunities/KanbanFilterToolbar.tsx` (update)

**P3-E3-S1-T4: Create "Campaign View" grouped list**
- **Description:** Special list view that groups opportunities by campaign, then by customer
- **Confidence:** 65% (complex UI layout)
- **Estimate:** 4 hours
- **Prerequisites:** P3-E3-S1-T3
- **Acceptance Criteria:**
  - Accordion/expansion panels per campaign
  - Within campaign: group by customer organization
  - Shows principal badge for each opportunity
  - Example: "NRA 2025" → "Nobu Miami (2)" → [Ocean Hugger opp, Fishpeople opp]
  - Click opportunity navigates to detail
  - Export to CSV maintains grouping structure
- **Files:**
  - `src/atomic-crm/opportunities/CampaignGroupedList.tsx`
  - `src/atomic-crm/opportunities/CampaignGroupedList.test.tsx`

### E3-S2: Trade Show Opportunity Linking

**P3-E3-S2-T1: Add related_opportunity field to OpportunityInputs**
- **Description:** Add optional "Related To" dropdown to link opportunities (parent-child relationship)
- **Confidence:** 80%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E1-S1-T2
- **Acceptance Criteria:**
  - Searchable dropdown of existing opportunities
  - Optional field
  - Prevents circular references (validation)
  - Helper text: "Link this opportunity to a related parent opportunity"
  - Shows related opportunity name on detail page
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.tsx` (update)
  - `src/atomic-crm/validation/opportunities.ts` (add circular reference check)

**P3-E3-S2-T2: Display related opportunities section on detail page**
- **Description:** Show parent opportunity and child opportunities on OpportunityShow
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E3-S2-T1
- **Acceptance Criteria:**
  - "Related Opportunities" card shows parent (if exists)
  - Shows list of child opportunities (if any)
  - Links navigate to related opportunity details
  - Shows principal badge for each
  - Shows stage and status badges
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update)
  - `src/atomic-crm/opportunities/RelatedOpportunitiesCard.tsx` (new)

**P3-E3-S2-T3: Create "Quick Add Booth Visitor" workflow**
- **Description:** Quick create minimal opportunity for trade show booth visitors
- **Confidence:** 70% (new workflow pattern)
- **Estimate:** 3 hours
- **Prerequisites:** P3-E3-S2-T1
- **Acceptance Criteria:**
  - "Add Booth Visitor" button on campaign-filtered views
  - Simplified form: contact name, organization, principal, campaign (pre-filled)
  - Auto-generates name: "{Campaign} - {Contact} - {Principal}"
  - Stage = new_lead, minimal required fields
  - Can be expanded to full opportunity later
- **Files:**
  - `src/atomic-crm/opportunities/QuickAddBoothVisitor.tsx`
  - `src/atomic-crm/opportunities/QuickAddBoothVisitor.test.tsx`

---

## Epic 4: Products Module Enhancement

### E4-S1: Product-Principal Filtering

**P3-E4-S1-T1: Add principal field index to products**
- **Description:** Ensure principal field is indexed for fast filtering
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Index on products.principal
  - Query plan shows index usage
  - Fast filtering by principal (< 50ms for 1000 products)
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_index_products_principal.sql`

**P3-E4-S1-T2: Update product dropdown in OpportunityInputs to filter by principal**
- **Description:** ⭐ CRITICAL - Products filtered by selected principal organization
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E4-S1-T1
- **Acceptance Criteria:**
  - ⭐ Product dropdown ONLY shows products matching selected principal
  - Dropdown disabled until principal selected
  - If principal changes, clear selected products that don't match
  - Confirmation modal if products would be removed
  - Helper text: "Select principal first to see available products"
  - High test coverage (90%+)
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.tsx` (update products section)
  - `src/atomic-crm/opportunities/hooks/useFilteredProducts.ts` (new)
  - `src/atomic-crm/opportunities/hooks/useFilteredProducts.test.ts`

**P3-E4-S1-T3: Add principal column to products list view**
- **Description:** Show principal prominently in products table
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Principal column added (sortable, filterable)
  - Bold text styling
  - Links to organization detail page
  - CSV export includes principal
- **Files:**
  - `src/atomic-crm/products/ProductListContent.tsx` (update)

### E4-S2: Opportunity-Products Junction UI

**P3-E4-S2-T1: Create ProductAssociationList component**
- **Description:** Repeatable products section in opportunity form (ArrayInput pattern)
- **Confidence:** 80%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E4-S1-T2
- **Acceptance Criteria:**
  - ArrayInput with SimpleFormIterator for products
  - Each row: product dropdown (filtered by principal) + notes field
  - Add/remove product rows
  - At least one product required (validation)
  - Notes field: textarea, optional, max 500 chars
- **Files:**
  - `src/atomic-crm/opportunities/ProductAssociationList.tsx`
  - `src/atomic-crm/opportunities/ProductAssociationList.test.tsx`

**P3-E4-S2-T2: Display products table on OpportunityShow**
- **Description:** Show associated products with notes on opportunity detail page
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E4-S2-T1
- **Acceptance Criteria:**
  - Table columns: Product Name, Principal, Notes
  - Product name links to product detail page
  - "Add Product" button opens modal to add more
  - Remove button per row (with confirmation)
  - Shows empty state if no products
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update products section)
  - `src/atomic-crm/opportunities/ProductsTable.tsx` (new)

**P3-E4-S2-T3: Implement opportunity_products sync in data provider**
- **Description:** Handle create/update/delete of junction table records
- **Confidence:** 75% (complex transaction logic)
- **Estimate:** 4 hours
- **Prerequisites:** P3-E4-S2-T1
- **Acceptance Criteria:**
  - Create: Insert junction records for all products
  - Update: Diff existing vs new products (add/remove as needed)
  - Delete opportunity: Cascade deletes junction records (already in schema)
  - Atomic transactions (all or nothing)
  - Handles errors gracefully
  - Existing diffProducts utility used (already implemented)
- **Files:**
  - `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (update)
  - `src/atomic-crm/opportunities/diffProducts.ts` (already exists - verify usage)

---

## Epic 5: Opportunity Auto-Generate Name

### E5-S1: Name Generation Logic

**P3-E5-S1-T1: Implement auto-generate name function**
- **Description:** Generate opportunity name from customer + principal + quarter/year
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Format: "{Customer Name} - {Principal Name} - Q{quarter} {year}"
  - Example: "Nobu Miami - Ocean Hugger - Q1 2025"
  - Handles missing data gracefully
  - Quarter calculated from current date
  - Year from current date
  - Max length: 200 chars (truncate if needed)
- **Files:**
  - `src/atomic-crm/opportunities/utils/generateOpportunityName.ts`
  - `src/atomic-crm/opportunities/utils/generateOpportunityName.test.ts`

**P3-E5-S1-T2: Add auto-generate button to OpportunityInputs**
- **Description:** Refresh icon button next to name field triggers auto-generation
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E5-S1-T1
- **Acceptance Criteria:**
  - Button only enabled when customer + principal selected
  - Click populates name field (doesn't submit form)
  - User can edit generated name
  - Helper text explains naming convention
  - Tooltip on button: "Generate name from customer and principal"
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.tsx` (update name field section)
  - `src/atomic-crm/opportunities/hooks/useAutoGenerateName.ts` (already exists - extend)

**P3-E5-S1-T3: Add naming convention helper text to form**
- **Description:** Display helper text with naming tips below name field
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Helper text shows tips (per PRD guidelines)
  - Examples: "Roka Akor - Tuna Roll Program"
  - Trade show example: "NRA Show 2025 - {Customer} - {Principal}"
  - Collapsible section (initially hidden, "Show tips" link)
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.tsx` (update)
  - `src/atomic-crm/opportunities/NamingConventionHelp.tsx` (new)

---

## Epic 6: List View Enhancements

### E6-S1: Principal Column Enhancement

**P3-E6-S1-T1: Make principal column prominent in OpportunityRowListView**
- **Description:** ⭐ Update principal column styling - bold, larger font, prominent position
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ⭐ Principal column in 3rd position (after Priority, Customer Org)
  - Bold font weight
  - Icon prefix (building/brand icon)
  - Links to organization detail page
  - Sortable and filterable
  - High contrast color
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityRowListView.tsx` (update)

**P3-E6-S1-T2: Add principal filter to OpportunityList filters**
- **Description:** ⭐ Principal multi-select filter in list view (prominent position)
- **Confidence:** 90%
- **Estimate:** 1.5 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ⭐ Principal filter at TOP of filter panel
  - Searchable multi-select
  - Shows count of opportunities per principal
  - Persists in URL query params
  - Works with other filters (AND logic)
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityListContent.tsx` (update filters)

### E6-S2: Saved Filter Views

**P3-E6-S2-T1: Create "By Principal" saved view**
- **Description:** ⭐ Preset view groups opportunities by principal
- **Confidence:** 70% (new grouping pattern)
- **Estimate:** 3 hours
- **Prerequisites:** P3-E6-S1-T2
- **Acceptance Criteria:**
  - ⭐ "By Principal" button in view switcher
  - Groups list by principal organization
  - Shows count per principal
  - Expandable sections per principal
  - Sortable within group
- **Files:**
  - `src/atomic-crm/opportunities/views/ByPrincipalView.tsx`
  - `src/atomic-crm/opportunities/OpportunityList.tsx` (add view option)

**P3-E6-S2-T2: Create "My Opportunities" saved view**
- **Description:** Filter to current user's opportunities
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** None
- **Acceptance Criteria:**
  - "My Opportunities" button in toolbar
  - Filters to opportunity_owner_id = current user
  - Shows count in badge
  - Can combine with other filters
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityList.tsx` (add filter preset)

**P3-E6-S2-T3: Create additional preset views**
- **Description:** Add preset views: "Closing This Month", "High Priority", "Needs Action", "Recent Wins"
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E6-S2-T2
- **Acceptance Criteria:**
  - "Closing This Month": estimated_close_date within 30 days
  - "High Priority": priority IN (high, critical)
  - "Needs Action": next_action_date <= today OR overdue
  - "Recent Wins": stage=closed_won AND updated_at within 30 days
  - All views show count badges
- **Files:**
  - `src/atomic-crm/opportunities/filterPresets.ts` (new)
  - `src/atomic-crm/opportunities/OpportunityList.tsx` (integrate presets)

### E6-S3: Bulk Actions

**P3-E6-S3-T1: Add bulk selection checkboxes to list view**
- **Description:** Row checkboxes + "Select all" header checkbox
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Checkbox column (first position)
  - Select all checkbox in header
  - Shows count of selected: "3 opportunities selected"
  - Clear selection button
  - Persists during pagination
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityListContent.tsx` (update)
  - `src/atomic-crm/opportunities/hooks/useBulkSelection.ts` (new)

**P3-E6-S3-T2: Implement bulk actions toolbar**
- **Description:** Action bar appears when items selected: Change Status, Change Stage, Assign Owner, Add Tags
- **Confidence:** 85%
- **Estimate:** 4 hours
- **Prerequisites:** P3-E6-S3-T1
- **Acceptance Criteria:**
  - Toolbar appears above table when items selected
  - Actions: Change Status, Change Stage, Assign Owner, Add Tags
  - Each action opens confirmation modal
  - Shows list of affected opportunities
  - Executes bulk update via data provider
  - Toast shows success/failure count
- **Files:**
  - `src/atomic-crm/opportunities/BulkActionsToolbar.tsx`
  - `src/atomic-crm/opportunities/BulkActionsToolbar.test.tsx`

**P3-E6-S3-T3: Add bulk export to CSV**
- **Description:** Export selected opportunities (or all filtered) to CSV
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E6-S3-T1
- **Acceptance Criteria:**
  - ⭐ CSV includes Principal column (prominent position)
  - Export button in bulk actions toolbar
  - Exports selected OR all filtered (if none selected)
  - Filename: `opportunities_export_YYYY-MM-DD.csv`
  - Columns match PRD spec
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useExportOpportunities.ts`

---

## Epic 7: Detail View Enhancements

### E7-S1: Enhanced Header Section

**P3-E7-S1-T1: Update OpportunityShow header with 3-org display**
- **Description:** Show customer, ⭐ principal, and distributor organizations prominently
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Card layout with icons
  - ⭐ Principal displayed prominently (bold, star icon, "MOST IMPORTANT" tooltip)
  - Customer organization linked
  - Distributor organization linked (if present)
  - Owner with avatar
  - Expected close date with days-away calculation
  - Created date and creator
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update header)
  - `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` (new)

**P3-E7-S1-T2: Add workflow management section**
- **Description:** Display and inline-edit tags, next action, next action date, decision criteria
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Tags displayed as chips (clickable to filter)
  - Next action inline editable
  - Next action date inline editable with date picker
  - Highlights overdue dates in red
  - Decision criteria expandable text area
  - All fields save on blur
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update)
  - `src/atomic-crm/opportunities/WorkflowManagementSection.tsx` (new)

### E7-S2: Activity Timeline

**P7-E7-S2-T1: Enhance activity timeline with quick add form**
- **Description:** Add quick log activity form at top of timeline
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Form at top of activity feed
  - Fields: activity type (dropdown), date (default today), description (textarea)
  - "Log Activity" button
  - Creates activity and refreshes feed
  - Activity types: Call, Email, Meeting, Note, Sample Delivered, Demo
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update activity section)
  - `src/atomic-crm/opportunities/QuickActivityForm.tsx` (new)

**P3-E7-S2-T2: Add activity filtering to timeline**
- **Description:** Filter activity timeline by type, date range, user
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P7-E7-S2-T1
- **Acceptance Criteria:**
  - Filter by activity type (multi-select)
  - Date range picker
  - Filter by user (multi-select)
  - "Show stage changes only" toggle
  - Filters apply without page reload
- **Files:**
  - `src/atomic-crm/opportunities/ActivityTimelineFilters.tsx`

### E7-S3: Change Log / Audit Trail

**P3-E7-S3-T1: SPIKE - Audit trail implementation approach**
- **Description:** Research approach for field-level change tracking (triggers vs application-level)
- **Confidence:** 60% (architecture decision)
- **Estimate:** 3 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Evaluate PostgreSQL triggers approach (automatic, reliable)
  - Evaluate application-level approach (flexible, easier debugging)
  - Consider ADR-0006 recommendations
  - Storage implications (JSONB for old/new values)
  - Query performance for 10k+ changes
  - Document recommendation
- **Files:**
  - `docs/spikes/audit-trail-implementation.md`

**P3-E7-S3-T2: Create audit_trail table**
- **Description:** Table for field-level change tracking
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E7-S3-T1
- **Acceptance Criteria:**
  - Table structure: id, entity_type, entity_id, field_name, old_value, new_value, changed_by, changed_at
  - Indexes on entity and changed_at
  - RLS policies for authenticated users
  - JSONB columns for values (handle any data type)
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_create_audit_trail_table.sql`

**P3-E7-S3-T3: Implement audit trail triggers for opportunities**
- **Description:** PostgreSQL trigger captures field changes on UPDATE
- **Confidence:** 75% (complex trigger logic)
- **Estimate:** 4 hours
- **Prerequisites:** P3-E7-S3-T2
- **Acceptance Criteria:**
  - Trigger fires on UPDATE of opportunities
  - Captures old vs new values for tracked fields
  - Excludes updated_at, search_tsv (noise)
  - Includes user_id from auth.uid()
  - Performance: < 50ms overhead per update
  - Handles NULL values correctly
- **Files:**
  - `supabase/migrations/YYYYMMDDHHMMSS_add_opportunities_audit_trigger.sql`

**P3-E7-S3-T4: Create ChangeLog tab component**
- **Description:** Display audit trail in separate tab on OpportunityShow
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E7-S3-T3
- **Acceptance Criteria:**
  - Tab labeled "Change Log"
  - Reverse chronological order
  - Format: "Field: old value → new value"
  - Groups changes by timestamp + user
  - Filter by field name, user, date range
  - Export to CSV
  - Pagination (50 per page)
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (add tab)
  - `src/atomic-crm/opportunities/ChangeLogTab.tsx` (new)

---

## Epic 8: Testing & Documentation

### E8-S1: Unit Tests

**P3-E8-S1-T1: ⭐ Write tests for principal filtering**
- **Description:** High-coverage tests for principal-based product filtering
- **Confidence:** 95%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E4-S1-T2
- **Acceptance Criteria:**
  - Test: Products filtered when principal selected
  - Test: Products cleared when principal changed
  - Test: Confirmation modal when products would be removed
  - Test: Dropdown disabled until principal selected
  - Coverage: 95%+ for useFilteredProducts hook
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useFilteredProducts.test.ts`

**P3-E8-S1-T2: Write tests for drag-and-drop logic**
- **Description:** Test drag handlers, stage changes, confirmation modal
- **Confidence:** 85%
- **Estimate:** 4 hours
- **Prerequisites:** P3-E2-S3-T2
- **Acceptance Criteria:**
  - Test: Drag within same column does nothing
  - Test: Drag to different column shows modal
  - Test: Cancel reverts card position
  - Test: Confirm updates stage and creates activity
  - Test: Error handling and rollback
  - Coverage: 85%+
- **Files:**
  - `src/atomic-crm/opportunities/hooks/useDragAndDrop.test.ts`
  - `src/atomic-crm/opportunities/StageChangeModal.test.tsx`

**P3-E8-S1-T3: Write tests for campaign grouping**
- **Description:** Test campaign-grouped list view
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E3-S1-T4
- **Acceptance Criteria:**
  - Test: Opportunities grouped by campaign
  - Test: Within campaign, grouped by customer
  - Test: Principal badges displayed
  - Test: Expand/collapse functionality
  - Coverage: 80%+
- **Files:**
  - `src/atomic-crm/opportunities/CampaignGroupedList.test.tsx`

**P3-E8-S1-T4: Write tests for auto-generate name**
- **Description:** Comprehensive tests for name generation logic
- **Confidence:** 95%
- **Estimate:** 1.5 hours
- **Prerequisites:** P3-E5-S1-T1
- **Acceptance Criteria:**
  - Test: Correct format with all fields
  - Test: Handles missing customer/principal
  - Test: Quarter calculation correct
  - Test: Truncates at 200 chars
  - Coverage: 100%
- **Files:**
  - `src/atomic-crm/opportunities/utils/generateOpportunityName.test.ts`

### E8-S2: Integration Tests

**P3-E8-S2-T1: ⭐ E2E test: Create opportunity with principal and products**
- **Description:** Full workflow test from creation to viewing
- **Confidence:** 80%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E4-S2-T3
- **Acceptance Criteria:**
  - Test: Select principal organization
  - Test: Product dropdown filters correctly
  - Test: Add multiple products with notes
  - Test: Submit creates opportunity and junction records
  - Test: Detail page displays products correctly
  - Uses Playwright or Vitest browser mode
- **Files:**
  - `tests/e2e/opportunities/create-with-products.spec.ts`

**P3-E8-S2-T2: E2E test: Kanban drag-and-drop workflow**
- **Description:** Test full drag-drop-confirm-activity cycle
- **Confidence:** 75%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E2-S3-T3
- **Acceptance Criteria:**
  - Test: Drag card between columns
  - Test: Confirmation modal appears
  - Test: Add note and confirm
  - Test: Card updates in new column
  - Test: Activity log entry created
  - Test: Stage updated in database
- **Files:**
  - `tests/e2e/opportunities/kanban-drag-drop.spec.ts`

**P3-E8-S2-T3: E2E test: Campaign grouping workflow**
- **Description:** Test creating multiple opportunities for trade show
- **Confidence:** 75%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E3-S1-T4
- **Acceptance Criteria:**
  - Test: Create 2 opportunities with same campaign, different principals
  - Test: Filter by campaign
  - Test: View campaign-grouped list
  - Test: Opportunities grouped correctly by customer
- **Files:**
  - `tests/e2e/opportunities/campaign-workflow.spec.ts`

### E8-S3: Documentation

**P3-E8-S3-T1: Document principal tracking workflows**
- **Description:** ⭐ User-facing docs explaining principal tracking importance
- **Confidence:** 95%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - Explain what principal means (brand/manufacturer)
  - Why every opportunity needs ONE principal
  - How to filter by principal
  - Trade show workflow with multiple principals
  - Screenshots of principal field in UI
- **Files:**
  - `docs/user/principal-tracking.md`

**P3-E8-S3-T2: Document trade show opportunity workflow**
- **Description:** Step-by-step guide for trade show data entry
- **Confidence:** 95%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E3-S2-T3
- **Acceptance Criteria:**
  - How to use campaign field
  - Creating separate opportunities per principal
  - Quick add booth visitor workflow
  - Converting booth visitor to full opportunity
  - Viewing all opportunities from a trade show
  - Screenshots and examples
- **Files:**
  - `docs/user/trade-show-workflow.md`

**P3-E8-S3-T3: Update architecture docs for junction tables**
- **Description:** Document opportunity_products and opportunity_contacts patterns
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** P3-E1-S2-T3, P3-E4-S2-T3
- **Acceptance Criteria:**
  - Update CLAUDE.md with junction table patterns
  - Document sync logic in data provider
  - Example code snippets
  - Migration notes
- **Files:**
  - `CLAUDE.md` (update)
  - `docs/architecture/junction-tables.md` (new)

---

## Summary Statistics

### Task Breakdown by Epic
- **Epic 1 (Database):** 7 tasks, ~9 hours
- **Epic 2 (Kanban):** 12 tasks, ~30 hours
- **Epic 3 (Campaign):** 7 tasks, ~20 hours
- **Epic 4 (Products):** 6 tasks, ~15 hours
- **Epic 5 (Auto-Name):** 3 tasks, ~4.5 hours
- **Epic 6 (List View):** 9 tasks, ~17 hours
- **Epic 7 (Detail View):** 8 tasks, ~21 hours
- **Epic 8 (Testing):** 9 tasks, ~22.5 hours

**Total: 61 tasks, ~139 hours (~3.5 weeks with 2 developers)**

### Confidence Distribution
- **High Confidence (90-100%):** 32 tasks (52%)
- **Medium Confidence (80-89%):** 19 tasks (31%)
- **Lower Confidence (60-79%):** 10 tasks (17%)

### Critical Path Tasks (Must Complete First)
1. P3-E1-S1-T1: Add campaign field
2. P3-E1-S1-T2: Add related_opportunity_id
3. P3-E1-S2-T1: Create opportunity_contacts junction
4. P3-E2-S1-T1: Drag-drop library spike
5. P3-E4-S1-T2: ⭐ Products filtered by principal
6. P3-E7-S3-T1: Audit trail spike

### Risk Areas (Lower Confidence)
1. **Drag-and-drop implementation (70%):** Complex state management, need thorough testing
2. **Campaign grouping UI (65%):** New UI pattern, may need design iteration
3. **Trade show workflow (70%):** Business logic needs validation with users
4. **Audit trail (75%):** Trigger performance impact needs monitoring
5. **Bulk actions (85%):** Transaction handling for large batches

### Testing Coverage Goals
- **Principal tracking:** 90%+ coverage (highest priority)
- **Drag-and-drop:** 85%+ coverage
- **Junction tables:** 85%+ coverage
- **Campaign grouping:** 80%+ coverage
- **Overall Phase 3 code:** 80%+ coverage

---

## Dependencies & Prerequisites

### External Libraries Needed
- `@dnd-kit/core` - Drag and drop core
- `@dnd-kit/sortable` - Sortable list support
- `@dnd-kit/utilities` - Utility functions

### Existing Features Required
- ✅ Organizations module (completed)
- ✅ Contacts module (completed)
- ✅ Products module (basic - completed)
- ✅ opportunity_products junction table (exists)
- ✅ Basic opportunities CRUD (exists)
- ✅ Activity log table and component (exists)

### Database Migrations Required
- Campaign field
- Related opportunity field
- opportunity_contacts junction table
- Contact_ids migration
- Audit trail table
- Indexes for performance

---

## Success Criteria

### Phase 3 Complete When:
1. ⭐ **Principal tracking fully functional** (highest priority)
   - Every opportunity has a principal
   - Products filter by principal
   - Principal prominent in all views
   - "By Principal" reports work
   - 90%+ test coverage

2. **Kanban board operational**
   - Drag-and-drop between stages works
   - Stage changes create activity logs
   - Filters work (especially principal filter)
   - Performance acceptable (< 500ms render for 1000 opps)

3. **Trade show workflow complete**
   - Campaign grouping works
   - Related opportunities link correctly
   - Quick add booth visitor functional
   - Campaign-grouped list view works

4. **Junction tables working**
   - opportunity_products sync reliable
   - opportunity_contacts migration complete
   - No data loss or integrity issues

5. **Testing coverage met**
   - 90%+ for principal features
   - 85%+ for drag-drop
   - 80%+ for junction tables
   - All E2E tests passing

---

## Notes for Implementation

### Key Architecture Decisions
1. **Campaign Field:** Using TEXT field (simple) instead of separate campaigns table (defer normalization)
2. **Drag-Drop Library:** Recommend dnd-kit for React 19 compatibility and accessibility
3. **Audit Trail:** Recommend PostgreSQL triggers for reliability (evaluate in spike)
4. **Junction Tables:** Leverage existing diffProducts pattern for opportunity_products

### Performance Considerations
- Kanban board: Virtualize if > 200 cards in single column
- Filters: Debounce filter changes (300ms)
- Products dropdown: Lazy load if > 1000 products
- Audit trail: Partition table if > 100k records

### Accessibility Requirements
- Kanban: Full keyboard navigation for drag-drop
- Filters: Screen reader announcements for applied filters
- Modals: Focus management and escape key handling
- Touch targets: Minimum 44x44px for iPad (Constitution)

### Mobile/iPad Optimization
- Kanban: Horizontal scroll with momentum scrolling
- Touch: Long-press to start drag (avoid scroll conflicts)
- Filters: Collapsible panel on smaller screens
- Cards: Touch-optimized spacing (16px minimum)

---

## Open Questions for Product Owner

1. **Campaign Table:** Start with TEXT field or create campaigns table immediately?
2. **Audit Trail:** Which fields need tracking? (Recommend: stage, status, priority, organizations, products)
3. **Bulk Actions:** Max number of opportunities for bulk operations? (Recommend: 100)
4. **Kanban Performance:** Acceptable card count before pagination? (Recommend: 50 per column)
5. **Trade Show Workflow:** Any additional fields needed for booth visitor tracking?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Author:** Claude (Sonnet 4.5)
**Status:** Ready for Review
