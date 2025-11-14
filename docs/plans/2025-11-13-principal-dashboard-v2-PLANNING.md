# Principal Dashboard V2 - Planning Document

**Document Type:** Planning Only (No Code)
**For:** Contractor handoff / Execution planning
**Implementation Guide:** See `2025-11-13-principal-dashboard-v2.md` for detailed code examples

---

## Executive Summary

**Goal:** Replace current 70/30 dashboard layout with 3-column resizable layout featuring collapsible filters sidebar, opportunities hierarchy tree, tasks panel, quick activity logger, and right slide-over details panel.

**Business Driver:** 30-day Excel replacement goal; desktop-first design for B2B sales teams managing distributor/customer/principal relationships.

**Architecture:** Desktop-first (1440px+) responsive design using Tailwind v4 semantic utilities, shadcn/ui components, React Admin data provider (Supabase), localStorage persistence for user preferences.

**Rollout:** Feature-flagged via `?layout=v2` query param with 4-phase rollout (internal → opt-in → default → cutover).

**Timeline:** 15 days (0.5 FTE frontend dev)
**Budget:** 75 story points across 20 work packages

---

## 1. Plan Overview

- **Replace** `Dashboard.tsx` 70/30 layout with 3-column resizable grid (40/30/30 default widths)
- **Add** collapsible left sidebar for filters (Health/Stage/Assignee/Last Touch)
- **Add** opportunities hierarchy with Principal → Customer → Opportunity tree navigation (ARIA compliant)
- **Add** tasks panel with 3 grouping modes (Due/Priority/Principal) and "Later" pagination (10 at a time)
- **Add** quick activity logger with optional follow-up task creation (auto-assigned to current user)
- **Add** right slide-over panel (40vw, 480-720px) with Details/History/Files tabs (remember last tab)
- **Preserve** existing React Admin + Supabase data provider, authentication, routing (zero backend changes)
- **Apply** MFB Garden to Table theme (Forest Green, Clay, Paper Cream) via Tailwind v4 semantic utilities exclusively
- **Deliver** WCAG 2.1 AA compliance (Lighthouse ≥95), 44px touch targets all screens, keyboard shortcuts (/, 1-3, H, Esc)

**Delivery Approach:** TDD with RED-GREEN-REFACTOR cycles; bite-sized commits (2-5 min); 70% test coverage minimum.

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Foundation (3 work packages | 0.5 days | Entry: Design tokens verified | Exit: Shell renders)

**WP 1.1: Feature Flag Hook**
- **What:** URL query param detector (`?layout=v2` → boolean)
- **Where:** `src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts` + tests
- **Acceptance:** Returns true when `layout=v2` in URL; false otherwise; 3 unit tests pass

**WP 1.2: Preferences Persistence Hook**
- **What:** Type-safe wrapper around React Admin's `useStore` for localStorage
- **Where:** `src/atomic-crm/dashboard/v2/hooks/usePrefs.ts` + tests
- **Acceptance:** Reads/writes to localStorage; persists arrays; 3 unit tests pass

**WP 1.3: TypeScript Types**
- **What:** Type definitions (ColWidths, TaskGrouping, TabName, HealthStatus, FilterState, etc.)
- **Where:** `src/atomic-crm/dashboard/v2/types.ts`
- **Acceptance:** TypeScript compiles with zero errors; all types exported

### Phase 2: Core Layout (3 work packages | 1.5 days | Entry: Shell renders | Exit: Columns resize, sidebar toggles)

**WP 2.1: Header & Global Frame**
- **What:** Breadcrumbs (Home / Principals / {Name}), principal selector, global search, "New" menu
- **Where:** `src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx`
- **Acceptance:** Principal selection updates context; `/` focuses search; breadcrumbs navigate; 44px touch targets

**WP 2.2: Resizable Columns Hook**
- **What:** Mouse drag handlers for 3-column resize; constraints (min 15%, max 70%); persistence
- **Where:** `src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts` + tests
- **Acceptance:** Columns resize via drag; widths persist after refresh; "Reset" restores [40,30,30]; 4 unit tests pass

**WP 2.3: Filters Sidebar**
- **What:** Collapsible panel with Health/Stage/Assignee/Last Touch filters; Saved Views empty state
- **Where:** `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`
- **Acceptance:** Sidebar toggles; state persists; filters apply to columns; empty state shows for Saved Views

### Phase 3: Data Integration (3 work packages | 3 days | Entry: Layout functional | Exit: Real data populates widgets)

**WP 3.1: Opportunities Hierarchy**
- **What:** Tree view (Principal → Customer → Opp); top 3 customers auto-expand by recency; ARIA tree pattern
- **Where:** `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`
- **Acceptance:** Opportunities group by customer; top 3 auto-expand; row click opens slide-over; Left/Right keys expand/collapse

**WP 3.2: Tasks Panel**
- **What:** Grouped task list (Due/Priority/Principal toggle); "Later" collapsed + paginated (10 at a time); quick complete checkbox
- **Where:** `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`
- **Acceptance:** Tasks group correctly; checkbox marks complete; grouping persists; "Later" shows "Show next 10" link

**WP 3.3: Quick Logger**
- **What:** Activity logging form with type buttons (Call/Email/Meeting/Note); progressive disclosure (Principal → Opportunity); optional follow-up task (auto-assigned)
- **Where:** `src/atomic-crm/dashboard/v2/components/QuickLogger.tsx`
- **Acceptance:** Activity logs; follow-up task creates; form clears after submit; toast notifies success/error

### Phase 4: Right Panel & Polish (4 work packages | 2 days | Entry: Data flows | Exit: All interactions complete)

**WP 4.1: Right Slide-Over**
- **What:** Sheet component (40vw, 480-720px); tabs (Details/History/Files); remember last tab
- **Where:** `src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx`
- **Acceptance:** Opens on row click; tabs switch; last tab persists; Esc closes; "Files" shows placeholder

