# Kanban Board Component Architecture Research

**Research Date:** 2025-10-10
**Focus:** Opportunity Kanban board component structure and styling analysis

## Executive Summary

The Atomic CRM Kanban board is a 4-component hierarchy that transforms flat opportunity data into a stage-based visualization. The architecture follows React Admin patterns with shadcn/ui primitives and uses Tailwind CSS 4 semantic variables for styling.

## Component Hierarchy

```
OpportunityList (Container)
  └─ OpportunityListContent (Stage Container)
      └─ OpportunityColumn (Stage Column)
          └─ OpportunityCard (Individual Opportunity)
```

## Component Analysis

### 1. OpportunityList.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`

**Primary Responsibility:**
Top-level React Admin `<List>` wrapper that configures data fetching, filtering, and provides layout structure for the Kanban view.

**Key Props:**
- None (uses React Admin context)

**Key Configuration (lines 34-44):**
```tsx
<List
  perPage={100}
  filter={{ "deleted_at@is": null }}  // Hide deleted opportunities
  title={false}
  sort={{ field: "index", order: "DESC" }}
  filters={opportunityFilters}
  actions={<OpportunityActions />}
  pagination={null}  // No pagination for Kanban
>
```

**Component Structure:**
- `OpportunityList` (lines 24-57): Main export, sets up React Admin List
- `OpportunityLayout` (lines 59-86): Conditional renderer that shows empty state or Kanban board
- `OpportunityActions` (lines 88-96): Top toolbar with FilterButton, ExportButton, CreateButton

**Data Flow Integration:**
- Uses `useOpportunityFilters()` hook (line 31) for filter configuration
- Monitors stage filter changes via `useEffect` (lines 64-68) to persist preferences
- Passes data to `<OpportunityListContent />` via React Admin context

**Relationships:**
- **Parent:** React Admin `<Resource>` component
- **Children:**
  - `<FilterChipsPanel>` (line 53) - Shows active filters
  - `<OpportunityLayout>` (line 54) - Renders empty state or content
  - `<OpportunityArchivedList>` (lines 75, 83) - Archived opportunities dialog

**Current Styling:**
- Minimal - delegates to children
- `className="w-full"` on wrapper div (line 81)

---

### 2. OpportunityListContent.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`

**Primary Responsibility:**
Transforms flat opportunity array into stage-grouped data structure and renders OpportunityColumn for each visible stage.

**Key Props:**
- None (uses React Admin `useListContext` hook)

**Data Transformation (lines 25-41):**
```tsx
const [opportunitiesByStage, setOpportunitiesByStage] =
  useState<OpportunitiesByStage>(
    getOpportunitiesByStage([], allOpportunityStages)
  );

useEffect(() => {
  if (unorderedOpportunities) {
    const newOpportunitiesByStage = getOpportunitiesByStage(
      unorderedOpportunities,
      allOpportunityStages
    );
    if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
      setOpportunitiesByStage(newOpportunitiesByStage);
    }
  }
}, [unorderedOpportunities]);
```

**Stage Filtering (lines 21-23):**
```tsx
const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage)
  && filterValues.stage.length > 0
    ? allOpportunityStages.filter((stage) => filterValues.stage.includes(stage.value))
    : allOpportunityStages;
```

**Render Logic (lines 45-55):**
```tsx
return (
  <div className="flex gap-4 overflow-x-auto">
    {visibleStages.map((stage) => (
      <OpportunityColumn
        stage={stage.value}
        opportunities={opportunitiesByStage[stage.value]}
        key={stage.value}
      />
    ))}
  </div>
);
```

**Relationships:**
- **Parent:** `OpportunityLayout` component
- **Children:** `<OpportunityColumn>` (one per stage)
- **Data Flow:** Gets data from `useListContext`, transforms via `getOpportunitiesByStage`, passes arrays to columns

**Current Styling:**
- `flex gap-4 overflow-x-auto` (line 46) - Horizontal scrolling layout
- 4-unit gap (16px) between columns

**Key Dependencies:**
- `getOpportunitiesByStage` function from `./stages.ts`
- `OPPORTUNITY_STAGES_LEGACY` from `./stageConstants.ts`

---

