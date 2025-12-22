# Opportunity Pipeline Page - Product Requirements Document

**Version:** 1.1  
**Last Updated:** December 20, 2025  
**Status:** Ready for Implementation

---

## Executive Summary

The Opportunity Pipeline Page is the primary workspace for Account Managers (AMs) to track and manage sales opportunities across MFB's 9 principals. The design follows a **principal-centric philosophy** where opportunities are identified by their business relationship (Principal → Distributor → Operator) rather than arbitrary deal names.

**Primary user question to answer:** "What's the ONE thing I need to do this week for each principal?"

**Success metric:** % of opportunities closed (conversion rate)

---

## Existing Infrastructure (Already Implemented)

The following components already exist and will be **modified**, not rebuilt:

| Component | Location | Current State |
|-----------|----------|---------------|
| `OpportunityCard.tsx` | `src/atomic-crm/opportunities/kanban/` | Expandable card with ActivityPulseDot |
| `OpportunitySlideOver.tsx` | `src/atomic-crm/opportunities/` | 4-tab interface (Details, Contacts, Products, Notes) |
| `OpportunityListContent.tsx` | `src/atomic-crm/opportunities/kanban/` | DragDropContext with stage columns |
| `OpportunityColumn.tsx` | `src/atomic-crm/opportunities/kanban/` | Droppable column with metrics |
| `opportunities_summary` view | `supabase/migrations/` | Includes `days_in_stage` computed column |
| `stage_changed_at` column | `opportunities` table | Tracks stage entry timestamp |
| `STUCK_THRESHOLD_DAYS` | `useStageMetrics.ts` | Single threshold (needs per-stage) |

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Principal-centric** | Cards identified by brand relationship, not deal names |
| **Attention by stagnation** | Alerts based on stage duration, not activity recency |
| **Focus over completeness** | Show 4 fields per card, details in slide-over |
| **iPad-first responsive** | 2-3 visible columns, horizontal snap-scroll |
| **Touch-friendly** | 48px minimum touch targets (existing: 44px) |
| **Semantic colors only** | Use `bg-primary`, `text-destructive`, etc. (per Engineering Constitution) |

---

## User Context

| Attribute | Value |
|-----------|-------|
| **Primary users** | 6 Account Managers |
| **Principals managed** | 9 brands (McCRUM, SWAP, Rapid Rasoi, etc.) |
| **Distributors** | 50+ (Sysco, USF, PFG, GFS, etc.) |
| **Primary device** | iPad (landscape and portrait) |
| **Secondary device** | Desktop |
| **Typical active opportunities** | 25-50 per AM |
| **Active stages at once** | 3-4 (deals cluster in mid-funnel) |

---

## Pipeline Stages

### Current State vs Target State

| Aspect | Current (`useStageMetrics.ts`) | Target (This PRD) |
|--------|-------------------------------|-------------------|
| Threshold source | `STUCK_THRESHOLD_DAYS = 14` (single constant) | Per-stage config |
| Attention signal | `ActivityPulseDot` (days since activity) | Stage duration dot |
| Card primary field | `record.name` (opportunity name) | Principal → Distributor → Operator |

### Stage Configuration (New)

| Stage | Display Name | Rotting Threshold | Sort Order |
|-------|--------------|-------------------|------------|
| `new_lead` | New Lead | **7 days** | 1 |
| `initial_outreach` | Initial Outreach | **10 days** | 2 |
| `sample_visit_offered` | Sample Visit Offered | **14 days** | 3 |
| `feedback_logged` | Feedback Logged | **7 days** | 4 |
| `demo_scheduled` | Demo Scheduled | **5 days** | 5 |
| `closed_won` | Closed Won | N/A (no rotting) | 6 |
| `closed_lost` | Closed Lost | N/A (no rotting) | 7 |

### Implementation: Stage Thresholds

**Option A: TypeScript constants (recommended for MVP)**

```typescript
// src/atomic-crm/opportunities/constants/stageThresholds.ts
export const STAGE_ROTTING_THRESHOLDS: Record<string, number | null> = {
  new_lead: 7,
  initial_outreach: 10,
  sample_visit_offered: 14,
  feedback_logged: 7,
  demo_scheduled: 5,
  closed_won: null,
  closed_lost: null,
};

export function isRotting(stage: string, daysInStage: number): boolean {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage];
  return threshold !== null && daysInStage > threshold;
}

export function getWarningThreshold(stage: string): number | null {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage];
  return threshold !== null ? Math.floor(threshold * 0.75) : null;
}
```