**WP 4.2: Keyboard Shortcuts & A11y**
- **What:** Global listeners (/, 1-3, H, Esc); ARIA tree roles; focus management; 44px touch targets
- **Where:** `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` + ARIA attributes
- **Acceptance:** All shortcuts work; Lighthouse a11y ≥95; keyboard-only navigation functional; NVDA announces tree correctly

**WP 4.3: Styling & Tokens Enforcement**
- **What:** Replace inline hex with semantic utilities; apply Paper Cream background; card patterns; elevation tokens
- **Where:** All components in `v2/` directory
- **Acceptance:** Zero inline CSS variables; `npm run validate:colors` passes; no unknown utilities in static scan

**WP 4.4: Main Layout Assembly**
- **What:** Orchestrate header, sidebar, 3 columns, separators, slide-over; wire context; keyboard listeners
- **Where:** `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`
- **Acceptance:** All components render; layout responds to window resize; context updates propagate

### Phase 5: Testing & QA (5 work packages | 2.5 days | Entry: Features complete | Exit: Tests pass, Lighthouse ≥95)

**WP 5.1: Unit Tests - Hooks**
- **What:** Test `useFeatureFlag`, `usePrefs`, `useResizableColumns`
- **Where:** `*.test.ts` files in `hooks/` directory
- **Acceptance:** 10 unit tests pass; coverage ≥70% on hooks

**WP 5.2: Unit Tests - Utilities**
- **What:** Test `groupTasksByDue`, `groupTasksByPriority`, `computeCustomerRecency`
- **Where:** `src/atomic-crm/dashboard/v2/utils/*.test.ts`
- **Acceptance:** 8 unit tests pass; deterministic bucket tests around DST boundaries

**WP 5.3: E2E Test - Activity Logging Workflow**
- **What:** End-to-end test for logging activity with follow-up task creation
- **Where:** `tests/e2e/dashboard-v2-activity-log.spec.ts`
- **Acceptance:** Test logs activity, creates task, verifies appearance in columns; 3 E2E tests pass

**WP 5.4: E2E Test - Keyboard Navigation**
- **What:** End-to-end test for keyboard shortcuts (/, 1-3, H, Esc)
- **Where:** `tests/e2e/dashboard-v2-keyboard.spec.ts`
- **Acceptance:** All shortcuts trigger expected behavior; focus management correct

**WP 5.5: Accessibility Audit**
- **What:** Axe scan + manual ARIA tree testing with NVDA/VoiceOver
- **Where:** `tests/e2e/dashboard-v2-a11y.spec.ts`
- **Acceptance:** Lighthouse a11y ≥95; zero Axe violations; NVDA announces tree correctly; 44px touch targets verified

### Phase 6: Integration & Rollout (2 work packages | 1 day | Entry: Tests pass | Exit: Feature flag live, docs published)

**WP 6.1: Feature Flag Integration**
- **What:** Conditional export in `dashboard/index.ts`; "Try New Dashboard" banner in V1
- **Where:** `src/atomic-crm/dashboard/index.ts`, `CompactGridDashboard.tsx`
- **Acceptance:** `?layout=v2` renders V2; V1 shows dismissible banner with link

**WP 6.2: Documentation**
- **What:** Update CLAUDE.md with V2 section; create migration guide
- **Where:** `CLAUDE.md`, `docs/dashboard-v2-migration.md`
- **Acceptance:** Docs published; migration guide reviewed by PM; internal team trained

---

## 3. Component & File Map

**Directory Structure:**
```
src/atomic-crm/dashboard/v2/
├── PrincipalDashboardV2.tsx          # Main layout orchestrator
├── components/
│   ├── DashboardHeader.tsx           # Breadcrumbs + principal selector + search
│   ├── FiltersSidebar.tsx            # Collapsible filters panel
│   ├── OpportunitiesHierarchy.tsx    # ARIA tree with customer grouping
│   ├── TasksPanel.tsx                # Grouped tasks + pagination
│   ├── QuickLogger.tsx               # Activity form + follow-up task
│   ├── RightSlideOver.tsx            # Sheet with Details/History/Files tabs
│   └── ColumnSeparator.tsx           # Drag handle (44px width)
├── context/
│   └── PrincipalContext.tsx          # Selected principal state provider
├── hooks/
│   ├── useFeatureFlag.ts             # URL query param detector
│   ├── usePrefs.ts                   # localStorage wrapper (React Admin useStore)
│   └── useResizableColumns.ts        # Mouse drag handlers + constraints
├── utils/
│   ├── taskGrouping.ts               # Due/Priority/Principal grouping logic
│   └── customerRecency.ts            # Client-side recency calculation (fallback)
└── types.ts                          # TypeScript type definitions
```

**Modified Files:**
- `src/atomic-crm/dashboard/index.ts` - Add conditional export based on feature flag
- `src/atomic-crm/dashboard/CompactGridDashboard.tsx` - Add V2 promotion banner

**Dependencies (New):**
- shadcn/ui components to install: `Checkbox`, `Tabs`, `Sheet`, `Collapsible`, `Alert`, `Label`, `Badge`
- Radix primitives: `@radix-ui/react-checkbox`, `@radix-ui/react-tabs`, `@radix-ui/react-dialog`, `@radix-ui/react-collapsible`, `@radix-ui/react-label`

---

## 4. Data Contracts & View Usage

### Data Provider Operator Support

**Operators Available (React Admin + Supabase):**
- `eq` - Equality (field = value)
- `in` - Array membership (field IN [values])
- ✅ **MVP Limitation:** `neq`, `gte`, `lte`, `ilike` require data provider extension
- **Workaround:** Client-side filtering for `Show closed` and `Assignee` scope (acceptable for <500 rows)

### Resource: `principal_opportunities` (Existing View)

**Purpose:** Pre-aggregated opportunities with customer info and health status