### 3. OpportunityColumn.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Primary Responsibility:**
Renders a single Kanban column representing one pipeline stage with header and opportunity cards.

**Key Props (lines 5-11):**
```tsx
{
  stage: string;              // Stage value (e.g., "new_lead")
  opportunities: Opportunity[]; // Array of opportunities in this stage
}
```

**Component Structure (lines 12-29):**
```tsx
return (
  <div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
    <div className="flex flex-col items-center">
      <h3 className="text-base font-medium">
        {getOpportunityStageLabel(stage)}
      </h3>
    </div>
    <div className="flex flex-col rounded-2xl mt-2 gap-2">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
        />
      ))}
    </div>
  </div>
);
```

**Relationships:**
- **Parent:** `OpportunityListContent` component
- **Children:** Multiple `<OpportunityCard>` components (one per opportunity)
- **Data Flow:** Receives opportunity array, maps to cards

**Current Styling Analysis:**

**Outer Container (line 13):**
- `flex-1` - Flex growth to fill available space
- `pb-8` - Bottom padding (32px)
- `min-w-[160px]` - Minimum column width
- `max-w-[220px]` - Maximum column width

**Header Container (line 14):**
- `flex flex-col items-center` - Centered column header

**Header Text (line 15):**
- `text-base font-medium` - 16px medium weight

**Card Container (line 19):**
- `flex flex-col` - Vertical card stacking
- `rounded-2xl` - Rounded corners (16px)
- `mt-2` - Top margin (8px)
- `gap-2` - 8px gap between cards

**Key Dependencies:**
- `getOpportunityStageLabel` from `./stageConstants.ts`

---

### 4. OpportunityCard.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

**Primary Responsibility:**
Displays individual opportunity as an interactive card with avatar, name, and priority badge.

**Key Props (lines 8-12):**
```tsx
{
  opportunity: Opportunity; // Full opportunity record
}
```

**Component Structure:**

**Wrapper Component (lines 8-16):**
```tsx
export const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  if (!opportunity) return null;
  return <OpportunityCardContent opportunity={opportunity} />;
};
```

**Main Content Component (lines 18-96):**

**Click Handler (lines 23-34):**
```tsx
const redirect = useRedirect();
const handleClick = () => {
  redirect(
    `/opportunities/${opportunity.id}/show`,
    undefined,
    undefined,
    undefined,
    { _scrollToTop: false }
  );
};
```

**Priority Variant Mapping (lines 43-56):**
```tsx
const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "critical": return "destructive";
    case "high": return "default";
    case "medium": return "secondary";
    case "low": return "outline";
    default: return "outline";
  }
};
```

**Render Structure (lines 58-95):**
```tsx
<div className="cursor-pointer" onClick={handleClick} onKeyDown={handleKeyDown}
     role="button" tabIndex={0}>
  <Card className="py-2 transition-all duration-200 shadow-sm hover:shadow-md">
    <CardContent className="px-3 flex">

      {/* Organization Avatar */}
      <ReferenceField source="customer_organization_id" record={opportunity}
                      reference="organizations" link={false}>
        <OrganizationAvatar width={16} height={16} />
      </ReferenceField>

      {/* Content Area */}
      <div className="ml-2 flex-1">

        {/* Name and Priority Badge */}
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-medium line-clamp-2">
            {opportunity.name}
          </p>
          <Badge variant={getPriorityVariant(opportunity.priority)}
                 className="text-xs ml-1 px-1 py-0">
            {opportunity.priority}
          </Badge>
        </div>

        {/* Principal Badge (conditional) */}
        {opportunity.principal_organization_id && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            Principal
          </Badge>
        )}

      </div>
    </CardContent>
  </Card>
</div>
```

**Relationships:**
- **Parent:** `OpportunityColumn` component
- **Children:**
  - `<Card>` from shadcn/ui (base component)
  - `<CardContent>` from shadcn/ui
  - `<ReferenceField>` from React Admin (lines 68-75)
  - `<OrganizationAvatar>` custom component (line 74)
  - `<Badge>` from shadcn/ui (lines 79-84, 87-89)
- **Data Flow:** Receives full opportunity object, displays selected fields

**Current Styling Analysis:**

