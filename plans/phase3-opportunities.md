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

### ✅ KANBAN ALREADY IMPLEMENTED
**Current Status:** The Kanban board is fully functional using @hello-pangea/dnd
- **Location:** `src/atomic-crm/opportunities/OpportunityListContent.tsx`
- **Features:** Drag-drop between stages, optimistic updates, error rollback
- **Note:** Consider upgrading to dnd-kit for better performance (optional enhancement)

### E2-S1: Drag-and-Drop Library Research & Setup

**P3-E2-S1-T1: SPIKE - Evaluate drag-and-drop libraries** ✅
- **Status:** COMPLETE (spike done, but Kanban already implemented)
- **Current Implementation:** @hello-pangea/dnd working in production
- **Recommendation:** Optional upgrade to dnd-kit for performance
- **Files:**
  - ✅ `docs/spikes/2024-11-03-drag-drop-library-evaluation.md`
  - ✅ `src/atomic-crm/opportunities/OpportunityListContent.tsx`

**P3-E2-S1-T2: ~~Install and configure drag-drop~~** ✅
- **Status:** ALREADY COMPLETE
- **Confidence:** 100% (implemented and working)
- **Estimate:** 0 hours (done)
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

**P3-E2-S2-T1: ~~Create KanbanBoard container~~** ✅
- **Status:** ALREADY COMPLETE
- **Implementation:** `OpportunityListContent.tsx` serves as container
- **Confidence:** 100% (working in production)
- **Estimate:** 0 hours (done)
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityListContent.tsx`

**P3-E2-S2-T2: ~~Create KanbanColumn component~~** ✅
- **Status:** ALREADY COMPLETE
- **Implementation:** `OpportunityColumn.tsx`
- **Confidence:** 100% (working in production)
- **Estimate:** 0 hours (done)
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityColumn.tsx`

**P3-E2-S2-T3: ~~Enhance OpportunityCard~~** ✅
- **Status:** ALREADY COMPLETE
- **Implementation:** `OpportunityCard.tsx` with draggable functionality
- **Confidence:** 100% (working in production)
- **Estimate:** 0 hours (done)
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

**P3-E2-S3-T1: ~~Implement drag handlers~~** ✅
- **Status:** ALREADY COMPLETE
- **Implementation:** `OpportunityListContent.tsx` handleDragEnd function
- **Confidence:** 100% (working in production)
- **Estimate:** 0 hours (done)
- **Features Implemented:**
  - ✅ Visual feedback during drag
  - ✅ Smooth animations
  - ✅ Error handling with rollback
  - ✅ Optimistic UI updates
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityListContent.tsx`

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

**P3-E3-S1-T1: SPIKE - Campaign grouping data model** ✅
- **Status:** SPIKE COMPLETE
- **Recommendation:** TEXT field approach + grouped datagrid UI
- **Confidence:** 80% (spike completed)
- **Estimate:** 2 hours (completed)
- **Prerequisites:** None
- **Decision:** Use TEXT field for MVP flexibility
- **UI Pattern:** Grouped datagrid with collapsible sections
- **Files:**
  - ✅ `docs/spikes/2024-11-03-campaign-grouping-ui.md`

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

**P3-E4-S1-T1: Add principal field index to products** ✅ **COMPLETED**
- **Description:** Ensure principal field is indexed for fast filtering
- **Confidence:** 95%
- **Estimate:** 0.5 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Index on products.principal_id (already existed: idx_products_principal_id)
  - ✅ Query plan shows index usage
  - ✅ Fast filtering by principal (< 50ms for 1000 products)
- **Files:**
  - ✅ Index verified in existing migration (already created)
  - ✅ Created products_summary view: `supabase/migrations/20251104044122_add_products_summary_view.sql`

**P3-E4-S1-T2: Update product dropdown in OpportunityInputs to filter by principal** ✅ **COMPLETED**
- **Description:** ⭐ CRITICAL - Products filtered by selected principal organization
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** P3-E4-S1-T1
- **Acceptance Criteria:**
  - ✅ Product dropdown ONLY shows products matching selected principal (using memoized filter)
  - ✅ Dropdown disabled until principal selected (via productFilter logic)
  - ⚠️ DEFERRED: If principal changes, clear selected products (not implemented - low priority)
  - ⚠️ DEFERRED: Confirmation modal if products would be removed (not needed without clear logic)
  - ✅ Helper text: "Select principal first to see available products"
  - ✅ High test coverage (95%+) - 20 unit tests + 17 integration tests + 4 flow tests
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityInputs.tsx` (already filtering via ReferenceInput)
  - ✅ `src/atomic-crm/opportunities/hooks/useFilteredProducts.ts` (created for QuickAddForm)
  - ✅ `src/atomic-crm/opportunities/QuickAddForm.tsx` (refactored to use useFilteredProducts hook - fixed hook ordering bug)
  - ✅ `src/atomic-crm/opportunities/hooks/__tests__/useFilteredProducts.test.tsx` (20 unit tests, all passing)
  - ✅ `src/atomic-crm/opportunities/__tests__/product-filtering-integration.test.tsx` (17 integration tests, all passing)
  - ✅ `src/atomic-crm/opportunities/__tests__/quick-add-product-filtering-flow.test.tsx` (4 flow tests, all passing)