**Fields Used:**
- `id` - Opportunity ID (number)
- `name` - Opportunity name (string)
- `stage` - Current pipeline stage (string)
- `estimated_close_date` - Estimated close (ISO date string | null)
- `estimated_value` - Deal value (number | null)
- `health_status` - 'active' | 'cooling' | 'at_risk' (computed)
- `customer_organization_id` - Customer org ID (number)
- `customer_name` - Customer name (string)
- `principal_organization_id` - Principal org ID (number)
- `last_activity` - Most recent activity date (ISO timestamp | null)

**Query Pattern:**
```typescript
useGetList('principal_opportunities', {
  filter: {
    principal_organization_id: selectedPrincipalId,
    // Client-side: filter by health_status, stage after fetch
  },
  sort: { field: 'last_activity', order: 'DESC' },
  pagination: { page: 1, perPage: 500 },
});
```

**Fallback Behavior:**
- Empty state: "No opportunities for this principal" + "Create Opportunity" CTA
- Loading: 5 skeleton rows (44px each) with pulsing animation
- Error: Inline alert with "Retry" button

### Resource: `priority_tasks` (Existing View)

**Purpose:** Priority-ranked tasks with principal info

**Fields Used:**
- `id` - Task ID (number)
- `title` - Task title (string)
- `due_date` - Due date (ISO date string)
- `priority` - 'critical' | 'high' | 'medium' | 'low'
- `completed` - Boolean
- `principal_organization_id` - Principal org ID (number | null)
- `principal_name` - Principal name (string | null)
- `opportunity_id` - Linked opportunity (number | null)

**Query Pattern:**
```typescript
useGetList('priority_tasks', {
  filter: {
    completed: false,
    principal_organization_id: selectedPrincipalId, // Optional
  },
  sort: { field: 'due_date', order: 'ASC' },
  pagination: { page: 1, perPage: 500 },
});
```

**Fallback Behavior:**
- Empty state: "No tasks due" + "Create Task" button
- Loading: 3 skeleton rows

### Resource: `activities` (Table)

**Purpose:** Activity history for opportunity slide-over

**Fields Used:**
- `id` - Activity ID (number)
- `subject` - Activity subject (string)
- `description` - Details (string | null)
- `activity_type` - 'call' | 'email' | 'meeting' | 'note'
- `interaction_type` - Internal enum mapping (string)
- `created_at` - Activity timestamp (ISO timestamp)
- `organization_id` - Principal org ID (number)
- `opportunity_id` - Linked opportunity (number | null)
- `deleted_at` - Soft delete (ISO timestamp | null)

**Query Pattern:**
```typescript
useGetList('activities', {
  filter: {
    opportunity_id: opportunityId,
    deleted_at: null,
  },
  sort: { field: 'created_at', order: 'DESC' },
  pagination: { page: 1, perPage: 50 },
});
```

**Activity Type Mapping (Frontend → Backend):**
- `'call'` → `interaction_type: 'phone_call'`
- `'email'` → `interaction_type: 'email_sent'`
- `'meeting'` → `interaction_type: 'meeting'`
- `'note'` → `interaction_type: 'check_in'`

**Fallback Behavior:**
- Empty state: "No activity logged for this opportunity"
- Loading: Skeleton lines

### Resource: `organizations` (Table)

**Purpose:** Principal selector dropdown

**Fields Used:**
- `id` - Organization ID (number)
- `name` - Organization name (string)
- `organization_type` - 'principal' | 'distributor' | 'customer'
- `deleted_at` - Soft delete (ISO timestamp | null)

**Query Pattern:**
```typescript
useGetList('organizations', {
  filter: {
    organization_type: 'principal',
    deleted_at: null,
  },
  sort: { field: 'name', order: 'ASC' },
  pagination: { page: 1, perPage: 100 },
});
```

### Optional View: `principal_customer_recency` (Performance Optimization)

**Purpose:** Pre-compute last touch per customer within principal

**Status:** Optional for MVP; fallback to client-side calculation

**Fallback Logic (Client-Side):**
```
For each customer:
  recency = MAX(
    MAX(activities.activity_date WHERE customer_id = X),
    MAX(opportunities.updated_at WHERE customer_id = X)
  )
```

**Performance Gate:** Client-side recency calc on 1k opps < 150ms (P95)

**If view available:**
- SQL: `SELECT principal_id, customer_id, MAX(COALESCE(a.activity_date, o.updated_at)) AS last_touch`
- RLS: `GRANT SELECT ON principal_customer_recency TO authenticated;`

---

## 5. State & Persistence Plan

### User Preferences (localStorage via React Admin `useStore`)

**Preference Keys:**

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `pd.colWidths` | `[number, number, number]` | `[40, 30, 30]` | Column widths (must sum to 100) |
| `pd.taskGrouping` | `'principal' \| 'due' \| 'priority'` | `'due'` | Task grouping mode |
| `pd.rightTab` | `'details' \| 'history' \| 'files'` | `'details'` | Last active tab in slide-over |
| `pd.sidebarOpen` | `boolean` | `true` | Filters sidebar collapsed state |
| `pd.v2.banner.dismissed` | `'true' \| 'false'` | `'false'` | V2 promotion banner dismissal |

**Validation:**
- Column widths: If sum ≠ 100 or any value <15% or >70%, reset to `[40, 30, 30]`
- Task grouping: If invalid value, reset to `'due'`
- Right tab: If invalid value, reset to `'details'`

### Global Context (React Context)

**PrincipalContext:**
```typescript
{
  selectedPrincipalId: number | null,
  setSelectedPrincipal: (id: number | null) => void
}
```

**FilterContext (Local State - Not Persisted):**
```typescript
{
  health: HealthStatus[],          // ['active', 'cooling', 'at_risk']
  stages: string[],                // Empty array for MVP
  assignee: 'me' | 'team',         // 'me' default
  lastTouch: 'last_7d' | 'last_14d' | 'any', // 'any' default
  showClosed: boolean,             // false default
  groupByCustomer: boolean         // true default
}
```

**Filter Application Strategy:**
- **Health, Stages:** Client-side `.filter()` on fetched opportunities (<50ms for 500 rows)
- **Assignee:** Client-side filter based on `sales_id` (if field available; fallback to no-op)
- **Last Touch:** Client-side filter on `last_activity` date
- **Show Closed:** Client-side filter on `stage !== 'closed_lost'`