**Clickable Wrapper (line 59):**
- `cursor-pointer` - Hand cursor on hover
- Keyboard accessible with `role="button"` and `tabIndex={0}`

**Card Base (line 66):**
- `py-2` - Vertical padding (8px)
- `transition-all duration-200` - Smooth transitions (200ms)
- `shadow-sm` - Small shadow (base state)
- `hover:shadow-md` - Medium shadow on hover

**Card Content (line 67):**
- `px-3` - Horizontal padding (12px)
- `flex` - Horizontal layout

**Content Container (line 76):**
- `ml-2` - Left margin (8px) from avatar
- `flex-1` - Flex growth to fill space

**Header Layout (line 77):**
- `flex justify-between items-start` - Space between name and badge
- `mb-1` - Bottom margin (4px)

**Name Text (line 78):**
- `text-xs` - Extra small text (12px)
- `font-medium` - Medium weight
- `line-clamp-2` - Truncate to 2 lines

**Priority Badge (lines 79-84):**
- `text-xs` - Extra small text (12px)
- `ml-1` - Left margin (4px)
- `px-1 py-0` - Minimal padding
- Dynamic variant based on priority

**Principal Badge (lines 87-89):**
- `variant="outline"` - Outlined style
- `text-xs px-1 py-0` - Minimal size and padding

**Key Dependencies:**
- `Card`, `CardContent` from `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`
- `Badge` from `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`
- `ReferenceField` from React Admin admin layer
- `OrganizationAvatar` from `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationAvatar.tsx`

---

## Supporting Components

### OrganizationAvatar.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationAvatar.tsx`

**Usage in Kanban:** Displays organization logo/fallback in OpportunityCard

**Props:**
```tsx
{
  record?: Company;
  width?: 20 | 40;  // Used in OpportunityCard: width={16}, height={16}
  height?: 20 | 40;
}
```

**Styling (lines 11-29):**
- Dynamic sizing: `w-[20px] h-[20px]` for small, `w-10 h-10` for large
- Uses shadcn/ui `<Avatar>` component with image and fallback
- Fallback shows first character of organization name

---

### FilterChipsPanel.tsx

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx`

**Usage in Kanban:** Displays active filters above the board (line 53 in OpportunityList)

**Styling:**
- Accordion-based collapsible panel
- `mb-4` margin below panel (16px)
- Flex wrap for filter chips with `gap-2`

---

## Data Flow Architecture

### Stage Grouping Process

**Step 1: Fetch (OpportunityList)**
```
React Admin <List> → useListContext → Raw opportunity array
Sort: field="index", order="DESC"
Filter: deleted_at@is=null
```

**Step 2: Transform (OpportunityListContent)**
```
Raw opportunities → getOpportunitiesByStage() → OpportunitiesByStage
Type: Record<Opportunity["stage"], Opportunity[]>

Function logic (stages.ts, lines 6-45):
1. Create empty array for each stage
2. Group opportunities by stage value
3. Sort each stage's opportunities by index field (ascending)
```

**Step 3: Filter Stages (OpportunityListContent)**
```
Check filterValues.stage array
→ If present: show only selected stages
→ If empty: show all stages
```

**Step 4: Render Columns (OpportunityListContent)**
```
Map visibleStages → <OpportunityColumn> per stage
Pass: stage value + opportunities array
```

**Step 5: Render Cards (OpportunityColumn)**
```
Map opportunities → <OpportunityCard> per opportunity
Pass: full opportunity object
```

**Step 6: Display (OpportunityCard)**
```
Extract fields:
- customer_organization_id → <OrganizationAvatar>
- name → Card title
- priority → <Badge> variant
- principal_organization_id → conditional <Badge>
```

### Filter Integration

**Filter Sources:**
- `useOpportunityFilters()` hook provides filter configuration
- `FilterChipsPanel` displays active filters as removable chips
- `filterValues.stage` array controls visible columns
- Stage preferences persisted to localStorage (opportunityStagePreferences.ts)

---

## Type Definitions

### Opportunity Type

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` (lines 193-219)

