# Dashboard V2 Bugfix Design

**Date:** 2025-01-15
**Status:** ✅ Implemented
**Context:** Post-implementation fixes for Dashboard V2 filter wiring and sidebar collapse

---

## Problem Statement

The Dashboard V2 filter wiring implementation (completed 2025-01-15) had 4 critical issues preventing filters and sidebar state from working correctly:

1. **Critical - Double-prefixed storage keys:** `usePrefs` already prepends `pd.` to keys, but callers were passing `'pd.filters'`, resulting in keys like `'pd.pd.filters'` that broke persistence entirely
2. **High - Non-functional assignee filter:** Dropdown was visible but had no effect because database views lack `sales_id` column, creating confusing UX
3. **Medium - Inaccessible rail button:** Collapsed sidebar reopening button was only 2px wide (32px on hover), violating WCAG 2.1 AA 44px minimum touch target
4. **Low - Dead code:** `isOpen` prop was passed to `FiltersSidebar` but never used

---

## Design Decisions

### Fix #1: Storage Key Persistence (Critical)

**Root Cause:** `usePrefs` hook automatically prefixes all keys with `pd.` for namespacing (line 16 in `hooks/usePrefs.ts`), but callers were passing pre-prefixed keys like `'pd.filters'`, resulting in double-prefixed storage keys (`'pd.pd.filters'`) that don't match any existing localStorage entries.

**Solution:** Update all 3 `usePrefs` call sites to pass unprefixed keys:

**Files Changed:**
- `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` (lines 41, 51)
- `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx` (line 39)

**Changes:**
```typescript
// BEFORE (incorrect):
const [filterState, setFilterState] = usePrefs<FilterState>('pd.filters', {...});
const [sidebarOpen, setSidebarOpen] = usePrefs('pd.sidebarOpen', true);
const [filtersOpen, setFiltersOpen] = usePrefs<boolean>("pd.filtersOpen", true);

// AFTER (correct):
const [filterState, setFilterState] = usePrefs<FilterState>('filters', {...});
const [sidebarOpen, setSidebarOpen] = usePrefs('sidebarOpen', true);
const [filtersOpen, setFiltersOpen] = usePrefs<boolean>("filtersOpen", true);
```

**Result:** Storage keys become `pd.filters`, `pd.sidebarOpen`, and `pd.filtersOpen` as intended. Filter selections and sidebar visibility now persist correctly across page refreshes.

**Migration:** None needed - project is still in development with no existing users who have saved preferences.

---

### Fix #2: Hide Assignee Filter (High Priority)

**Root Cause:** The assignee dropdown is fully functional in the UI, but filtering logic in `OpportunitiesHierarchy.tsx` is commented out (lines 77-84) because the `principal_opportunities` database view doesn't expose `sales_id` column. The `TasksPanel` component also receives an `assignee` prop but doesn't use it. This creates a confusing experience where users can select "Assigned to Me" or specific sales reps but see no effect on the data.

**Solution:** Hide the entire "Assignee" section in `FiltersSidebar.tsx` until the database migration adds `sales_id` to views. This follows the "don't show broken features" principle.

**Files Changed:**
- `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx` (lines ~140-180, ~62)

**Changes:**
1. Wrapped entire Assignee `<Collapsible>` block in multi-line comment with TODO marker
2. Removed `assigneeOpen` state variable (no longer needed)

**Result:** Assignee filter disappears from UI entirely. When database migration lands, we can uncomment this block and the filtering logic in `OpportunitiesHierarchy.tsx` (lines 77-84), and everything will work immediately.

**Future Work:** Database migration to add `sales_id` column to `principal_opportunities` and `priority_tasks` views, then uncomment assignee filter code.

---

### Fix #3: Rail Button Touch Target (Medium Priority)

**Root Cause:** The collapsed sidebar rail button uses `w-2` (2px width) by default, expanding to `w-8` (32px) on hover. This violates WCAG 2.1 AA's 44px minimum touch target requirement and makes the button nearly impossible to hit on touch devices or with a mouse.

**Solution:** Change button to fixed 44px × 44px size with always-visible icon, removing hover-dependent width transitions and opacity changes.

**Files Changed:**
- `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` (lines 240-262)

**Changes:**
```typescript
// BEFORE (non-compliant):
<button
  className="relative w-2 h-24 bg-border hover:w-8 hover:bg-accent
             transition-all duration-200 rounded-r-md group
             focus-visible:ring-2 focus-visible:ring-primary
             focus-visible:w-8 flex items-center justify-center"
>
  <ChevronRight className="h-5 w-5 text-muted-foreground
                           opacity-0 group-hover:opacity-100
                           group-focus-visible:opacity-100 transition-opacity" />
  {activeFilterCount > 0 && (
    <div className="absolute -top-2 left-1 w-5 h-5 ...">
      {activeFilterCount}
    </div>
  )}
</button>

// AFTER (WCAG 2.1 AA compliant):
<button
  className="relative w-11 h-11 bg-border hover:bg-accent
             transition-colors duration-200 rounded-r-md
             focus-visible:ring-2 focus-visible:ring-primary
             flex items-center justify-center"
>
  <ChevronRight className="h-5 w-5 text-muted-foreground" />
  {activeFilterCount > 0 && (
    <div className="absolute -top-2 -right-2 w-5 h-5 ...">
      {activeFilterCount}
    </div>
  )}
</button>
```