### Initialization Flow

1. **On mount:** Read all `pd.*` keys from localStorage via `usePrefs`
2. **Column widths:** Apply to CSS grid `gridTemplateColumns`; validate sum=100
3. **Task grouping:** Set Select value to stored grouping
4. **Right panel tab:** Set active tab to last viewed
5. **Sidebar state:** Apply collapsed class if `pd.sidebarOpen === false`
6. **Principal selection:** No persistence; resets to null on page load

### Reset Flow

**"Reset Layout" Button (in column header menu):**
- Sets `pd.colWidths` to `[40, 30, 30]`
- Sets `pd.taskGrouping` to `'due'`
- Sets `pd.rightTab` to `'details'`
- Sets `pd.sidebarOpen` to `true`
- Shows toast: "Layout reset to defaults"

---

## 6. Interaction Design & A11y

### Keyboard Shortcuts

**Global Listeners (active when not in input/textarea):**

| Key | Action | Implementation |
|-----|--------|----------------|
| `/` | Focus `#global-search` input | `e.preventDefault(); document.getElementById('global-search').focus()` |
| `1` | Scroll to Opportunities column | `document.getElementById('col-opps').scrollIntoView({ behavior: 'smooth' })` |
| `2` | Scroll to Tasks column | `document.getElementById('col-tasks').scrollIntoView({ behavior: 'smooth' })` |
| `3` | Scroll to Quick Logger column | `document.getElementById('col-log').scrollIntoView({ behavior: 'smooth' })` |
| `H` | Open slide-over on History tab | If already open, switch to History tab via preference |
| `Esc` | Close slide-over | `setSelectedOpportunityId(null)` |

**Conflict Mitigation:**
- Check `e.target.tagName !== 'INPUT'` and `!== 'TEXTAREA'` before handling
- Prevent default only when not in form field
- Document conflicts in help modal (e.g., Firefox Quick Find on `/`)

### ARIA Tree Navigation (Opportunities Hierarchy)

**Tree Structure:**
```
[role="tree"]
  └─ [role="treeitem" aria-level="1"] Principal (not rendered; implicit)
      └─ [role="group"]
          └─ [role="treeitem" aria-level="2" aria-expanded] Customer
              └─ [role="group"]
                  └─ [role="treeitem" aria-level="3"] Opportunity
```

**Keyboard Navigation:**

| Key | Action | ARIA Attribute |
|-----|--------|----------------|
| `ArrowRight` | Expand customer node (if collapsed) | `aria-expanded="true"` |
| `ArrowLeft` | Collapse customer node (if expanded) | `aria-expanded="false"` |
| `ArrowDown` | Move focus to next item (roving tabindex) | `tabindex="0"` on focused item, `-1` on others |
| `ArrowUp` | Move focus to previous item | Same as above |
| `Home` | Focus first customer | Move `tabindex="0"` to first |
| `End` | Focus last customer | Move `tabindex="0"` to last |
| `Enter` | Activate item (open slide-over) | Trigger click handler |

**Roving Tabindex Implementation:**
- Only one `treeitem` has `tabindex="0"` at a time
- All others have `tabindex="-1"`
- Arrow key navigation moves the `tabindex="0"` attribute

**Screen Reader Announcements:**
- On expand: "Customer XYZ, expanded, 5 opportunities"
- On collapse: "Customer XYZ, collapsed"
- On opportunity select: "Opportunity ABC, opening details"

### Focus Management

**On Principal Selection:**
- Focus remains on selector
- ARIA live region announces: "Loading opportunities for {Principal Name}"

**On Row Click (Opportunity):**
- Open right slide-over
- Move focus to first interactive element in active tab (e.g., stage select in Details)
- Trap focus within slide-over (Tab cycles within panel)

**On Slide-Over Close:**
- Return focus to clicked row (store ref on open)
- If closed via `Esc`, return focus to last focused tree item

### Touch Targets (ALL Screen Sizes)

**Minimum 44x44px on desktop, tablet, AND mobile:**
- Column separator drag handle: `w-11` (44px width)
- Checkboxes: `h-11 w-11` wrapper (checkbox itself can be smaller)
- Buttons: `h-11` minimum (use `h-11 px-4` pattern)
- Row click targets: `min-h-11` on table rows
- Icon-only buttons: `h-11 w-11`
- Tree expand/collapse chevrons: 44px hit area (icon can be 16px)

### Loading States

**Skeleton Loaders (shadcn Skeleton component):**
- Opportunities: 5 rows × 44px with pulsing gradient animation
- Tasks: 3 grouped sections with skeleton rows
- Quick Logger: Form disabled + spinner on submit button

**Empty States:**
- Opportunities: "No opportunities for this principal" + "Create Opportunity" CTA
- Tasks: "No tasks due" + "Create Task" button
- Activities: "No activity logged for this opportunity"

**Error States:**
- Inline Alert component (shadcn)
- Icon: `AlertCircle` (Lucide)
- Message: "{Resource} failed to load. [Retry]"
- Preserves layout (no content shift)

---

## 7. Styling & Tokens Enforcement

### Semantic Utilities Allowlist (From `src/index.css`)

**Colors:**
- **Background:** `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
- **Foreground:** `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- **Border:** `border-border`, `border-input`
- **Primary:** `bg-primary`, `text-primary`, `text-primary-foreground`
- **Secondary:** `bg-secondary`, `text-secondary-foreground`
- **Accent:** `bg-accent`, `text-accent-foreground`, `bg-accent-clay-600`
- **Destructive:** `bg-destructive`, `text-destructive`, `text-destructive-foreground`
- **Warning:** `bg-warning`, `text-warning`, `text-warning-foreground`
- **Success:** `bg-success`, `text-success`, `text-success-foreground`
- **Ring:** `ring-ring`