**Key Fields Used in Kanban:**
```typescript
type Opportunity = {
  id: Identifier;
  name: string;                           // Card title
  customer_organization_id: Identifier;   // Organization avatar
  principal_organization_id?: Identifier; // Principal badge
  stage: OpportunityStageValue;           // Column placement
  priority: "low" | "medium" | "high" | "critical"; // Badge variant
  index: number;                          // Sort order within column
  deleted_at?: string;                    // Archive status
  // ... 15+ additional fields
}
```

### Stage Constants

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Stage Type (lines 6-11):**
```typescript
interface OpportunityStage {
  value: string;      // Database value (e.g., "new_lead")
  label: string;      // Display label (e.g., "New Lead")
  color: string;      // CSS variable (e.g., "var(--info-subtle)")
  description: string; // Stage description
}
```

**Available Stages (lines 23-72):**
1. `new_lead` - New Lead
2. `initial_outreach` - Initial Outreach
3. `sample_visit_offered` - Sample/Visit Offered
4. `awaiting_response` - Awaiting Response
5. `feedback_logged` - Feedback Logged
6. `demo_scheduled` - Demo Scheduled
7. `closed_won` - Closed - Won
8. `closed_lost` - Closed - Lost

**Helper Functions:**
- `getOpportunityStageLabel(stageValue)` - Get display label (line 75)
- `getOpportunityStageColor(stageValue)` - Get color variable (line 80)
- `isActiveStage(stageValue)` - Check if not closed (line 90)
- `isClosedStage(stageValue)` - Check if closed won/lost (line 94)

---

## Styling System

### Tailwind CSS 4 Approach

