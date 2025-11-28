# Opportunity Resource Feature & CRUD Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (AI-assisted)
**Status:** Validated with user decisions

---

## Overview

This document captures the complete feature inventory for the Opportunity resource, comparing implemented code against PRD requirements. It includes user-validated decisions on implementation gaps and industry best practices research from Salesforce and HubSpot.

**Key Finding:** The Opportunity resource is well-implemented with 3 view modes (Kanban, List, Campaign), comprehensive bulk actions, and slide-over editing. However, critical gaps exist around pipeline stage migration, win/loss reasons, per-stage stale thresholds, and duplicate prevention.

---

## Feature Matrix (Component-Level)

### OpportunityList (`/opportunities`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Kanban board view | ✅ Implemented | ✅ Required | `OpportunityListContent.tsx` with drag-drop |
| Table list view | ✅ Implemented | ✅ Required | `OpportunityRowListView.tsx` |
| Campaign-grouped view | ✅ Implemented | ✅ Required | `CampaignGroupedList.tsx` |
| View switcher | ✅ Implemented | ✅ Required | `OpportunityViewSwitcher.tsx` with localStorage |
| Filter by Stage | ✅ Implemented | ✅ Required | Multi-select stage filter |
| Filter by Principal | ✅ Implemented | ✅ Required | Organization type filter |
| Filter by Owner | ✅ Implemented | ✅ Required | Sales rep dropdown |
| Filter by Date Range | ✅ Implemented | ✅ Required | Date range picker |
| Filter by Status | ✅ Implemented | ✅ Required | Open/Won/Lost |
| Filter by Campaign | ✅ Implemented | ✅ Required | Text filter |
| Filter Presets | ✅ Implemented | ✅ Required | `FilterPresetsBar.tsx` |
| Filter Chips | ✅ Implemented | ✅ Required | `FilterChipsPanel.tsx` |
| Export to CSV | ✅ Implemented | ✅ Required | `useExportOpportunities.ts` |
| Create button (toolbar) | ✅ Implemented | ✅ Required | `CreateButton` component |
| Floating Create button | ✅ Implemented | ✅ Required | `FloatingCreateButton` |
| Quick Add dialog | ✅ Implemented | ✅ Required | `QuickAddButton.tsx` + `QuickAddDialog.tsx` |
| Click row → SlideOver | ✅ Implemented | ✅ Required | `useSlideOverState` hook |
| Bulk Stage Change | ✅ Implemented | ✅ Required | `BulkActionsToolbar.tsx` |
| Bulk Status Change | ✅ Implemented | ✅ Required | `BulkActionsToolbar.tsx` |
| Bulk Owner Assignment | ✅ Implemented | ✅ Required | `BulkActionsToolbar.tsx` |
| **Bulk Delete** | ❌ Missing | ✅ Required | PRD #13 specifies bulk soft delete |
| Archived opportunities | ✅ Implemented | ✅ Required | `OpportunityArchivedList.tsx` |

### OpportunitySlideOver (Quick View/Edit Panel)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View mode | ✅ Implemented | ✅ Required | `ResourceSlideOver` wrapper |
| Edit mode toggle | ✅ Implemented | ✅ Required | `onModeToggle` callback |
| Details tab | ✅ Implemented | ✅ Required | `OpportunitySlideOverDetailsTab.tsx` |
| Contacts tab | ✅ Implemented | ✅ Required | `OpportunityContactsTab.tsx` |
| Products tab | ✅ Implemented | ✅ Required | `OpportunityProductsTab.tsx` |
| Notes tab | ✅ Implemented | ✅ Required | `OpportunityNotesTab.tsx` |
| 40vw width (min 480px, max 720px) | ✅ Implemented | ✅ Required | Design system spec |
| Focus trap | ✅ Implemented | ✅ Required | `role="dialog"` aria attributes |
| URL sync | ✅ Implemented | ✅ Required | `?view=123` or `?edit=123` |