**Spacing:**
- **Semantic:** `gap-section` (24px), `gap-widget` (16px), `gap-content` (12px), `gap-compact` (8px)
- **Padding:** `p-content` (16px), `p-widget` (20px), `p-compact` (12px)
- **Vertical:** `space-y-section`, `space-y-widget`, `space-y-content`, `space-y-compact`
- **Edge:** `px-[var(--spacing-edge-desktop)]` (24px), `px-[var(--spacing-edge-mobile)]` (16px)

**Shadows (Elevation):**
- `shadow-sm` - Cards, widgets (--elevation-1)
- `shadow-md` - Modals, slide-overs (--elevation-2)
- `shadow-lg` - Dropdowns, tooltips (--elevation-3)

**Border Radius:**
- `rounded-lg` - Standard cards (8px)
- `rounded-md` - Inputs, buttons (6px)
- `rounded-full` - Health dots, avatars

**Typography:**
- Sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Prohibited Patterns

**❌ NEVER use:**
- Inline hex codes: `#FF6600`, `#FEFEF9`
- Direct OKLCH: `oklch(68% 0.140 85)`
- Inline CSS variables: `text-[color:var(--warning)]`, `bg-[var(--destructive)]`
- Unknown utilities not in allowlist above

**✅ ALWAYS use:**
- Semantic utilities from allowlist
- If utility missing, ask before adding to `src/index.css`

### Component Styling Patterns

**Card Pattern:**
```
className="bg-card border border-border shadow-sm rounded-lg p-[var(--spacing-widget-padding)]"
```

**Primary Button:**
```
className="bg-primary text-primary-foreground hover:bg-primary/90 h-11"
```

**Health Dot:**
```
className={`inline-block w-2.5 h-2.5 rounded-full ${
  health === 'active' ? 'bg-success' :
  health === 'cooling' ? 'bg-warning' :
  'bg-destructive'
}`}
```