**Color System:**
- Semantic CSS variables only (per Engineering Constitution Rule #8)
- No hex codes allowed
- Variables defined in theme configuration

**Used Variables in Kanban:**
- Stage colors: `var(--info-subtle)`, `var(--tag-teal-bg)`, `var(--warning-subtle)`, `var(--purple)`, `var(--blue)`, `var(--success-subtle)`, `var(--success-strong)`, `var(--error-subtle)`
- Component colors: Handled by shadcn/ui variants (primary, destructive, secondary, outline)

### shadcn/ui Component Variants

**Card Component:**
- Base: `bg-card text-card-foreground rounded-xl border`
- Custom: `py-2 shadow-sm hover:shadow-md transition-all duration-200`

**Badge Component (badge.tsx, lines 7-26):**
- `default`: `bg-primary text-primary-foreground`
- `secondary`: `bg-secondary text-secondary-foreground`
- `destructive`: `bg-destructive text-white`
- `outline`: `text-foreground hover:bg-accent`

### Layout Classes

**Flexbox Usage:**
- OpportunityListContent: `flex gap-4 overflow-x-auto` (horizontal scroll)
- OpportunityColumn: `flex-1 min-w-[160px] max-w-[220px]` (constrained growth)
- OpportunityCard: `flex justify-between items-start` (header layout)

**Spacing Scale:**
- `gap-2` (8px) - Between cards in column
- `gap-4` (16px) - Between columns
- `mb-1` (4px) - Between card elements
- `mt-2` (8px) - Above card container
- `pb-8` (32px) - Bottom padding on columns

**Sizing Constraints:**
- Column: `min-w-[160px] max-w-[220px]`
- Avatar: `w-[20px] h-[20px]` (small) or `w-10 h-10` (large)
- Text: `text-xs` (12px), `text-base` (16px)

---

## Key Patterns and Conventions

### 1. React Admin Integration
- All components use React Admin context hooks (`useListContext`, `useRecordContext`, `useRedirect`)
- No props drilling for data
- ReferenceField for related entity rendering

### 2. Component Separation
- Wrapper component handles null checks
- Content component handles rendering logic
- Example: `OpportunityCard` → `OpportunityCardContent`

### 3. Accessibility
- Keyboard navigation: `role="button"`, `tabIndex={0}`, `onKeyDown` handlers
- ARIA attributes on base components
- Focus states via focus-visible variants

### 4. Performance Optimization
- `isEqual` check in useEffect to prevent unnecessary re-renders (OpportunityListContent, line 36)
- Key props on mapped components
- Minimal prop passing (only required data)

### 5. Stage Management
- Centralized constants in `stageConstants.ts`
- Helper functions for label/color lookup
- Legacy compatibility exports for existing components

### 6. Filter Persistence
- Stage filter choices saved to localStorage
- `saveStagePreferences()` called on filter change
- Enables user preference memory across sessions

---

## Current Limitations and Observations

### Layout Constraints
1. **Fixed Column Width:** `max-w-[220px]` limits card content
2. **Horizontal Scroll Only:** No column reordering or drag-and-drop
3. **Fixed Stage Order:** Stages render in array order, not customizable
4. **No Column Collapse:** All visible stages show regardless of content

### Depth and Visual Hierarchy
1. **Single Shadow Level:** Cards use `shadow-sm` → `hover:shadow-md` only
2. **No Z-Index Management:** No depth layering system
3. **Flat Badge Hierarchy:** Priority and principal badges same visual weight
4. **Minimal Hover States:** Only shadow change on card hover

### Interactivity
1. **Click-Only Navigation:** Cards redirect to show page on click
2. **No Inline Actions:** No edit/delete/archive from card
3. **No Drag-and-Drop:** Stage changes require edit form
4. **No Card Expansion:** No accordion or popover for more details

### Styling Flexibility
1. **Hardcoded Spacing:** All gaps and margins are fixed values
2. **No Density Options:** Can't toggle compact/comfortable/spacious view
3. **Limited Customization:** Stage colors defined but not applied to columns
4. **Avatar Size Mismatch:** `width={16}` passed but component accepts `20 | 40`

---

## File Dependencies Map

```
OpportunityList.tsx
├── @/components/admin/create-button
├── @/components/admin/export-button
├── @/components/admin/list
├── @/components/admin/filter-form (FilterButton)
├── @/components/admin/breadcrumb
├── ra-core (useGetIdentity, useListContext, useGetResourceLabel)
├── ./OpportunityArchivedList
├── ./OpportunityEmpty
├── ./OpportunityListContent
├── ../filters/FilterChipsPanel
├── ../filters/useOpportunityFilters
├── ../filters/opportunityStagePreferences (saveStagePreferences)
└── ../layout/TopToolbar

OpportunityListContent.tsx
├── lodash/isEqual
├── ra-core (useListContext)
├── ../types (Opportunity)
├── ./OpportunityColumn
├── ./stageConstants (OPPORTUNITY_STAGES_LEGACY)
└── ./stages (getOpportunitiesByStage, OpportunitiesByStage)

OpportunityColumn.tsx
├── ../types (Opportunity)
├── ./OpportunityCard
└── ./stageConstants (getOpportunityStageLabel)

OpportunityCard.tsx
├── @/components/admin/reference-field
├── @/components/ui/card (Card, CardContent)
├── @/components/ui/badge
├── ra-core (useRedirect)
├── ../organizations/OrganizationAvatar
└── ../types (Opportunity)

Supporting:
- stages.ts (data transformation)
- stageConstants.ts (stage definitions and helpers)
- OrganizationAvatar.tsx (avatar display)
- FilterChipsPanel.tsx (filter visualization)
```

---

## Recommendations for Depth Enhancement

Based on this architecture analysis, potential depth enhancements could include:

1. **Visual Depth System:**
   - Add z-index layers for elevated states (hover, drag, modal)
   - Implement 3-tier shadow system (rest, hover, active)
   - Add backdrop blur for floating elements

2. **Interactive Depth:**
   - Card expansion with slide-out panel or popover
   - Inline quick actions (edit, stage change, archive)
   - Nested information reveal (contacts, tasks, notes)

3. **Column Enhancements:**
   - Apply stage colors to column headers/backgrounds
   - Add column statistics (count, total value)
   - Collapsible columns for focused view

4. **Accessibility Improvements:**
   - Enhanced focus indicators with depth
   - Screen reader announcements for stage changes
   - Keyboard shortcuts for navigation

5. **Performance Considerations:**
   - Virtual scrolling for columns with many cards
   - Lazy loading for card details
   - Optimistic updates for stage changes

---

## Next Steps

This research document provides the foundation for:
1. Depth enhancement specification
2. Component refactoring proposals
3. Styling system improvements
4. Interaction pattern updates

Refer to this document when planning architectural changes to maintain consistency with existing patterns.