**Option B: Database table (future - enables admin configuration)**

```sql
-- Only if AMs need to customize thresholds without code changes
CREATE TABLE stage_config (
  stage TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  rotting_threshold_days INTEGER,
  sort_order INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE
);
```

### Stage Behavior

- **Drag-and-drop** between stages updates `stage` and `stage_changed_at` timestamp (already implemented)
- **Rotting calculation:** `days_in_stage > STAGE_ROTTING_THRESHOLDS[stage]`
- **Closed stages** (`closed_won`, `closed_lost`) are collapsible by default (already implemented)

---

## Opportunity Card Design

### Current vs Target Card Comparison

**Current `OpportunityCard.tsx` structure:**
```
┌────────────────────────────────────┐
│ ⋮  🟢  Sysco Q1 Placement      ▼ ⋯│  ← Grip + ActivityPulseDot + NAME + expand + actions
└────────────────────────────────────┘
     ↑                            ↑
     Activity recency dot         Expand toggle (reveals details)
```

**Target card structure (no expand for collapsed):**
```
┌────────────────────────────────────┐
│ ████ McCRUM                     ⋯ │  ← Principal + color stripe + actions
│ Sysco Foods                       │  ← Distributor  
│ Chili's Corporate                 │  ← Operator (customer)
│ 🔴 12 days                        │  ← Days in stage + status dot
└────────────────────────────────────┘
```

### Key Changes to OpportunityCard.tsx

| Current | Target | Rationale |
|---------|--------|-----------|
| `record.name` as primary | Principal → Distributor → Operator | Principal-centric identity |
| `ActivityPulseDot` (activity recency) | `StageStatusDot` (stage duration) | Attention = stuck, not inactive |
| Expand/collapse toggle | Always show 4 fields | No name to truncate |
| Drag handle visible | Keep drag handle | Still need drag-and-drop |
| Card click → slide-over | Keep slide-over | Already works well |

### Card Identification

Opportunities are identified by their business relationship, not a name field:

```
┌────────────────────────────┐
│ ████ McCRUM                │  ← Principal (with color stripe)
│ Sysco Foods                │  ← Distributor
│ Chili's Corporate          │  ← Operator
│ 🔴 12 days                 │  ← Days in stage + status indicator
└────────────────────────────┘
```

### Card Fields (4 total)

| Priority | Field | Source | Display |
|----------|-------|--------|---------|
| 1 | **Principal** | `principal.name` | Text + 4px color stripe on left edge |
| 2 | **Distributor** | `distributor.name` | Text, truncate with ellipsis |
| 3 | **Operator** | `operator.name` | Text, truncate with ellipsis |
| 4 | **Days in Stage** | Calculated from `stage_changed_at` | Number + status dot |

### Status Indicator Logic

The status dot appears next to "days in stage" and signals attention level:

| Status | Color | Condition |
|--------|-------|-----------|
| **Rotting** | Red (`bg-destructive`) | `days_in_stage > stage.rotting_threshold` |
| **Expired Close Date** | Red (`bg-destructive`) | `expected_close_date < today` |
| **Warning** | Yellow (`bg-warning`) | `days_in_stage > (stage.rotting_threshold * 0.75)` |
| **Healthy** | Green (`bg-success`) | Neither condition above |
| **N/A** | Grey (`bg-muted`) | Closed stages (won/lost) |

### Card Sorting Within Columns

Cards auto-sort within each stage column by priority:

1. **Red (rotting/expired)** - top of column
2. **Yellow (warning)** - middle
3. **Green (healthy)** - bottom
4. **Within each group:** Sort by `days_in_stage` descending (oldest first)

### Card Sizing

| Breakpoint | Card Width | Card Height | Visible Columns |
|------------|------------|-------------|-----------------|
| Desktop (≥1200px) | 280px | 96px | 5-7 |
| iPad Landscape (1024-1199px) | 300px | 96px | 3 + peek |
| iPad Portrait (768-1023px) | 320px | 96px | 2 + peek |

### Principal Color Mapping

Each principal gets a unique color from the OKLCH color system. Based on the existing design system (hue 142° forest green family, hue 72° clay family):