**Key Changes:**
1. **Fixed size:** `w-11 h-11` (44px × 44px) - always meets minimum touch target
2. **Always-visible icon:** Removed opacity transitions - icon is always visible
3. **Simplified transitions:** Only `transition-colors` on hover (background change)
4. **Badge repositioned:** Changed from `left-1` to `-right-2` to avoid overlap with 44px button
5. **Removed `group` class:** Not needed without opacity transitions

**Result:** Button is now easily discoverable and hittable on all devices. Users can always see the chevron icon indicating they can reopen the sidebar, and the 44px size meets accessibility standards without requiring hover states.

---

### Fix #4: Remove Unused `isOpen` Prop (Low Priority)

**Root Cause:** The `isOpen` prop is passed from parent to `FiltersSidebar` component but never used in the component implementation. This is dead code that adds confusion and violates the minimal prop passing principle.

**Solution:** Remove prop from both parent caller and component signature.

**Files Changed:**
- `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` (line 175)
- `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx` (lines 21-36)

**Changes:**
```typescript
// Parent (PrincipalDashboardV2.tsx) - BEFORE:
<FiltersSidebar
  filters={filterState}
  onFiltersChange={setFilterState}
  onClearFilters={handleClearFilters}
  activeCount={activeFilterCount}
  isOpen={sidebarOpen}          // ← REMOVED
  onToggle={() => setSidebarOpen(false)}
/>

// Parent - AFTER:
<FiltersSidebar
  filters={filterState}
  onFiltersChange={setFilterState}
  onClearFilters={handleClearFilters}
  activeCount={activeFilterCount}
  onToggle={() => setSidebarOpen(false)}
/>

// Component (FiltersSidebar.tsx) - BEFORE:
interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
  isOpen: boolean;        // ← REMOVED
  onToggle: () => void;
}

export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeCount,
  isOpen,                 // ← REMOVED
  onToggle,
}: FiltersSidebarProps) {

// Component - AFTER:
interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
  onToggle: () => void;
}

export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeCount,
  onToggle,
}: FiltersSidebarProps) {
```

**Result:** Clean prop interface with no dead code. Component signature accurately reflects which props are actually used.

---

## Testing & Verification

**Manual Testing:**
1. ✅ **Filter persistence:** Set health/stage filters, collapse sidebar, refresh page → Filters persist correctly
2. ✅ **Sidebar state:** Collapse sidebar, refresh page → Sidebar remains collapsed
3. ✅ **Storage keys:** Check browser DevTools → Application → Local Storage → Keys are `pd.filters`, `pd.sidebarOpen`, `pd.filtersOpen` (not double-prefixed)
4. ✅ **Assignee filter:** Confirm assignee dropdown is not visible in sidebar
5. ✅ **Rail button:** Collapse sidebar, verify 44px button is easily clickable on desktop and touch devices
6. ✅ **Touch targets:** Use browser touch emulation to verify rail button meets 44px minimum
7. ✅ **TypeScript:** `npm run typecheck` passes with no errors about unused props

**Browser DevTools Verification:**
```javascript
// Check localStorage keys (should be pd.*, not pd.pd.*):
Object.keys(localStorage).filter(k => k.startsWith('pd.'))
// Expected: ["pd.filters", "pd.sidebarOpen", "pd.filtersOpen", ...]
```

---

## Impact & Benefits

**Fix #1 (Storage Keys):**
- ✅ Filter selections now persist across page refreshes
- ✅ Sidebar collapse state persists correctly
- ✅ No migration needed (development-only project)

**Fix #2 (Hide Assignee):**
- ✅ No confusing non-functional UI controls
- ✅ Clean UX until database supports filtering
- ✅ Easy to re-enable when ready (single uncomment)

**Fix #3 (Rail Button):**
- ✅ WCAG 2.1 AA compliant touch target (44px minimum)
- ✅ Easily discoverable on all devices
- ✅ Better user experience on tablets and touch screens

**Fix #4 (Remove isOpen):**
- ✅ Clean component interface
- ✅ No dead code in prop definitions
- ✅ Easier to maintain and reason about

---

## Files Modified

1. `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`
   - Fixed `usePrefs` calls (lines 41, 51)
   - Updated rail button (lines 240-262)
   - Removed `isOpen` prop from FiltersSidebar call (line 175)

2. `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`
   - Fixed `usePrefs` call (line 39)
   - Commented out Assignee section (lines ~140-180)
   - Removed `assigneeOpen` state (line ~62)
   - Removed `isOpen` from interface and destructuring (lines 21-36)

3. `src/atomic-crm/dashboard/v2/hooks/usePrefs.ts`
   - No changes (hook already worked correctly)

---

## Future Work

- **Database migration:** Add `sales_id` column to `principal_opportunities` and `priority_tasks` views
- **Re-enable assignee filter:** Uncomment assignee section in `FiltersSidebar.tsx` and filtering logic in `OpportunitiesHierarchy.tsx` (lines 77-84)
- **TasksPanel integration:** Wire up `assignee` prop filtering when database supports it
- **E2E tests:** Add tests for filter persistence and rail button accessibility

---

## References

- Original implementation plan: `docs/plans/2025-01-15-dashboard-v2-filter-wiring-sidebar-collapse-REVISED.md`
- WCAG 2.1 AA Touch Target Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- Engineering Constitution: `docs/claude/engineering-constitution.md`
- Design System: `docs/architecture/design-system.md`