### OpportunityShow (`/opportunities/:id/show`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View opportunity details | ✅ Implemented | ✅ Required | Full page view with tabs |
| Details tab | ✅ Implemented | ✅ Required | Organization info, workflow, related opps |
| Notes & Activity tab | ✅ Implemented | ✅ Required | `ActivityNoteForm` + `ActivitiesList` |
| Change Log tab | ✅ Implemented | ✅ Required | `ChangeLogTab.tsx` audit trail |
| Stage display | ✅ Implemented | ✅ Required | Badge with color |
| Priority display | ✅ Implemented | ✅ Required | Badge with severity colors |
| Expected close date | ✅ Implemented | ✅ Required | With overdue badge |
| Products table | ✅ Implemented | ✅ Required | `ProductsTable.tsx` |
| Contacts list | ✅ Implemented | ✅ Required | `ContactList.tsx` |
| Organization info card | ✅ Implemented | ✅ Required | `OrganizationInfoCard.tsx` |
| Workflow management | ✅ Implemented | ✅ Required | `WorkflowManagementSection.tsx` |
| Related opportunities | ✅ Implemented | ✅ Required | `RelatedOpportunitiesSection.tsx` |
| Archive button | ✅ Implemented | ✅ Required | Soft delete with confirmation |
| Unarchive button | ✅ Implemented | ✅ Required | Restore from archive |
| Activity timeline filters | ✅ Implemented | ✅ Required | `ActivityTimelineFilters.tsx` |

### OpportunityCreate (`/opportunities/create`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Create new opportunity | ✅ Implemented | ✅ Required | `CreateBase` with Zod validation |
| General tab | ✅ Implemented | ✅ Required | Name, description, close date |
| Classification tab | ✅ Implemented | ✅ Required | Stage, priority, lead source, campaign, tags |
| Relationships tab | ✅ Implemented | ✅ Required | Customer, Principal, Distributor, Contacts, Products |
| Details tab | ✅ Implemented | ✅ Required | Related opp, notes, next action, decision criteria |
| Auto-generated name | ✅ Implemented | ✅ Required | `generateOpportunityName.ts` |
| Schema-derived defaults | ✅ Implemented | ✅ Required | Constitution #5 pattern |
| Contact required (min 1) | ✅ Implemented | ✅ Required | Zod validation |
| Principal required | ✅ Implemented | ✅ Required | Zod validation |
| Customer required | ✅ Implemented | ✅ Required | Zod validation |
| **Contact from Customer Org** | ❌ Missing | ✅ Required | PRD Section 4.2 - not enforced |
| **Duplicate Prevention** | ❌ Missing | ✅ Required | **MVP #30** - Hybrid detection |

### OpportunityEdit (`/opportunities/:id`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Edit existing opportunity | ✅ Implemented | ✅ Required | `EditBase` with redirect |
| Details tab | ✅ Implemented | ✅ Required | Same inputs as Create |
| Notes & Activity tab | ✅ Implemented | ✅ Required | `ActivityNoteForm` + notes |
| Delete button | ✅ Implemented | ✅ Required | Soft delete |
| Cancel button | ✅ Implemented | ✅ Required | Returns to show page |
| Record key remount | ✅ Implemented | ✅ Required | `key={record.id}` |

### QuickAddForm (Trade Show Mode)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Quick Add dialog | ✅ Implemented | ✅ Required | `QuickAddDialog.tsx` |
| Campaign persistence | ✅ Implemented | ✅ Required | localStorage retention |
| Principal selection | ✅ Implemented | ✅ Required | Dropdown with principals |
| Product selection | ✅ Implemented | ✅ Required | Multi-select filtered by principal |
| Contact creation | ✅ Implemented | ✅ Required | First/last name, phone, email |
| Organization creation | ✅ Implemented | ✅ Required | Name, city, state |
| Save & Add Another | ✅ Implemented | ✅ Required | Resets form, keeps context |
| Save & Close | ✅ Implemented | ✅ Required | Closes dialog |
| City autocomplete | ✅ Implemented | ✅ Required | US cities with state auto-fill |

### Kanban Board Components

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Drag and drop | ✅ Implemented | ✅ Required | `@hello-pangea/dnd` library |
| Stage columns | ✅ Implemented | ✅ Required | `OpportunityColumn.tsx` |
| Opportunity cards | ✅ Implemented | ✅ Required | `OpportunityCard.tsx` (memoized) |
| Card actions menu | ✅ Implemented | ✅ Required | `OpportunityCardActions.tsx` |
| Column customization | ✅ Implemented | ✅ Required | `ColumnCustomizationMenu.tsx` |
| Days in stage indicator | ✅ Implemented | ✅ Required | Badge on card |
| Stuck deal warning | ⚠️ Partial | ✅ Required | Global threshold only |
| Primary contact display | ✅ Implemented | ✅ Required | Via `useOpportunityContacts` |
| Priority badge | ✅ Implemented | ✅ Required | Color-coded |
| Close date display | ✅ Implemented | ✅ Required | Formatted date |

---

## Pipeline Stages Analysis

### Current Code Implementation (8 stages)

From `src/atomic-crm/opportunities/constants/stageConstants.ts`:

| # | Value | Label | Color | Elevation | PRD Status |
|---|-------|-------|-------|-----------|------------|
| 1 | `new_lead` | New Lead | info-subtle | 3 (prominent) | ✅ In PRD |
| 2 | `initial_outreach` | Initial Outreach | tag-teal-bg | 2 (medium) | ✅ In PRD |
| 3 | `sample_visit_offered` | Sample/Visit Offered | warning-subtle | 2 (medium) | ✅ In PRD |
| 4 | `awaiting_response` | Awaiting Response | tag-purple-bg | 1 (subtle) | ❌ **REMOVED in PRD v1.9** |
| 5 | `feedback_logged` | Feedback Logged | tag-blue-bg | 2 (medium) | ✅ In PRD |
| 6 | `demo_scheduled` | Demo Scheduled | success-subtle | 3 (prominent) | ✅ In PRD |
| 7 | `closed_won` | Closed - Won | success-strong | 2 (medium) | ✅ In PRD |
| 8 | `closed_lost` | Closed - Lost | error-subtle | 1 (subtle) | ✅ In PRD |

### PRD Specification (7 stages - Section 5.1)

| # | Value | Label | Stale Threshold | Visual Decay |
|---|-------|-------|-----------------|--------------|
| 1 | `new_lead` | New Lead | 7 days | No |
| 2 | `initial_outreach` | Initial Outreach | 14 days | No |
| 3 | `sample_visit_offered` | Sample/Visit Offered | 14 days | **Yes** - Green/Yellow/Red |
| 4 | `feedback_logged` | Feedback Logged | 21 days | No |
| 5 | `demo_scheduled` | Demo Scheduled | 14 days | No |
| 6 | `closed_won` | Closed - Won | N/A | No |
| 7 | `closed_lost` | Closed - Lost | N/A | No |

### Industry Comparison

| CRM | Typical Stages | Probability Support | Stage Gates |
|-----|----------------|--------------------|--------------|
| **Salesforce** | 5-7 (configurable) | Yes (10%-90%) | Validation rules |
| **HubSpot** | 5-8 (configurable) | Yes (per stage) | Required properties |
| **Crispy-CRM** | 8 (needs migration to 7) | Post-MVP | Not implemented |

---

## CRUD Matrix

| Operation | Status | Gap | Required Action |
|-----------|--------|-----|-----------------|
| **CREATE (Full Form)** | ✅ Works | Contact-org link not enforced | Medium priority fix |
| **CREATE (Quick Add)** | ✅ Works | — | None |
| **READ (List - Kanban)** | ✅ Works | — | None |
| **READ (List - Table)** | ✅ Works | — | None |
| **READ (List - Campaign)** | ✅ Works | — | None |
| **READ (Single - Show)** | ✅ Works | — | None |
| **READ (Single - SlideOver)** | ✅ Works | — | None |
| **UPDATE (Full Form)** | ✅ Works | — | None |
| **UPDATE (SlideOver)** | ✅ Works | — | None |
| **UPDATE (Drag-Drop Stage)** | ✅ Works | — | None |
| **UPDATE (Bulk Stage)** | ✅ Works | — | None |
| **UPDATE (Bulk Status)** | ✅ Works | — | None |
| **UPDATE (Bulk Owner)** | ✅ Works | — | None |
| **DELETE (Single)** | ✅ Works | Soft delete | Verified working |
| **DELETE (Bulk)** | ❌ Missing | Not implemented | Add to BulkActionsToolbar |
| **ARCHIVE** | ✅ Works | — | None |
| **UNARCHIVE** | ✅ Works | — | None |
| **SEARCH** | ✅ Works | — | Via filters |
| **FILTER** | ✅ Works | — | Comprehensive filters |
| **SORT** | ✅ Works | — | Multiple fields |
| **EXPORT** | ✅ Works | — | CSV export |

---

## User-Validated Decisions

These decisions were validated against industry best practices (Salesforce, HubSpot) and confirmed by the user on 2025-11-28.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Stage Count (8 vs 7) | **Migrate to 7 stages** | PRD v1.9 removed `awaiting_response`. Industry standard is 5-7 stages. |
| Q2 | Win/Loss Reasons | **MVP Blocker - High Priority** | Salesforce/HubSpot require reasons on close. Critical for sales analysis. |
| Q3 | Stale Detection | **Per-stage thresholds** | PRD spec: 7d/14d/21d. Industry uses stage-specific SLAs. |
| Q4 | Duplicate Prevention | **Hybrid approach** | Hard block exact (Principal+Customer+Product), soft warn fuzzy names. |

---

## Industry Research Summary

Research conducted via Perplexity API and web search on 2025-11-28.

### Pipeline Stage Best Practices