**Focus Ring:**
```
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Responsive Breakpoints (Desktop-First)

**Base (0-1023px):** Mobile + tablet - stacked layouts, touch-friendly
```
className="grid-cols-1"
```

**lg: (1024px+):** Desktop - multi-column layouts, optimized spacing
```
className="lg:grid-cols-3 lg:gap-section"
```

**Viewport Testing Order:**
1. Desktop (1440px) - PRIMARY target
2. Tablet (768px) - Secondary
3. Mobile (375px) - Tertiary

### Static Validation

**Pre-commit Check:**
```bash
# Scan for prohibited patterns
grep -r "text-\[color:var" src/atomic-crm/dashboard/v2/ && echo "FAIL: Inline CSS variables found"
grep -r "#[0-9A-Fa-f]{6}" src/atomic-crm/dashboard/v2/ && echo "FAIL: Hex codes found"
```

**Acceptance Gate:** Zero matches on both patterns

---

## 8. Risk Register & Mitigations

### R1: Column Resizing Performance on Large Datasets (Medium Priority)

**Risk:** Drag handlers trigger re-renders; 200+ opportunities cause lag (<60fps)

**Likelihood:** Medium (15% of principals have >200 opps)
**Impact:** High (user perceives sluggishness)

**Mitigation:**
- Debounce resize updates to 16ms (RAF)
- Use CSS `flex-basis` instead of JavaScript width calculations
- **Contingency:** Add virtualization (react-window) if row count >200 and FPS <60

**Acceptance Gate:** 60fps drag with 500 opportunities on 1440px screen (Chrome DevTools Performance tab)

---

### R2: ARIA Tree Navigation Breaking Screen Readers (High Priority)

**Risk:** Nested ARIA tree roles confuse NVDA/JAWS; keyboard nav fails WCAG 2.1 criteria

**Likelihood:** Medium (complex ARIA patterns often fail)
**Impact:** Critical (accessibility blocker)

**Mitigation:**
- Manual test with NVDA (Windows) and VoiceOver (Mac) before launch
- Implement Left/Right expand/collapse per W3C ARIA tree pattern exactly
- Provide "Skip to content" link bypassing tree
- Roving tabindex implementation (only one item has `tabindex="0"`)

**Acceptance Gate:**
- NVDA announces "Customer XYZ, 5 opportunities, expanded" correctly
- Keyboard nav passes all criteria in ARIA tree pattern spec
- Lighthouse a11y score ≥95

---

### R3: Preference Persistence Conflicts Between Users (Medium Priority)

**Risk:** localStorage shared on same machine/browser profile; user prefs collide

**Likelihood:** Low (rare on shared computers)
**Impact:** Medium (user sees wrong layout)

**Mitigation:**
- Prefix keys with user ID: `pd.${userId}.colWidths`
- Fallback to defaults if userId unavailable (edge case)
- Document in user guide: "Preferences are browser-specific"

**Acceptance Gate:** Two users on same machine see independent layouts (manual test)

---

### R4: Smart Expand Logic Incorrect for Inactive Principals (Low Priority)

**Risk:** "Top 3 by recency" shows empty customers if no recent activity

**Likelihood:** Medium (20% of principals have stale customers)
**Impact:** Low (user can manually expand)

**Mitigation:**
- Fallback to top 3 by opportunity count if all `last_activity = null`
- Show "No recent activity" badge on expanded customers
- Client-side calc acceptable for MVP; optimize with DB view later

**Acceptance Gate:** All principals show at least 3 customers OR "View all customers" link

---

### R5: Right Slide-Over Width Breaks on Narrow Screens (Medium Priority)

**Risk:** 40vw = 307px on 768px tablet; unusable

**Likelihood:** High (iPad users common)
**Impact:** Medium (poor UX)

**Mitigation:**
- Clamp width: `clamp(480px, 40vw, 720px)` in CSS
- On <768px, slide-over goes full-screen (100vw)
- Test on iPad (768px) and iPad Mini (744px)

**Acceptance Gate:** Slide-over usable on all breakpoints ≥375px

---

### R6: Keyboard Shortcuts Conflict with Browser Defaults (Low Priority)

**Risk:** `/` triggers Firefox Quick Find; `H` conflicts with extensions

**Likelihood:** Medium (Firefox users ~5%)
**Impact:** Low (annoying but not blocking)

**Mitigation:**
- Check `event.target.tagName !== 'INPUT'` before handling `/`
- Prevent default only when not in input/textarea
- Document conflicts in help modal: "Firefox users: Disable Quick Find to use / shortcut"

**Acceptance Gate:** Shortcuts work in Chrome/Firefox/Safari without breaking browser features

---

### R7: Task Quick-Complete Optimistic Update Fails (Medium Priority)

**Risk:** Checkbox marks complete; API fails; task reappears (confusing UX)

**Likelihood:** Low (< 1% API failure rate)
**Impact:** Medium (user confusion)

**Mitigation:**
- Use React Admin's optimistic update with automatic rollback
- Show inline error toast on failure: "Failed to complete task. [Retry]"
- Re-enable checkbox immediately on error

**Acceptance Gate:** Failed completion reverts checkbox state; user can retry

---

### R8: Filter State Lost on Principal Change (Low Priority)

**Risk:** User sets Health=Active, switches principal; filter clears

**Likelihood:** Medium (users expect filter persistence)
**Impact:** Low (minor annoyance)

**Mitigation:**
- Keep filters in FilterContext (not local state)
- Apply filters to new principal's data
- Add "Clear all filters" button for discoverability

**Acceptance Gate:** Filters persist across principal changes (manual test)

---

### R9: Database View Dependencies Break Migration (High Priority)

**Risk:** `principal_customer_recency` view creation fails if `opportunities` table missing

**Likelihood:** Low (tables exist)
**Impact:** High (blocks deployment)

**Mitigation:**
- Make view OPTIONAL (feature flag: `ENABLE_RECENCY_VIEW`)
- Fallback to client-side recency calc if view missing
- Migration includes `CREATE VIEW IF NOT EXISTS` guards

**Acceptance Gate:** Dashboard works without view; performance degrades gracefully (150ms → 300ms acceptable)

---

### R10: Follow-Up Task Creation Silently Fails (Medium Priority)

**Risk:** Activity logs successfully; task creation fails; no notification

**Likelihood:** Low (< 1% failure rate)
**Impact:** Medium (data loss)

**Mitigation:**
- Use `Promise.allSettled` for parallel creates
- Show partial success toast: "Activity logged. Task creation failed. [Retry]"
- Log error to console for debugging (`console.error`)

**Acceptance Gate:** User notified of partial failure; can manually create task

---

## 9. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Target Coverage:** 70% minimum per Engineering Constitution

**Test Files:**
- `useFeatureFlag.test.ts` - 3 tests (true/false/different value)
- `usePrefs.test.ts` - 3 tests (default/update/array persistence)
- `useResizableColumns.test.ts` - 4 tests (init/ref/handler/setter)
- `taskGrouping.test.ts` - 8 tests (overdue/today/tomorrow/week/later + priority + principal grouping)
- `customerRecency.test.ts` - 3 tests (client-side recency calc, null handling, DST boundaries)

**Total:** 21 unit tests

**Deterministic Date Testing:**
- Use `vi.setSystemTime()` to mock dates for bucket tests
- Test DST boundaries (spring forward, fall back)
- Test timezone handling (America/Chicago assumption)

### Integration Tests (Component-Level)

**Test Scenarios:**
- OpportunitiesHierarchy: Renders tree, expands top 3, emits click events
- TasksPanel: Groups correctly, checkbox calls update, pagination shows/hides
- QuickLogger: Validates required fields, submits to create, clears on success
- FiltersSidebar: Checkboxes update state, typeahead searches, toggle persists

**Total:** 12 integration tests

### E2E Tests (Playwright)

**Test Files:**

**`dashboard-v2-activity-log.spec.ts`** (3 tests)
1. Logs activity with follow-up task
   - Select principal → Fill form → Check follow-up → Submit
   - Assert: Activity appears in History tab, Task appears in Tasks column
2. Keyboard shortcut `/` focuses search
3. Keyboard shortcut `1` scrolls to opportunities

**`dashboard-v2-keyboard.spec.ts`** (4 tests)
1. `2` scrolls to tasks
2. `3` scrolls to quick logger
3. `H` opens slide-over on History tab
4. `Esc` closes slide-over

**`dashboard-v2-a11y.spec.ts`** (3 tests)
1. Axe scan passes (zero violations)
2. All interactive elements ≥44px touch targets
3. ARIA tree navigation works with keyboard (Right expands, Left collapses)

**Total:** 10 E2E tests

### Manual QA Checklist

**Functional:**
- [ ] Principal selector updates all 3 columns
- [ ] Health/Stage/Assignee filters reduce rows correctly
- [ ] Column drag resizes; constraints enforced (15-70%)
- [ ] Column widths persist after browser refresh
- [ ] Reset button restores default widths [40,30,30]
- [ ] Opportunity row click opens right slide-over on Details tab
- [ ] Right panel tabs switch; last tab persists after close/reopen
- [ ] Task grouping toggle (Principal/Due/Priority) changes layout
- [ ] Task checkbox marks complete; row disappears immediately
- [ ] Quick Logger validates required fields (Type, Principal, Subject)
- [ ] Follow-up task checkbox reveals additional fields
- [ ] Activity + Task both create when follow-up enabled
- [ ] Empty states show for no opportunities/tasks/activities
- [ ] Loading skeletons appear during data fetch

**Keyboard & A11y:**
- [ ] `/` focuses global search
- [ ] `1`, `2`, `3` scroll to columns
- [ ] `H` opens slide-over on History tab
- [ ] `Esc` closes slide-over
- [ ] ARIA tree announces hierarchy in NVDA/JAWS
- [ ] Left/Right arrows expand/collapse customer nodes
- [ ] Tab order logical (header → sidebar → columns → slide-over)
- [ ] All interactive elements have visible focus ring
- [ ] Touch targets ≥44px on desktop, tablet, mobile

**Visual & Design:**
- [ ] No color banding on Paper Cream background
- [ ] Shadows appear warm (no "soot" on cream)
- [ ] All cards use semantic utilities (bg-card, border-border, shadow-sm)
- [ ] Primary buttons use bg-primary, text-primary-foreground
- [ ] Health dots match semantic colors (success/warning/destructive)
- [ ] Zero inline hex codes or `text-[color:var(...)]` syntax

**Responsive:**
- [ ] Desktop (1440px): 3 columns side-by-side, sidebar visible
- [ ] Tablet (768px): Columns stack 2-1 or single column
- [ ] Mobile (375px): All columns stacked, sidebar hidden by default
- [ ] Slide-over full-screen on <768px

### Performance Gates

**Lighthouse (Desktop 1440px):**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90

**Core Web Vitals:**
- LCP: <2.5s (initial data load)
- FID: <100ms (column drag responsiveness)
- CLS: <0.1 (no layout shift on data load)

**Data Load Benchmarks:**
- P50: <200ms (cached views)
- P95: <300ms (fresh fetch)
- P99: <500ms (network throttled)

**Client-Side Operations:**
- Filter 500 opps: <50ms
- Group 500 tasks: <50ms
- Recency calc 1k opps: <150ms (P95)

---

## 10. Rollout & Revert

### Feature Flag Plan

**Phase 1: Internal Testing (Week 1)**
- Enable via `?layout=v2` query param only
- Banner in V1 dashboard: "Try the new dashboard" with link
- 5-10 internal users dogfood
- Gather feedback via Slack channel #dashboard-v2
- **Gate:** Zero critical bugs, Lighthouse a11y ≥95

**Phase 2: Opt-In Beta (Week 2)**
- Add "Try New Dashboard" CTA to V1 header (dismissible banner)
- Set preference `pd.dashboardVersion = 'v2'` on opt-in
- Track adoption: 20% of users opt-in target
- Monitor error logs for V2-specific issues
- **Gate:** <5% error rate, positive user feedback

**Phase 3: Default On (Week 3)**
- Flip default: new users see V2, existing users keep preference
- V1 remains accessible via `?layout=v1` for 1 release cycle
- Migration prompt for V1 users: "Switch to new layout?"
- **Gate:** <10% users revert to V1

**Phase 4: Full Cutover (Week 4)**
- Remove feature flag from codebase
- Delete V1 code from `dashboard/` directory
- Update docs to reflect V2 as canonical
- **Gate:** Production stable for 7 days, zero rollback requests

### Preference Migration

**On first V2 load:**
- Check localStorage for `pd.v2.migrated` key
- If not present, show welcome modal: "New Dashboard - What's Changed"
- Set `pd.v2.migrated = 'true'` to prevent re-showing
- Offer quick tour (optional)

### Revert Approach

**If critical bug discovered:**

1. **Immediate (T+0 min):** Flip flag in `dashboard/index.ts` to default V1
2. **Within 1 hour (T+60 min):** Deploy hotfix PR removing `?layout=v2` support
3. **Within 4 hours (T+240 min):** Post-mortem meeting; identify root cause
4. **Within 24 hours (T+1 day):** Add regression test for bug
5. **Within 72 hours (T+3 days):** Re-enable after fix verified in staging + E2E tests pass

**Revert Criteria (ANY triggers immediate rollback):**
- >5% error rate in V2 routes (tracked via observability)
- Lighthouse a11y score <90 (automated check)
- >10 user reports of data loss (support tickets)
- Critical security vulnerability (CVE)

**Data Safety:**
- No schema changes in V2; rollback has zero data impact
- Preferences persist in localStorage; V1 ignores V2-specific keys
- No data migrations required

---

## 11. Effort & Timeline

### Effort Estimates (Story Points)

| Phase | Work Packages | Points | Days (0.5 FTE) |
|-------|---------------|--------|----------------|
| **Phase 1: Foundation** | 3 WPs | 7 | 0.5 |
| **Phase 2: Core Layout** | 3 WPs | 18 | 1.5 |
| **Phase 3: Data Integration** | 3 WPs | 18 | 3.0 |
| **Phase 4: Right Panel & Polish** | 4 WPs | 21 | 2.0 |
| **Phase 5: Testing & QA** | 5 WPs | 13 | 2.5 |
| **Phase 6: Integration & Rollout** | 2 WPs | 6 | 1.0 |
| **TOTAL** | **20 WPs** | **75** | **15 days** |

### Sprint Calendar (2-Week Sprints)

**Sprint 1 (Days 1-10):**
- Week 1 (Days 1-5): Phase 1 (Foundation) + Phase 2 (Core Layout)
- Week 2 (Days 6-10): Phase 3 (Data Integration) start

**Sprint 2 (Days 11-20):**
- Week 1 (Days 11-15): Phase 3 complete + Phase 4 (Right Panel) start
- Week 2 (Days 16-20): Phase 4 complete + Unit tests

**Sprint 3 (Days 21-30):**
- Week 1 (Days 21-25): E2E tests + Bug fixes + A11y audit
- Week 2 (Days 26-30): Internal testing (Phase 1 rollout)

**Sprint 4 (Days 31-35):**
- Week 1 (Days 31-35): Beta rollout (Phase 2) + Monitoring

**Total Duration:** 35 calendar days (7 weeks) at 0.5 FTE

### Dependencies & Blockers

**External Dependencies:**
- Design approval on brand token mappings (Day 1, PM)
- QA environment with 500+ test opportunities (Day 15, DevOps)
- Staging deployment pipeline configured (Day 25, DevOps)

**Internal Dependencies:**
- React Admin's `useStore` confirmed functional (Day 1, verify)
- Playwright E2E framework setup complete (Day 20, QA)
- shadcn components installed (Day 2, npm install)

**Critical Path:**
- Phase 2.2 (Resizable Columns) → Phase 3.1 (Opportunities) → Phase 4.2 (A11y) → Rollout

### RACI Matrix

| Role | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| **Frontend Dev** | All WPs 1.1-4.4 | - | Design, QA | PM |
| **QA Lead** | WPs 5.1-5.5 | Phase 5 | Frontend | PM |
| **PM/Founder** | - | All phases | All roles | Stakeholders |
| **Data Engineer** | Optional view (recency) | - | Frontend | PM |
| **DevOps** | Deployment pipeline | Phase 6 | Frontend, QA | PM |

---

## 12. Open Questions & Decisions

### Decisions Locked (Q1-Q8)

All questions from strategic plan review have been answered and locked:

| Q | Decision | Implementation |
|---|----------|----------------|
| Q1 | **Primary customer only** | Show opportunity under first customer_id; ignore multi-customer relationships for MVP |
| Q2 | **Auto-assign to current user** | Follow-up tasks get `sales_id` from `useGetIdentity()`; no assignee dropdown |
| Q3 | **Files tab placeholder** | Render tab with "Coming soon" message + file upload icon |
| Q4 | **Saved Views empty state** | Show "Custom views coming soon" in sidebar; no static examples |
| Q5 | **Client-side assignee filter** | Filter by `sales_id` in memory after fetch; backend optimization post-MVP |
| Q6 | **Resize disabled on mobile** | Hide column separators on <1024px; columns use fixed widths |
| Q7 | **Later pagination** | Collapsed by default; show 10 tasks at a time with "Show next 10 (X remaining)" link |
| Q8 | **Cancel previous fetch** | Use AbortController + React Admin query key change to cancel stale requests |

### Additional Decisions Made (Planning Phase)

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Client-side filtering for Show Closed & Assignee** | Unblocks execution; acceptable for <500 rows; extend data provider post-MVP | Zero backend changes |
| **Virtualization as contingency** | YAGNI; avg 47 opps/principal; add if >200 rows + <60fps | Saves 1.5 days |
| **Optional recency view** | Fallback to client-side calc; optimize later if P95 >150ms | Zero migration risk |
| **Date handling via date-fns** | Prevents UTC drift; timezone America/Chicago; deterministic buckets | Explicit dependency |

### Assumptions Made (Proceeding Under These)

1. **Assumption:** `principal_opportunities` view includes `last_activity` timestamp
   - **If false:** Add column to view or compute client-side (adds 0.5 days)

2. **Assumption:** React Admin's `useStore` persists to localStorage across sessions
   - **If false:** Implement custom localStorage wrapper (adds 0.25 days)

3. **Assumption:** shadcn/ui Sheet component supports custom width override (`className` prop)
   - **If false:** Fork Sheet or build custom slide-over (adds 1 day)

4. **Assumption:** Task completion API supports optimistic updates (`useUpdate` with automatic rollback)
   - **If false:** Implement manual rollback logic (adds 0.5 days)

5. **Assumption:** Current frontend has 0 accessibility violations to start from
   - **If false:** Fix baseline violations before V2 work (unknown effort)

### No Open Questions Remaining

All architectural questions, data contracts, and implementation strategies have been locked. Contractor can proceed with execution immediately.

---

## Appendix A: Date Handling Policy

**Timezone:** America/Chicago (Central Time)

**Storage Format:** ISO 8601 date strings (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ` for timestamps)