| Principal | CSS Variable | OKLCH Value | Visual |
|-----------|--------------|-------------|--------|
| McCRUM | `--principal-mccrum` | `oklch(45% 0.12 142)` | Forest green |
| SWAP | `--principal-swap` | `oklch(55% 0.10 72)` | Clay/terracotta |
| Rapid Rasoi | `--principal-rapid-rasoi` | `oklch(50% 0.11 280)` | Blue-violet |
| *(6 more principals)* | ... | ... | ... |

**Implementation in `src/index.css`:**

```css
:root {
  /* Principal brand colors - used for card left border stripe */
  --principal-mccrum: oklch(45% 0.12 142);
  --principal-swap: oklch(55% 0.10 72);
  --principal-rapid-rasoi: oklch(50% 0.11 280);
  /* Add remaining 6 principals */
}
```

**Usage in OpportunityCard.tsx:**

```tsx
// Map principal org ID to slug for CSS variable lookup
const principalSlug = record.principal_organization_name?.toLowerCase().replace(/\s+/g, '-');

<div 
  className="border-l-4 rounded-lg bg-card p-3"
  style={{ borderLeftColor: `var(--principal-${principalSlug}, var(--border))` }}
>
```

**Alternative: Database-stored colors**

If principals need admin-configurable colors, add column to organizations table:

```sql
ALTER TABLE organizations ADD COLUMN brand_color TEXT;
-- Example: 'oklch(45% 0.12 142)'
```

---

## Pipeline Views

### View 1: Stage View (Default)

Traditional Kanban with columns representing pipeline stages.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Filter: All Principals ▼] [Filter: My Opportunities ▼]    [⊞ Grid] [☰]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   New Lead (3)        Initial Outreach (5)    Sample Visit Off...      │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐        ┌──────────────┐         │
│   │████ McCRUM   │    │████ SWAP     │        │████ Rapid R  │         │
│   │Sysco Foods   │    │USF           │        │PFG           │         │
│   │Applebee's    │    │Denny's Corp  │        │Waffle House  │         │
│   │🔴 12 days    │    │🟡 8 days     │        │🟢 3 days     │         │
│   └──────────────┘    └──────────────┘        └──────────────┘         │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐                                 │
│   │████ SWAP     │    │████ McCRUM   │                                 │
│   │GFS           │    │Sysco Foods   │                        ┌───┐    │
│   │Cracker Barrel│    │Chili's       │                        │ ≡ │    │
│   │🟢 2 days     │    │🟢 4 days     │                        └───┘    │
│   └──────────────┘    └──────────────┘                                 │
│                                                                         │
│ [New Lead] [Outreach] [Sample ▼] [Feedback ▼] [Demo] [Won ✓] [Lost ✓]  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal snap-scroll between columns
- Stage chips at bottom for quick navigation (tap to scroll)
- Column headers show stage name + count
- Closed stages collapsed by default (show as chips only)
- Peek affordance (partial column visible) indicates more content

### View 2: Principal View (Alternate)

Groups opportunities by principal instead of stage - directly answers "What's the ONE thing for each principal?"

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Filter: All Stages ▼] [Filter: My Opportunities ▼]    [⊞ Grid] [☰ ●]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   McCRUM (4)              SWAP (3)                Rapid Rasoi (2)      │
│                                                                         │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐     │
│   │Sysco Foods   │        │USF           │        │PFG           │     │
│   │Applebee's    │        │Denny's Corp  │        │Waffle House  │     │
│   │Sample Visit  │        │Outreach      │        │Demo Sched    │     │
│   │🔴 12 days    │        │🟡 8 days     │        │🟢 3 days     │     │
│   └──────────────┘        └──────────────┘        └──────────────┘     │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐     │
│   │Sysco Foods   │        │GFS           │        │Sysco Foods   │     │
│   │Chili's       │        │Cracker Barrel│        │IHOP          │     │
│   │Outreach      │        │New Lead      │        │Feedback      │     │
│   │🟢 4 days     │        │🟢 2 days     │        │🟢 1 day      │     │
│   └──────────────┘        └──────────────┘        └──────────────┘     │
│   ...                     ...                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Card modification for Principal View:**

Since column IS the principal, cards show stage instead:

```
┌────────────────────────────┐
│ Sysco Foods                │  ← Distributor
│ Applebee's                 │  ← Operator  
│ Sample Visit Offered       │  ← Stage name
│ 🔴 12 days                 │  ← Days in stage + status
└────────────────────────────┘
```

**Sorting within Principal columns:**
1. Red (rotting/expired) first
2. Then by stage order (earlier stages first)
3. Then by days in stage descending

**Purpose:** Scan left-to-right to see top priority for each principal.

### View Toggle

Toggle between views using segmented control or icon buttons:

```
[⊞ Stage View] [☰ Principal View]
```

- Default: Stage View
- Selection persists in user preferences
- URL reflects view: `/opportunities?view=stage` or `/opportunities?view=principal`

---

## Slide-Over Panel

When user taps a card, a slide-over panel appears from the right edge.

### Panel Dimensions

| Breakpoint | Panel Width | Behavior |
|------------|-------------|----------|
| Desktop | 480px | Overlays pipeline, click outside to close |
| iPad Landscape | 400px | Overlays pipeline |
| iPad Portrait | 100% width | Full-screen take-over with back button |

### Panel Content

```
┌─────────────────────────────────────┐
│ ← Back                    [Edit] [⋮]│
├─────────────────────────────────────┤
│                                     │
│ ████████████████████████████████████│  ← Principal color bar
│                                     │
│ McCRUM                              │  ← Principal name (large)
│ Sysco Foods → Applebee's            │  ← Distributor → Operator
│                                     │
├─────────────────────────────────────┤
│ Stage                               │
│ [New] [Outreach] [Sample ●] [Feed]  │  ← Tappable stage chips
│                                     │
├─────────────────────────────────────┤
│ Details                             │
│                                     │
│ Days in Stage        12 days 🔴     │
│ Expected Close       Jan 15, 2026   │
│ Primary Contact      John Smith     │
│ Contact Company      Sysco Foods    │
│ Created              Dec 1, 2025    │
│ Owner                Sarah M.       │
│                                     │
├─────────────────────────────────────┤
│ Recent Activity                     │
│                                     │
│ 📞 Call - Dec 8                     │
│    Discussed sample delivery...     │
│                                     │
│ 📧 Email - Dec 5                    │
│    Sent product specs...            │
│                                     │
│ [View All Activities]               │
│                                     │
├─────────────────────────────────────┤
│ Notes                               │
│ Decision maker is regional buyer... │
│ [View All Notes]                    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ [+ Log Activity]  [+ Add Task]      │
│                                     │
└─────────────────────────────────────┘
```

### Panel Actions

| Action | Behavior |
|--------|----------|
| **Back arrow / swipe right** | Close panel, return to pipeline |
| **Edit button** | Opens full edit form (modal or page) |
| **Stage chips** | Tap to change stage (with confirmation) |
| **Log Activity** | Opens quick activity form (modal) |
| **Add Task** | Opens quick task form (modal) |
| **Overflow menu (⋮)** | Mark won, Mark lost, Delete |

---

## Filtering

### Filter Bar

Located above the pipeline, persistent across both views.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Principal: All ▼] [Owner: Mine ▼] [Attention: All ▼]     [Clear All]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Filter Options

**Principal Filter:**
- All Principals (default)
- Individual principal selection (multi-select)
- Shows principal color chip next to name

**Owner Filter:**
- My Opportunities (default for AMs)
- All Opportunities
- Specific owner (admin view)

**Attention Filter:**
- All (default)
- Needs Attention (rotting OR expired close date)
- Healthy Only

### Filter Persistence

- Filters persist within session
- Reset on page reload
- URL reflects filters: `/opportunities?principal=mccrum&owner=me&attention=needs`

---

## Stage Navigation (Mobile/iPad)

### Collapsible Stage Chips

For iPad/mobile, show stage chips as navigation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [New 3] [Outreach 5] [▼Sample 2] [▼Feedback 4] [Demo 1] [Won ✓] [Lost ✓]│
└─────────────────────────────────────────────────────────────────────────┘
```

| Chip State | Meaning |
|------------|---------|
| `[Stage N]` | Collapsed - tap to expand/scroll to |
| `[▼Stage N]` | Currently expanded/visible |
| `[Stage ✓]` | Closed stages (won/lost) - collapsed by default |
| Badge number | Count of opportunities in stage |

**Behavior:**
- Tap collapsed chip → Smooth scroll to that column
- Tap expanded chip → No action (already visible)
- Chips highlight based on which columns are in viewport

### Stage Picker FAB (Optional)

Floating action button for quick stage navigation:

```
                                    ┌───┐
                                    │ ≡ │
                                    └───┘