**Sources:**
- [Salesforce Opportunity Stages Guide | Salesforce Ben](https://www.salesforceben.com/complete-guide-tutorial-to-salesforce-opportunity-stages/)
- [4 Salesforce Opportunity Management Best Practices | Clari](https://www.clari.com/blog/4-salesforce-opportunity-management-best-practices-for-better-forecasts/)

**Key Findings:**
- 5-7 stages is optimal; too many creates friction, too few reduces visibility
- Each stage should represent a verifiable milestone in the buyer's journey
- 47% of forecasted deals never close (CSO Insights) - proper stage management critical
- Companies with stage-specific SLAs see 32% improvement in deal velocity

### Win/Loss Analysis

**Sources:**
- [Salesforce Opportunity Stages Best Practices | DemandFarm](https://www.demandfarm.com/blog/salesforce-opportunity-stages-best-practices-are-you-managing-deals-or-losing-them/)

**Key Findings:**
- Win/loss reasons are standard in enterprise CRMs
- Required for identifying patterns and improving win rates
- Salesforce enforces via validation rules on stage change
- HubSpot uses required properties approach

### Duplicate Prevention

**Sources:**
- [Mastering HubSpot Deal Stages | SmartBug Media](https://www.smartbugmedia.com/blog/mastering-hubspot-deal-stages-best-practices-for-an-effective-sales-pipeline)

**Key Findings:**
- Duplicate detection is standard feature in both Salesforce and HubSpot
- Salesforce uses matching rules (exact) + duplicate rules (fuzzy)
- HubSpot shows potential duplicates with option to merge or proceed
- Hybrid approach (hard block exact, soft warn fuzzy) is industry best practice

### Stale Deal Detection

**Sources:**
- [HubSpot Sales Pipeline Stages | ForecastIO](https://forecastio.ai/blog/hubspot-sales-pipeline-stages)

**Key Findings:**
- Per-stage thresholds are more effective than global thresholds
- Early stages (lead, outreach) should have shorter thresholds
- Later stages (feedback, demo) can have longer thresholds
- Visual indicators (color coding) improve rep attention to stale deals

---

## Implementation Tasks

Priority-ordered tasks to close gaps:

| Priority | Task | Effort | PRD Reference | Files to Modify |
|----------|------|--------|---------------|-----------------|
| **1** | Migrate from 8 to 7 stages | Medium | MVP #33 | `stageConstants.ts`, new migration |
| **2** | Implement Win/Loss Reasons UI | Large | MVP #12 | New component, validation update |
| **3** | Per-stage stale thresholds | Medium | MVP #25 | `useStageMetrics.ts` |
| **4** | Hybrid duplicate prevention | Large | MVP #30 | New hook, `OpportunityCreate.tsx` |
| **5** | Visual decay indicators | Medium | MVP #26 | `OpportunityCard.tsx`, CSS |
| **6** | Activity auto-cascade | Medium | MVP #27 | `ActivityNoteForm.tsx` |
| **7** | Contact from Customer Org | Small | Section 4.2 | Validation + UI hint |
| **8** | Bulk soft delete | Small | PRD #13 | `BulkActionsToolbar.tsx` |

---

## Database Schema Notes

### Opportunities Table

From `supabase/migrations/`:

```sql
-- Key columns for this audit
CREATE TABLE opportunities (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    stage TEXT DEFAULT 'new_lead',
    priority TEXT DEFAULT 'medium',
    customer_organization_id BIGINT REFERENCES organizations(id),
    principal_organization_id BIGINT REFERENCES organizations(id),
    distributor_organization_id BIGINT REFERENCES organizations(id),
    contact_ids BIGINT[] DEFAULT '{}',
    estimated_close_date DATE,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    -- Following fields exist but NOT in PRD/UI:
    -- win_reason, loss_reason - NOT IMPLEMENTED (needed for MVP #12)
    -- probability - POST-MVP
    -- amount - POST-MVP
);
```

### Stage Migration Required

The `awaiting_response` stage needs removal:

1. Update `stageConstants.ts` to remove the stage
2. Create migration to update existing records:
   ```sql
   UPDATE opportunities
   SET stage = 'sample_visit_offered'
   WHERE stage = 'awaiting_response';
   ```
3. Update any reports/views that reference the old stage

---

## Validation Schema Summary

From `src/atomic-crm/validation/opportunities.ts`:

| Field | Create | Update | Notes |
|-------|--------|--------|-------|
| `name` | Required | Optional | Min 1 char |
| `customer_organization_id` | Required | Optional | — |
| `principal_organization_id` | Required | Optional | — |
| `distributor_organization_id` | Optional | Optional | Nullable |
| `contact_ids` | Required (min 1) | Optional | Array of IDs |
| `stage` | Default `new_lead` | Optional | 8 enum values (needs update to 7) |
| `priority` | Default `medium` | Optional | 4 enum values |
| `estimated_close_date` | Required | Optional | Default +30 days |
| `lead_source` | Optional | Optional | 8 enum values |
| `campaign` | Optional | Optional | Max 100 chars |
| `win_reason` | **NOT IMPLEMENTED** | — | **MVP #12** |
| `loss_reason` | **NOT IMPLEMENTED** | — | **MVP #12** |

---

## Component Architecture

```
src/atomic-crm/opportunities/
├── index.ts                    # Lazy-loaded exports (List, Create, Edit)
├── OpportunityList.tsx         # Main list with 3 views
├── OpportunityCreate.tsx       # Full-page create form
├── OpportunityEdit.tsx         # Full-page edit form
├── OpportunityShow.tsx         # Detail view with tabs
├── OpportunitySlideOver.tsx    # Quick view/edit panel
├── OpportunityRowListView.tsx  # Table view with bulk actions
├── BulkActionsToolbar.tsx      # Bulk stage/status/owner
│
├── kanban/
│   ├── OpportunityListContent.tsx  # Kanban board wrapper
│   ├── OpportunityColumn.tsx       # Stage column
│   ├── OpportunityCard.tsx         # Draggable card (memoized)
│   ├── OpportunityCardActions.tsx  # Card menu
│   └── QuickAddOpportunity.tsx     # Inline quick add
│
├── quick-add/
│   ├── QuickAddButton.tsx      # Toolbar button
│   ├── QuickAddDialog.tsx      # Modal wrapper
│   └── QuickAddForm.tsx        # Trade show form
│
├── forms/
│   ├── OpportunityInputs.tsx   # Tabbed form wrapper
│   └── tabs/
│       ├── OpportunityGeneralTab.tsx
│       ├── OpportunityClassificationTab.tsx
│       ├── OpportunityRelationshipsTab.tsx
│       └── OpportunityDetailsTab.tsx
│
├── slideOverTabs/
│   ├── OpportunitySlideOverDetailsTab.tsx
│   ├── OpportunityContactsTab.tsx
│   ├── OpportunityProductsTab.tsx
│   └── OpportunityNotesTab.tsx
│
├── hooks/
│   ├── useStageMetrics.ts      # Stale detection (needs per-stage update)
│   ├── useColumnPreferences.ts # Kanban column settings
│   ├── useExportOpportunities.ts
│   ├── useFilteredProducts.ts
│   ├── useOpportunityContacts.ts
│   ├── useQuickAdd.ts
│   └── useAutoGenerateName.ts
│
├── constants/
│   ├── stageConstants.ts       # NEEDS UPDATE: Remove awaiting_response
│   ├── stages.ts               # Legacy wrapper
│   ├── filterChoices.ts
│   ├── filterPresets.ts
│   └── priorityChoices.ts
│
└── utils/
    ├── generateOpportunityName.ts
    ├── opportunityUtils.ts
    └── diffProducts.ts
```

---

## Test Coverage

From `src/atomic-crm/opportunities/__tests__/`:

| Test File | Coverage Area |
|-----------|---------------|
| `OpportunityList.test.tsx` | List rendering, view switching |
| `OpportunityList.spec.tsx` | E2E list operations |
| `OpportunityCreate.unit.test.tsx` | Form validation |
| `OpportunityCreate.spec.tsx` | E2E create flow |
| `OpportunityEdit.unit.test.tsx` | Edit form |
| `OpportunityShow.test.tsx` | Detail view |
| `OpportunityShow.spec.tsx` | E2E show page |
| `OpportunityCard.test.tsx` | Kanban card |
| `OpportunityCardActions.test.tsx` | Card menu |
| `OpportunityWorkflows.spec.tsx` | E2E workflows |
| `BulkActionsToolbar.test.tsx` | Bulk operations |
| `QuickAddButton.test.tsx` | Quick add button |
| `QuickAddDialog.test.tsx` | Quick add modal |
| `QuickAddForm.test.tsx` | Quick add form |
| `useStageMetrics.test.ts` | Stale detection hook |
| `useColumnPreferences.test.ts` | Column settings |
| `useOpportunityContacts.test.ts` | Contact fetching |
| `useQuickAdd.test.tsx` | Quick add hook |
| `useFilteredProducts.test.tsx` | Product filtering |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-28 | Initial audit with user-validated decisions. Identified 8 implementation gaps. |