**P3-E4-S1-T3: Add principal column to products list view** ✅ **COMPLETED**
- **Description:** Show principal prominently in products table
- **Confidence:** 95%
- **Estimate:** 1 hour
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Principal name displayed in ProductCard (as badge)
  - ✅ Data provider uses products_summary view automatically for list operations
  - ✅ Sortable and filterable (via products_summary view)
  - ⚠️ DEFERRED: Links to organization detail page (badge only, no link - acceptable for MVP)
  - ✅ CSV export includes principal_name (via products_summary view)
- **Files:**
  - ✅ `src/atomic-crm/products/ProductCard.tsx` (updated to show principal_name badge)
  - ✅ `src/atomic-crm/providers/supabase/dataProviderUtils.ts` (added products to summary view mapping)
  - ✅ `supabase/migrations/20251104044122_add_products_summary_view.sql` (created view)

### E4-S2: Opportunity-Products Junction UI ✅ **COMPLETE**

**P3-E4-S2-T1: Create ProductAssociationList component** ✅ **ALREADY IMPLEMENTED**
- **Description:** Repeatable products section in opportunity form (ArrayInput pattern)
- **Status:** Already exists as `OpportunityProductsInput` component
- **Acceptance Criteria:**
  - ✅ ArrayInput with SimpleFormIterator for products
  - ✅ Each row: product dropdown (filtered by principal) + notes field
  - ✅ Add/remove product rows
  - ✅ At least one product required (validation)
  - ✅ Notes field: textarea, optional, max 500 chars
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityInputs.tsx` (lines 411-457: OpportunityProductsInput component)

**P3-E4-S2-T2: Display products table on OpportunityShow** ✅ **COMPLETED**
- **Description:** Show associated products with notes on opportunity detail page
- **Acceptance Criteria:**
  - ✅ Table columns: Product Name, Principal, Notes
  - ✅ Product name links to product detail page
  - ⚠️ DEFERRED: "Add Product" button (edit functionality should be on Edit page per React Admin patterns)
  - ⚠️ DEFERRED: Remove button per row (edit functionality should be on Edit page per React Admin patterns)
  - ✅ Shows empty state if no products
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityShow.tsx` (updated to use ProductsTable)
  - ✅ `src/atomic-crm/opportunities/ProductsTable.tsx` (created)
  - ✅ `supabase/migrations/20251104125744_update_opportunities_summary_with_principal_name.sql` (added principal_name to products array)
  - ✅ `src/atomic-crm/types.ts` (added products field to Opportunity interface)