**Library:** `date-fns` for all date manipulation

**Common Operations:**
- Parse: `parseISO('2025-11-13')`
- Start of day: `startOfDay(new Date())`
- Add days: `addDays(today, 7)`
- Format: `format(date, 'MMM dd, yyyy')` or native `toLocaleDateString('en-US')`

**Bucket Logic (Tasks by Due Date):**
```
TODAY = startOfDay(new Date())
TOMORROW = addDays(TODAY, 1)
END_OF_WEEK = addDays(TODAY, 7)

Overdue: due_date < TODAY
Today: due_date === TODAY (same calendar day)
Tomorrow: due_date === TOMORROW
This Week: due_date > TOMORROW && due_date <= END_OF_WEEK
Later: due_date > END_OF_WEEK
```

**DST Handling:**
- All comparisons use `startOfDay()` to normalize to midnight
- Test buckets around DST boundaries (March 10, November 3 for 2025)

---

## Appendix B: Install Map (shadcn/ui Components)

**Components to Install:**

```bash
# Core UI
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add collapsible
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge

# Already Installed (Verify)
# Card, Button, Dialog, Select, Input, Textarea, Skeleton
```

**Radix Primitives (Auto-Installed by shadcn):**
- `@radix-ui/react-checkbox`
- `@radix-ui/react-tabs`
- `@radix-ui/react-dialog` (for Sheet)
- `@radix-ui/react-collapsible`
- `@radix-ui/react-label`

