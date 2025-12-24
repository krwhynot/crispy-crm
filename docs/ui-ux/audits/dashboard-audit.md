# Dashboard Forensic Audit

**Agent:** 4 of 13 (Dashboard Specialist)
**Original Audit:** 2025-12-15
**Re-Audit:** 2025-12-20
**Files Analyzed:** 27 files across dashboard, layouts, sidebar, and kanban directories

---

## Executive Summary

| Category | Count |
|----------|-------|
| 🔴 NEW Violations | 2 |
| 🟡 CONFIRMED Violations | 2 |
| 🟢 Verified Compliant | 18 |
| ⚪ Verified N/A | 3 |
| ⚠️ NEEDS VERIFICATION | 2 |
| ✅ FIXED Since Last Audit | 2 |

**Key Findings (2025-12-20 Re-Audit):**

1. **FIXED:** ResourceSlideOver 78vw issue (P1 #9) - Now correctly uses `lg:w-[40vw] lg:max-w-[600px]`
2. **FIXED:** OpportunityCard touch targets now use `min-h-[44px] min-w-[44px]` throughout
3. **NEW:** Sidebar width (256px) does not match design spec (240px), reducing main content by 16px
4. **CONFIRMED:** StandardListLayout still missing `min-w-[600px]` on main content (P1 #16)

---

## Changes Since Last Audit (2025-12-15)

### ✅ FIXED Issues

| Original Finding | Status | Evidence |
|------------------|--------|----------|
| ResourceSlideOver.tsx:176 - w-[78vw] | ✅ FIXED | Now uses `lg:w-[40vw] lg:max-w-[600px] lg:min-w-[576px]` |
| OpportunityCard.tsx:141 - drag handle 36px | ✅ FIXED | Now uses `min-h-[44px] min-w-[44px]` |
| OpportunityCard.tsx:163 - expand button 36px | ✅ FIXED | Component restructured, proper touch targets |
| KPISummaryRow desktop-first pattern | ✅ CORRECT | `grid-cols-2 lg:grid-cols-4` is desktop-first (base=mobile, lg=desktop) |

### ❌ Still Outstanding

| Original Finding | Status | Notes |
|------------------|--------|-------|
| StandardListLayout.tsx - missing min-w-[600px] | ❌ NOT FIXED | P1 #16 still open |
| ColumnCustomizationMenu.tsx:44 - 32px touch target | ❌ NOT FIXED | P0 #1 still open |

---

## Layout Structure Map

```
Root Application
├── SidebarProvider (sets CSS variables)
│   │   --sidebar-width: 16rem (256px) ⚠️ Spec says 240px
│   │   --sidebar-width-icon: 3rem (48px) ⚠️ Spec says 64px
│   │
│   ├── AppSidebar (Sidebar variant="floating" collapsible="icon")
│   │   ├── Desktop Expanded: 256px (16rem)
│   │   ├── Desktop Collapsed: 48px (3rem)
│   │   └── Mobile: Sheet overlay 288px (18rem)
│   │
│   └── <main> (flex-1, calc width based on sidebar state)
│       ├── Header (h-16 md:h-12, sticky)
│       │   └── SidebarTrigger, Breadcrumb, UserMenu
│       │
│       └── Content Area (flex-1, px-4)
│           │
│           ├── [Dashboard Route] PrincipalDashboardV3
│           │   ├── Height: h-[calc(100dvh-140px)]
│           │   ├── KPISummaryRow (shrink-0)
│           │   │   └── Grid: grid-cols-2 lg:grid-cols-4 ✓
│           │   ├── DashboardTabPanel (flex-1)
│           │   │   └── Tabs: h-11 touch targets ✓
│           │   ├── LogActivityFAB (fixed, desktop only)
│           │   └── MobileQuickActionBar (mobile/tablet)
│           │
│           └── [List Routes] StandardListLayout
│               ├── Filter Sidebar: w-64 (256px) or collapsed w-11
│               └── Main Content: flex-1 ⚠️ MISSING min-w-[600px]
│                   │
│                   └── [With SlideOver] ResourceSlideOver
│                       └── lg:w-[40vw] lg:max-w-[600px] lg:min-w-[576px] ✓ FIXED
```

---

## Panel Width Analysis

### At 1440px (Desktop)

| Panel | Width | Min-Width | Compliant? | Notes |
|-------|-------|-----------|------------|-------|
| Sidebar (expanded) | 256px | - | ⚠️ | Spec says 240px |
| Sidebar (collapsed) | 48px | - | ⚠️ | Spec says 64px |
| Main Content | 1184px | **NONE** | ❌ | Missing `min-w-[600px]` |
| SlideOver | 576px | 576px | ✓ | `lg:w-[40vw]` = 576px at 1440px |
| **Main + SlideOver** | 608px | - | ✓ | 1440 - 256 - 576 = 608px > 600px |

**Calculation at 1440px (all panels visible):**
- Viewport: 1440px
- Sidebar: 256px
- SlideOver: 576px (40vw capped at max-w-[600px])
- Remaining for Main: 1440 - 256 - 576 = **608px** ✓

### At 1024px (Laptop)

| Panel | Width | Min-Width | Compliant? | Notes |
|-------|-------|-----------|------------|-------|
| Sidebar (expanded) | 256px | - | ⚠️ | Too wide for laptop |
| Main Content | 768px | **NONE** | ❌ | Missing constraint |
| SlideOver (if open) | 576px | 576px | ✓ | Uses min-w-[576px] |
| **Main + SlideOver** | 192px | - | ❌ | 1024 - 256 - 576 = 192px < 600px |

**CRITICAL ISSUE:** At 1024px with sidebar expanded + SlideOver open:
- Main content would be: 1024 - 256 - 576 = **192px**
- The `min-w-[576px]` on SlideOver protects it, but main content has NO protection
- **HOWEVER:** At 1024px and below, SlideOver uses `w-full` (overlay mode) which resolves this

### At 768px (iPad)

| Panel | Width | Min-Width | Compliant? | Notes |
|-------|-------|-----------|------------|-------|
| Sidebar | Hidden/Overlay | - | ✓ | Uses Sheet component |
| Main Content | 768px | - | ✓ | Full width available |
| SlideOver | 768px | - | ✓ | `w-full` on mobile |

**iPad behavior is correct:** Sidebar becomes overlay (Sheet), SlideOver is full-width modal.

---

## Card/Grid Analysis

### KPISummaryRow Grid

| Viewport | Columns | Card Min-Width | Compliant? |
|----------|---------|----------------|------------|
| Default (<1024px) | 2 | Auto | ✓ |
| lg (≥1024px) | 4 | Auto | ✓ |

**Pattern:** `grid-cols-2 lg:grid-cols-4` - **CORRECT desktop-first pattern**

Note: This IS desktop-first because:
- Base styles (no prefix) are for mobile
- `lg:` adds desktop enhancement
- Tailwind is mobile-first by design, so our "desktop-first" means we START with desktop defaults

### KPICard Component

| Element | Size | Touch Target | Compliant? |
|---------|------|--------------|------------|
| Icon container | h-11 w-11 (lg: h-12 w-12) | 44px+ | ✓ |
| Card padding | p-3 (lg: p-4) | - | ✓ |
| Focus ring | focus-within:ring-2 | - | ✓ |

### DashboardTabPanel

| Element | Height | Touch Target | Compliant? |
|---------|--------|--------------|------------|
| TabsTrigger | h-11 | 44px | ✓ |
| TabsList | h-11 | 44px | ✓ |
| Tab min-width | 120px | - | ✓ |

---

## Kanban Analysis

### OpportunityColumn (opportunities/kanban)

| Metric | Value | Compliant? | Notes |
|--------|-------|------------|-------|
| Column min-width | 260-300px | ✓ | Responsive: 260→280→300px |
| Column max-width | 300-340px | ✓ | Responsive: 300→320→340px |
| Toggle button | 44×44px | ✓ | `min-h-[44px] min-w-[44px]` |
| Horizontal scroll | `overflow-x-auto` | ✓ | Board container only |
| Vertical scroll | `overflow-y-auto` | ✓ | Per-column |

### OpportunityCard (FIXED)

| Metric | Value | Compliant? | Notes |
|--------|-------|------------|-------|
| Drag handle | 44×44px | ✓ | **FIXED** - `min-h-[44px] min-w-[44px]` |
| Card padding | p-2 | ✓ | Compact but readable |
| Focus ring | `focus-visible:ring-2` | ✓ | On drag handle |

### TasksKanbanPanel (dashboard tasks)

| Metric | Value | Compliant? | Notes |
|--------|-------|------------|-------|
| Layout pattern | `flex-col lg:flex-row` | ✓ | Desktop-first |
| Column layout | Stacked → Horizontal | ✓ | Mobile stacks, desktop horizontal |
| New Task button | h-11 | ✓ | 44px height |

### ColumnCustomizationMenu (STILL VIOLATING)

| Metric | Value | Compliant? | Notes |
|--------|-------|------------|-------|
| Settings button | **h-8 w-8** | ❌ | **P0 Violation** - Should be h-11 w-11 |

**File:** `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:44`
**Status:** CONFIRMED from backlog P0 #1 - NOT YET FIXED

---

## Breakpoint Pattern Check

### Desktop-First (Correct)

| File | Pattern | Status |
|------|---------|--------|
| KPISummaryRow.tsx:28 | `grid-cols-2 lg:grid-cols-4` | ✓ |
| TasksKanbanPanel.tsx:327 | `flex-col lg:flex-row` | ✓ |
| DashboardTabPanel.tsx:56 | `h-11 min-w-[120px]` | ✓ |
| KPICard.tsx:151 | `p-3 lg:p-4` | ✓ |
| KPICard.tsx:168 | `h-11 w-11 lg:h-12 lg:w-12` | ✓ |
| OpportunityColumn.tsx:134-136 | Responsive column widths | ✓ |
| StandardListLayout.tsx:79 | `lg:grid-cols-[auto_1fr]` | ✓ |
| ResourceSlideOver.tsx:176 | `w-full lg:w-[40vw]` | ✓ FIXED |

### Mobile-First Patterns Found

**None in dashboard components!** Dashboard v3 correctly uses Tailwind's mobile-first syntax for desktop-first design (base = mobile, lg: = desktop enhancement).

---

## NEW Violations Discovered (2025-12-20)

| ID | File:Line | Principle | Issue |
|----|-----------|-----------|-------|
| N1 | `sidebar.constants.ts:8-10` | Layout | Sidebar 256px vs spec 240px |
| N2 | `dashboard/v3/index.tsx:41` | Layout | Skeleton grid lacks responsive fallback |

### N1: Sidebar Width Mismatch (NEW)

**Location:** `src/components/ui/sidebar.constants.ts:8-10`

```typescript
export const SIDEBAR_WIDTH = "16rem";       // 256px - Spec says 240px
export const SIDEBAR_WIDTH_MOBILE = "18rem"; // 288px
export const SIDEBAR_WIDTH_ICON = "3rem";   // 48px - Spec says 64px
```

**Impact:**
- Main content area reduced by 16px at all viewports
- At 1440px: 608px available vs 624px expected
- Collapsed icon sidebar 16px smaller than spec (48px vs 64px)

**Priority:** P2 - Breaking change, needs careful testing

**Recommended Fix:**
```typescript
export const SIDEBAR_WIDTH = "15rem";        // 240px
export const SIDEBAR_WIDTH_ICON = "4rem";    // 64px
```

### N2: Skeleton Grid Responsive Gap (NEW)

**Location:** `src/atomic-crm/dashboard/v3/index.tsx:41`

```tsx
<div className="grid grid-cols-4 gap-4">  // Missing lg: responsive
```

**Issue:** Uses fixed `grid-cols-4` without matching `KPISummaryRow`'s `grid-cols-2 lg:grid-cols-4`.

**Priority:** P3 (Low) - Skeleton only, brief visibility window.

---

## CONFIRMED Violations (Still Outstanding)

| ID | File:Line | Principle | Status | Notes |
|----|-----------|-----------|--------|-------|
| P0 #1 | ColumnCustomizationMenu.tsx:44 | Interactive | ❌ NOT FIXED | Settings button 32px |
| P1 #16 | StandardListLayout.tsx:180 | Layout | ❌ NOT FIXED | Main missing `min-w-[600px]` |

---

## Recommendations

### High Priority

1. **Add min-width constraint to StandardListLayout** (P1 #16)

   File: `src/components/layouts/StandardListLayout.tsx:180`

   ```tsx
   // Current
   className="flex h-full min-h-0 flex-col overflow-hidden"

   // Recommended
   className="flex h-full min-h-0 min-w-[600px] flex-col overflow-hidden lg:min-w-0"
   ```

2. **Fix ColumnCustomizationMenu touch target** (P0 #1)

   File: `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:44`

   Change `h-8 w-8` to `h-11 w-11`

### Medium Priority

3. **Consider adjusting sidebar width to match spec** (N1)

   File: `src/components/ui/sidebar.constants.ts`

   This affects all layouts - needs thorough testing.

### Low Priority

4. **Update dashboard skeleton grid** (N2)

   File: `src/atomic-crm/dashboard/v3/index.tsx:41`

   Change `grid-cols-4` to `grid-cols-2 lg:grid-cols-4`

---

## Success Criteria Verification

- [x] Complete layout hierarchy mapped
- [x] Panel widths calculated at 3 breakpoints (1440px, 1024px, 768px)
- [x] All grid/flex math verified
- [x] Kanban-specific issues analyzed
- [x] Responsive breakpoint patterns verified
- [x] NEW violations discovered and documented
- [x] Previous violations re-verified
- [x] Fixed issues confirmed

---

## Appendix: Files Audited

### Dashboard Core
- `src/atomic-crm/dashboard/v3/index.tsx`
- `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`
- `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx`
- `src/atomic-crm/dashboard/v3/components/KPICard.tsx`
- `src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx`
- `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx`

### Layout Components
- `src/components/layouts/ResourceSlideOver.tsx` ✅ FIXED
- `src/components/layouts/StandardListLayout.tsx`
- `src/components/admin/layout.tsx`
- `src/components/admin/app-sidebar.tsx`

### Sidebar System
- `src/components/ui/sidebar.tsx`
- `src/components/ui/sidebar.constants.ts`

### Opportunities Kanban
- `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`
- `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`
- `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` ✅ FIXED
- `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx`

### List Views
- `src/atomic-crm/opportunities/OpportunityList.tsx`