**P3-E4-S2-T3: Implement opportunity_products sync in data provider** ✅ **ALREADY IMPLEMENTED**
- **Description:** Handle create/update/delete of junction table records
- **Status:** Already implemented via RPC function and data provider
- **Acceptance Criteria:**
  - ✅ Create: Insert junction records for all products (via sync_opportunity_with_products RPC)
  - ✅ Update: Diff existing vs new products (using diffProducts utility)
  - ✅ Delete opportunity: Cascade deletes junction records (schema constraint)
  - ✅ Atomic transactions (RPC function handles atomicity)
  - ✅ Handles errors gracefully
  - ✅ diffProducts utility used (src/atomic-crm/opportunities/diffProducts.ts)
- **Files:**
  - ✅ `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (lines 491, 573: RPC calls)
  - ✅ `src/atomic-crm/opportunities/diffProducts.ts` (diff logic)
  - ✅ Database RPC function: `sync_opportunity_with_products`

---

## Epic 5: Opportunity Auto-Generate Name ✅ **COMPLETE**

### E5-S1: Name Generation Logic ✅ **COMPLETE**

**P3-E5-S1-T1: Implement auto-generate name function** ✅ **COMPLETED**
- **Description:** Generate opportunity name from customer + principal + quarter/year
- **Status:** All acceptance criteria met
- **Acceptance Criteria:**
  - ✅ Format: "{Customer Name} - {Principal Name} - Q{quarter} {year}"
  - ✅ Example: "Nobu Miami - Ocean Hugger - Q1 2025"
  - ✅ Handles missing data gracefully (returns empty string if both names missing/whitespace)
  - ✅ Quarter calculated from current date (getQuarter function: 1-4 based on month)
  - ✅ Year from current date
  - ✅ Max length: 200 chars (truncates to 197 chars + "..." if exceeded)
  - ✅ Test coverage: 100% (37 tests, all passing)
- **Files:**
  - ✅ `src/atomic-crm/opportunities/utils/generateOpportunityName.ts` (created)
  - ✅ `src/atomic-crm/opportunities/utils/generateOpportunityName.test.ts` (created with comprehensive tests)

**P3-E5-S1-T2: Add auto-generate button to OpportunityInputs** ✅ **COMPLETED**
- **Description:** Refresh icon button next to name field triggers auto-generation
- **Status:** All acceptance criteria met, extended existing hook
- **Acceptance Criteria:**
  - ✅ Button enabled when customer OR principal selected (via canGenerate flag)
  - ✅ Click populates name field (doesn't submit form)
  - ✅ User can edit generated name (manual override supported)
  - ✅ Button shown in both create and edit modes (was edit-only before)
  - ✅ Tooltip on button: "Generate name from customer and principal"
  - ✅ Auto-generates in create mode when fields change and name is empty
- **Implementation Notes:**
  - Updated `useAutoGenerateName` hook to use new `generateOpportunityName` utility
  - Replaced old format ("MMM YYYY") with new quarter format ("Q1 2025")
  - Added `canGenerate` flag to hook return for button enable/disable logic
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityInputs.tsx` (updated with tooltip and visibility logic)
  - ✅ `src/atomic-crm/opportunities/useAutoGenerateName.ts` (refactored to use utility function)

**P3-E5-S1-T3: Add naming convention helper text to form** ✅ **COMPLETED**
- **Description:** Display helper text with naming tips below name field
- **Status:** All acceptance criteria met
- **Acceptance Criteria:**
  - ✅ Helper text shows tips (naming patterns and examples)
  - ✅ Examples: "Roka Akor - Tuna Roll Program"
  - ✅ Trade show example: "NRA Show 2025 - Blue Ribbon Sushi - Ocean Hugger"
  - ✅ Collapsible section (initially hidden, "Show tips" / "Hide tips" toggle)
  - ✅ Multiple example categories (standard, program, trade show, product, expansion)
  - ✅ Lightbulb icon for visual clarity