```

Tap opens stage list overlay for jump navigation.

---

## Responsive Behavior

### Breakpoint Summary

| Breakpoint | Layout | Columns | Cards | Navigation |
|------------|--------|---------|-------|------------|
| ≥1200px | Full board | All 7 visible | Full width 280px | Scroll optional |
| 1024-1199px | Scroll board | 3 + peek | 300px | Stage chips + scroll |
| 768-1023px | Scroll board | 2 + peek | 320px | Stage chips + scroll |
| <768px | Single column | 1 | Full width | Stage dropdown |

### Horizontal Scroll Behavior

- **Snap points:** Columns snap to left edge
- **Momentum:** iOS-style momentum scrolling
- **Peek:** 20-30px of next column visible as affordance
- **Indicators:** Optional dot indicators below board

---

## Data Requirements

### Opportunity Fields Used

| Field | Type | Used For |
|-------|------|----------|
| `id` | UUID | Unique identifier |
| `principal_id` | FK → principals | Card display, grouping, filtering |
| `distributor_id` | FK → organizations | Card display |
| `operator_id` | FK → organizations | Card display |
| `stage` | Enum | Column placement, stage chips |
| `stage_changed_at` | Timestamp | Days in stage calculation |
| `expected_close_date` | Date | Expired close date status |
| `owner_id` | FK → users | Filtering |
| `created_at` | Timestamp | Sorting fallback |

### Calculated Fields

| Field | Calculation |
|-------|-------------|
| `days_in_stage` | `CURRENT_DATE - stage_changed_at::date` |
| `is_rotting` | `days_in_stage > stages.rotting_threshold` |
| `is_expired` | `expected_close_date < CURRENT_DATE` |
| `needs_attention` | `is_rotting OR is_expired` |
| `status` | Derived from is_rotting, is_expired, warning threshold |

### Stage Configuration Table

New table or config for stage thresholds:

```sql
CREATE TABLE stage_config (
  stage TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  rotting_threshold_days INTEGER,
  sort_order INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE
);

INSERT INTO stage_config VALUES
  ('new_lead', 'New Lead', 7, 1, false),
  ('initial_outreach', 'Initial Outreach', 10, 2, false),
  ('sample_visit_offered', 'Sample Visit Offered', 14, 3, false),
  ('feedback_logged', 'Feedback Logged', 7, 4, false),
  ('demo_scheduled', 'Demo Scheduled', 5, 5, false),
  ('closed_won', 'Closed Won', NULL, 6, true),
  ('closed_lost', 'Closed Lost', NULL, 7, true);
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Touch targets | Minimum 48px (cards, buttons, chips) |
| Color contrast | WCAG 2.1 AA (4.5:1 for text) |
| Status indicators | Color + icon (not color alone) |
| Screen reader | Cards announce: Principal, Distributor, Operator, Stage, Status |
| Keyboard navigation | Tab through cards, Enter to open, Escape to close |
| Focus visible | Visible focus ring on all interactive elements |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Conversion rate** | Increase % of closed_won | `closed_won / total_closed * 100` |
| **Pipeline velocity** | Reduce avg days in stage | Average `days_in_stage` at stage exit |
| **Adoption** | 100% within 30 days | Daily active users / total AMs |
| **Time to answer** | <2 seconds | Time to identify weekly priority per principal |
| **Rotting deals** | <10% of pipeline | `needs_attention / total_open * 100` |

---

## Out of Scope (v1)

The following are explicitly NOT included in v1:

- Bulk actions (multi-select cards)
- Inline editing on cards
- Custom fields on cards
- Saved filter views
- Export to Excel
- Pipeline analytics/charts
- Email integration
- Activity reminders/notifications
- Weighted pipeline values
- Win probability scoring

---

## Implementation Phases

### Phase 1: Card Redesign (MVP)

**Goal:** Transform existing cards from name-based to principal-centric identity