**Lucide Icons (Verify Installed):**
- `Phone`, `Mail`, `Calendar`, `FileText`, `ChevronRight`, `ChevronDown`, `ChevronLeft`, `Search`, `X`, `AlertCircle`

---

## Appendix C: Observability & Monitoring

**Browser Performance Marks:**
```typescript
performance.mark('opps-fetch-start');
// ... fetch data
performance.mark('opps-fetch-end');
performance.measure('opps-fetch', 'opps-fetch-start', 'opps-fetch-end');
```

**Marks to Add:**
- `opps-fetch`, `tasks-fetch`, `activities-fetch`
- `opps-render`, `tasks-group`, `customer-recency-calc`

**Console Error Budget:** Zero errors in production

**Fetch Duration Logging:**
```typescript
const start = performance.now();
const { data } = await useGetList(...);
const duration = performance.now() - start;
if (duration > 300) {
  console.warn(`Slow fetch: ${resource} took ${duration}ms`);
}
```

**Metrics to Track (Post-MVP):**
- V2 adoption rate (% of users with `?layout=v2`)
- Average session duration on V2 vs V1
- Error rate by component (OpportunitiesHierarchy, TasksPanel, etc.)
- Keyboard shortcut usage (track key events)

---

**Plan Status:** Complete & Locked
**Last Updated:** 2025-11-13
**Approver:** PM/Founder (Awaiting Sign-Off)
**Next Action:** Begin Phase 1 execution after approval