- **Files:**
  - ✅ `src/atomic-crm/opportunities/NamingConventionHelp.tsx` (created)
  - ✅ `src/atomic-crm/opportunities/OpportunityInputs.tsx` (integrated helper below name field)

---

## Epic 6: List View Enhancements

### E6-S1: Principal Column Enhancement ✅ **COMPLETE**

**P3-E6-S1-T1: Make principal column prominent in OpportunityRowListView** ✅ **COMPLETED**
- **Description:** ⭐ Update principal column styling - bold, larger font, prominent position
- **Status:** All acceptance criteria met
- **Acceptance Criteria:**
  - ✅ Principal displayed prominently in card layout (bold, icon, high contrast)
  - ✅ Bold font weight (`font-bold`)
  - ✅ Icon prefix (Building2 icon from lucide-react)
  - ✅ Links to organization detail page (`link="show"` with proper z-index)
  - ✅ Sortable and filterable (uses ReferenceField with AutocompleteArrayInput)
  - ✅ High contrast color (`text-[color:var(--brand-700)]`)
  - ✅ Hover effect (underline on hover)
- **Implementation Notes:**
  - Card-based layout uses inline display rather than traditional table columns
  - Principal shown in "Customer → Principal" flow on second line of card
  - Added `relative z-10` to ensure link works above stretched card overlay
- **Files:**
  - ✅ `src/atomic-crm/opportunities/OpportunityRowListView.tsx` (enhanced with Building2 icon, bold styling, clickable link)

**P3-E6-S1-T2: Add principal filter to OpportunityList filters** ✅ **COMPLETED**
- **Description:** ⭐ Principal multi-select filter in list view (prominent position)
- **Status:** All acceptance criteria met (filter existed, moved to TOP position)
- **Acceptance Criteria:**
  - ✅ Principal filter at TOP of filter panel (2nd position after search)
  - ✅ Searchable multi-select (AutocompleteArrayInput component)
  - ✅ Clarified placeholder: "Principal (Brand/Manufacturer)"
  - ✅ Persists in URL query params (React Admin default behavior)
  - ✅ Works with other filters using AND logic (React Admin default behavior)
  - ⚠️ Count per principal not shown (React Admin limitation - would require custom component)
- **Implementation Notes:**
  - Filter already existed but was in 3rd position
  - Moved to TOP position (right after alwaysOn search filter)
  - Enhanced placeholder text to clarify what "Principal" means
  - Comment added marking it as most important filter per PRD
- **Files:**
  - ✅ `src/atomic-crm/filters/useOpportunityFilters.tsx` (reordered filters, enhanced placeholder)

### E6-S2: Saved Filter Views

**P3-E6-S2-T1: Create "By Principal" saved view**
- **Description:** ⭐ Preset view groups opportunities by principal
- **Status:** DEFERRED - Complex grouping pattern, lower priority than quick filters
- **Confidence:** 70% (new grouping pattern)
- **Estimate:** 3 hours
- **Deferral Reason:** Quick filter presets (T2/T3) provide 80% of value with 20% of effort. Grouped view requires significant UI work for uncertain ROI.
- **Alternative:** Principal filter in top position + "My Opportunities" preset achieves primary goal

**P3-E6-S2-T2: Create "My Opportunities" saved view** ✅ **COMPLETED**
- **Description:** Filter to current user's opportunities
- **Status:** All acceptance criteria met
- **Acceptance Criteria:**
  - ✅ "My Opportunities" button in filter presets bar (with User icon)
  - ✅ Filters to opportunity_owner_id = current user
  - ✅ Shows count in badge (dynamic count based on data)
  - ✅ Can combine with other filters (merges with existing filterValues)
  - ✅ Active state visual feedback