| Task | File | Change Type |
|------|------|-------------|
| Add per-stage thresholds | `constants/stageThresholds.ts` | **Create** |
| Create StageStatusDot | `kanban/StageStatusDot.tsx` | **Create** (replace ActivityPulseDot) |
| Modify card layout | `kanban/OpportunityCard.tsx` | **Modify** (Principal → Distributor → Operator) |
| Add principal colors | `src/index.css` | **Modify** (add CSS variables) |
| Update card sorting | `kanban/OpportunityListContent.tsx` | **Modify** (sort by status) |
| Remove expand toggle | `kanban/OpportunityCard.tsx` | **Modify** |

**Acceptance Criteria:**
- Cards show Principal/Distributor/Operator (no name)
- Status dot reflects stage-specific thresholds
- Principal color stripe visible on left edge
- Red cards sort to top of each column

### Phase 2: Principal View

**Goal:** Add alternate grouping to answer "one thing per principal"

| Task | File | Change Type |
|------|------|-------------|
| Create PrincipalViewContent | `kanban/PrincipalViewContent.tsx` | **Create** |
| Add view toggle | `OpportunityActions.tsx` | **Modify** |
| Create principal columns | `kanban/PrincipalColumn.tsx` | **Create** |
| Modified card for principal view | (reuse OpportunityCard with prop) | **Modify** |

### Phase 3: iPad Optimization

**Goal:** Improve experience on 768-1024px viewports

| Task | File | Change Type |
|------|------|-------------|
| Horizontal snap-scroll | `kanban/OpportunityListContent.tsx` | **Modify** |
| Stage chips navigation | `kanban/StageNavigationChips.tsx` | **Create** |
| Responsive card sizing | `kanban/OpportunityCard.tsx` | **Modify** |
| Peek affordance (gradient) | `kanban/OpportunityListContent.tsx` | **Modify** |

### Phase 4: Slide-Over Enhancements (Already Partially Done)

**Goal:** Quick actions without leaving pipeline

| Task | File | Status |
|------|------|--------|
| Tabbed interface | `OpportunitySlideOver.tsx` | ✅ Already implemented |
| Stage change via chips | `slideOverTabs/OpportunitySlideOverDetailsTab.tsx` | **Enhance** |
| Quick log activity | (new component in slide-over) | **Create** |

---

## Open Questions

1. **Principal colors:** Need final color assignments for 9 principals (suggest using OKLCH hue rotation)
2. **Empty states:** What to show when a stage has no opportunities? (current: nothing)
3. **Drag feedback:** Keep existing drag feedback or enhance?
4. **Undo:** Should stage changes be undoable? (snackbar with undo action)
5. **Expand toggle:** Remove entirely or keep for additional details?

---

## Appendix: Component Inventory

### Existing Components (Modify)

| Component | Location | Modification Needed |
|-----------|----------|---------------------|
| `OpportunityCard.tsx` | `src/atomic-crm/opportunities/kanban/` | Replace name with Principal/Dist/Operator, swap ActivityPulseDot |
| `OpportunityColumn.tsx` | `src/atomic-crm/opportunities/kanban/` | Update sorting logic |
| `OpportunityListContent.tsx` | `src/atomic-crm/opportunities/kanban/` | Add snap-scroll, status sorting |
| `OpportunitySlideOver.tsx` | `src/atomic-crm/opportunities/` | Already 4-tab, enhance stage chips |
| `ActivityPulseDot.tsx` | `src/atomic-crm/opportunities/kanban/` | Replace with StageStatusDot |
| `useStageMetrics.ts` | `src/atomic-crm/opportunities/hooks/` | Use per-stage thresholds |

### New Components (Create)

| Component | Location | Purpose |
|-----------|----------|---------|
| `StageStatusDot.tsx` | `src/atomic-crm/opportunities/kanban/` | Stage-duration-based status indicator |
| `stageThresholds.ts` | `src/atomic-crm/opportunities/constants/` | Per-stage rotting thresholds |
| `PrincipalViewContent.tsx` | `src/atomic-crm/opportunities/kanban/` | Principal-grouped Kanban |
| `PrincipalColumn.tsx` | `src/atomic-crm/opportunities/kanban/` | Column for principal grouping |
| `StageNavigationChips.tsx` | `src/atomic-crm/opportunities/kanban/` | iPad stage navigation |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 20, 2025 | Claude | Initial PRD based on AM feedback |
| 1.1 | Dec 20, 2025 | Claude | Updated with existing codebase patterns from project knowledge |