- **Implementation Notes:**
  - Created reusable FilterPresetsBar component
  - Presets defined in centralized filterPresets.ts configuration
  - Client-side count calculation for fast feedback
- **Files:**
  - ✅ `src/atomic-crm/opportunities/filterPresets.ts` (created)
  - ✅ `src/atomic-crm/opportunities/FilterPresetsBar.tsx` (created)
  - ✅ `src/atomic-crm/opportunities/OpportunityList.tsx` (integrated presets bar)

**P3-E6-S2-T3: Create additional preset views** ✅ **COMPLETED**
- **Description:** Add preset views: "Closing This Month", "High Priority", "Needs Action", "Recent Wins"
- **Status:** All acceptance criteria met
- **Acceptance Criteria:**
  - ✅ "Closing This Month": estimated_close_date within 30 days (Calendar icon)
  - ✅ "High Priority": priority IN (high, critical) (AlertCircle icon)
  - ✅ "Needs Action": next_action_date <= today (Flag icon)
  - ✅ "Recent Wins": stage=closed_won AND updated_at within 30 days (Trophy icon)
  - ✅ All views show count badges (dynamic counts)
  - ✅ Icons for visual identification
  - ✅ Tooltips with descriptions
- **Implementation Notes:**
  - All 5 presets implemented in single filterPresets.ts configuration
  - Uses date-fns for date calculations (addDays, startOfMonth, endOfMonth)
  - Presets are composable and can be combined with other filters
- **Files:**
  - ✅ `src/atomic-crm/opportunities/filterPresets.ts` (all presets defined)
  - ✅ `src/atomic-crm/opportunities/FilterPresetsBar.tsx` (renders all presets with icons/counts)

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

**P3-E7-S1-T1: Update OpportunityShow header with 3-org display** ✅
- **Description:** Show customer, ⭐ principal, and distributor organizations prominently
- **Confidence:** 90%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Card layout with icons
  - ✅ ⭐ Principal displayed prominently (bold, star icon, "MOST IMPORTANT" tooltip)
  - ✅ Customer organization linked
  - ✅ Distributor organization linked (if present)
  - ✅ Owner with avatar
  - ✅ Expected close date with days-away calculation
  - ✅ Created date and creator
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update header)
  - `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` (new)
  - `src/atomic-crm/sales/SaleAvatar.tsx` (new - avatar component for sales)
  - `src/atomic-crm/types.ts` (added created_by field to Opportunity interface)
- **Implementation Notes:**
  - Created OrganizationInfoCard with featured principal display (star icon, tooltip, brand coloring)
  - Enhanced expected close date with formatDistanceToNow ("in 14 days" / "2 days ago")
  - Created SaleAvatar component for consistent avatar display across sales
  - Added created date with relative time and creator with avatar

**P3-E7-S1-T2: Add workflow management section** ✅
- **Description:** Display and inline-edit tags, next action, next action date, decision criteria
- **Confidence:** 85%
- **Estimate:** 3 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Tags displayed as chips (clickable to filter)
  - ✅ Next action inline editable
  - ✅ Next action date inline editable with date picker
  - ✅ Highlights overdue dates in red
  - ✅ Decision criteria expandable text area
  - ✅ All fields save on blur
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (update)
  - `src/atomic-crm/opportunities/WorkflowManagementSection.tsx` (new)
  - `src/atomic-crm/types.ts` (added tags field to Opportunity interface)
- **Implementation Notes:**
  - Created WorkflowManagementSection with full inline editing support
  - Tags: Clickable badges that navigate to filtered list, with add/remove functionality
  - Next action: Text input with save on blur
  - Next action date: Date picker with overdue highlighting (red border + "Overdue" badge for past dates)
  - Decision criteria: Collapsible text area for space efficiency
  - All updates use useUpdate hook with refetch and notifications
  - Local state syncs with record changes via useEffect

### E7-S2: Activity Timeline

**P7-E7-S2-T1: Enhance activity timeline with quick add form** ✅
- **Description:** Add quick log activity form at top of timeline
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** None
- **Acceptance Criteria:**
  - ✅ Form at top of activity feed
  - ✅ Fields: activity type (dropdown), date (default today), description (textarea)
  - ✅ "Add Activity" button
  - ✅ Creates activity and refreshes feed
  - ✅ Activity types: Call, Email, Meeting, Demo, plus Trade Show, Site Visit, Proposal, Follow Up, etc.
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityShow.tsx` (already integrated)
  - `src/atomic-crm/opportunities/ActivityNoteForm.tsx` (already implemented)
  - `src/atomic-crm/validation/activities.ts` (defines INTERACTION_TYPE_OPTIONS)
- **Implementation Notes:**
  - ActivityNoteForm already implements all required functionality
  - Form includes 4-column responsive grid layout (date, type, contact, stage)
  - Includes bonus features: contact selection, stage management with immediate update
  - Activity types more comprehensive than spec: includes 11 types (Call, Email, Meeting, Demo, Proposal, Follow Up, Trade Show, Site Visit, Contract Review, Check In, Social)
  - Form uses react-hook-form with Zod validation
  - Successfully integrated in OpportunityShow "Notes & Activity" tab

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

### E8-S2a: CSV Import Integration Tests (Existing Feature Validation)

**P3-E8-S2a-T1: Integration test: CSV column mapping validation**
- **Description:** Test existing CSV import with 600+ column aliases
- **Confidence:** 95%
- **Estimate:** 3 hours
- **Prerequisites:** None (feature already implemented)
- **Acceptance Criteria:**
  - Test: Common Salesforce export column names mapped correctly
  - Test: Full name splitting (first + last)
  - Test: Work/Home/Other email and phone handling
  - Test: Performance with 10K row CSV (< 3 seconds)
  - Test: Unmapped columns detected and reported
  - Coverage: 85%+ for csvProcessor.ts
- **Files:**
  - `src/atomic-crm/contacts/csvProcessor.test.ts` (new)
  - `src/atomic-crm/contacts/columnAliases.test.ts` (new)
  - `tests/fixtures/salesforce-export.csv`
  - `tests/fixtures/hubspot-export.csv`

**P3-E8-S2a-T2: E2E test: Complete CSV import workflow**
- **Description:** Full import flow from upload to database persistence
- **Confidence:** 85%
- **Estimate:** 4 hours
- **Prerequisites:** P3-E8-S2a-T1
- **Acceptance Criteria:**
  - Test: Upload CSV file via UI
  - Test: Preview first 5 rows with mapped columns
  - Test: Submit and create contacts in database
  - Test: Duplicate detection and handling
  - Test: Error handling for malformed CSV
  - Test: Progress indicator for large files
- **Files:**
  - `tests/e2e/contacts/csv-import-workflow.spec.ts`

### E8-S2b: Performance Validation Tests

**P3-E8-S2b-T1: Performance test: Kanban board with 1000+ opportunities**
- **Description:** Validate Kanban performance with large datasets
- **Confidence:** 80%
- **Estimate:** 3 hours
- **Prerequisites:** None (Kanban already implemented)
- **Acceptance Criteria:**
  - Test: Load 1000 opportunities across 6 stages
  - Test: Initial render < 2 seconds
  - Test: Drag operation < 100ms response
  - Test: Filter application < 500ms
  - Test: Memory usage < 100MB
  - Test: No frame drops during scroll
- **Files:**
  - `tests/performance/kanban-large-dataset.spec.ts`
  - `tests/fixtures/generate-opportunities.ts`

**P3-E8-S2b-T2: Performance test: Principal filtering with products**
- **Description:** Test product dropdown performance with principal filtering
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E4-S1-T2
- **Acceptance Criteria:**
  - Test: Load 5000 products across 50 principals
  - Test: Principal selection filters products < 50ms
  - Test: Product search within principal < 100ms
  - Test: Memory efficient (no leaks after 100 selections)
  - Test: Virtual scrolling works if > 100 products
- **Files:**
  - `tests/performance/product-filtering.spec.ts`

**P3-E8-S2b-T3: Performance test: Search with fuzzy matching**
- **Description:** Validate search performance with pg_trgm
- **Confidence:** 75%
- **Estimate:** 2 hours
- **Prerequisites:** Fuzzy search implementation
- **Acceptance Criteria:**
  - Test: Search 50K opportunities < 20ms
  - Test: Complex queries (3+ terms) < 50ms
  - Test: Field-specific filters maintain performance
  - Test: Autocomplete suggestions < 10ms
  - Test: No query plan regressions
- **Files:**
  - `tests/performance/fuzzy-search.spec.ts`

### E8-S2c: Trade Show Workflow Integration Tests

**P3-E8-S2c-T1: E2E test: Complete trade show lead capture**
- **Description:** Test critical trade show workflow end-to-end
- **Confidence:** 70%
- **Estimate:** 4 hours
- **Prerequisites:** P3-E3-S3-T2
- **Acceptance Criteria:**
  - Test: Quick opportunity creation with minimal fields
  - Test: Campaign auto-populated from context
  - Test: Multiple principals for same visitor
  - Test: Link related opportunities
  - Test: Mobile/iPad touch interactions
  - Test: Works with spotty connectivity (if offline implemented)
- **Files:**
  - `tests/e2e/trade-show/lead-capture.spec.ts`
  - `tests/e2e/trade-show/multi-principal.spec.ts`

**P3-E8-S2c-T2: Integration test: Campaign batch operations**
- **Description:** Test bulk operations on campaign-grouped opportunities
- **Confidence:** 75%
- **Estimate:** 2 hours
- **Prerequisites:** P3-E3-S1-T5
- **Acceptance Criteria:**
  - Test: Select all in campaign group
  - Test: Bulk stage update
  - Test: Bulk priority change
  - Test: Export campaign opportunities to CSV
  - Test: Performance with 200+ opportunities
- **Files:**
  - `tests/integration/campaign-bulk-ops.spec.ts`

### E8-S2d: Existing Feature Regression Tests

**P3-E8-S2d-T1: Regression test: Existing Kanban drag-drop**
- **Description:** Add tests for already-working Kanban functionality
- **Confidence:** 95%
- **Estimate:** 3 hours
- **Prerequisites:** None (feature works in production)
- **Acceptance Criteria:**
  - Test: @hello-pangea/dnd integration
  - Test: Optimistic updates and rollback
  - Test: Error handling with toast notifications
  - Test: Touch interactions on iPad
  - Test: Keyboard navigation (accessibility)
  - Coverage: 80%+ for OpportunityListContent.tsx
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityListContent.test.tsx`
  - `src/atomic-crm/opportunities/OpportunityColumn.test.tsx`
  - `src/atomic-crm/opportunities/OpportunityCard.test.tsx`

**P3-E8-S2d-T2: Regression test: Principal organization tracking**
- **Description:** Validate existing principal_organization_id functionality
- **Confidence:** 95%
- **Estimate:** 2 hours
- **Prerequisites:** None (already implemented)
- **Acceptance Criteria:**
  - Test: Principal required validation
  - Test: Principal organization dropdown populated
  - Test: Principal persists on save
  - Test: Principal displays in list/card views
  - Test: Principal filtering works
- **Files:**
  - `src/atomic-crm/opportunities/OpportunityInputs.test.tsx`
  - `tests/integration/principal-tracking.spec.ts`

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
1. **Drag-and-drop implementation (85%):** ✅ Spike complete, clear patterns established
2. **Campaign grouping UI (80%):** ✅ Spike complete, grouped datagrid pattern selected
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
