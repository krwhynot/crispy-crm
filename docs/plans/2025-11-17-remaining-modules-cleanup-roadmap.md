# Remaining Modules CSS Cleanup Roadmap

**Date:** 2025-11-17
**Status:** Ready for Execution
**Related:** [Unified Design System Cleanup Strategy](2025-11-16-unified-design-system-cleanup-strategy.md)
**Completed Modules:** Organizations, Tasks, Contacts, Opportunities (158 hacks eliminated)

## Executive Summary

**Remaining Work:** 58 CSS hacks across 10 modules (27 files)
**Estimated Effort:** 6-9 hours focused cleanup
**Priority:** Phase 1 (Shared Infrastructure) blocks Phase 5 deliverables

---

## Detailed Scope by Module

### HIGH PRIORITY - Phase 1: Shared Infrastructure (18 hacks)
*Must complete before Phase 5 to ensure consistent UX across new features*

#### 1. **simple-list** - 7 hacks (3 files) 🔥 CRITICAL
**Why First:** Used by EVERY list view in the application. Fixing this eliminates visual inconsistencies across all resources.

**Files:**
- `SimpleListItem.tsx` (3 hacks)
  - Line 36: `border-[color:var(--border)]` → `border-border`
  - Line 36: `hover:bg-[color:var(--background)]` → `hover:bg-background`
  - Line 47: `hover:bg-[color:var(--background-subtle)]` → `hover:bg-muted`
- `SimpleList.tsx` (3 hacks)
  - Line 85: `text-[color:var(--text-body)]` → `text-foreground`
  - Line 87: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 91: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `ListNoResults.tsx` (1 hack)
  - Line 9: `text-[color:var(--text-subtle)]` → `text-muted-foreground`

**Dependencies:** Referenced by all list views (contacts, tasks, opportunities, etc.)
**Reuse Pattern:** After cleanup, cleaned resources already use this pattern - just verify consistency

#### 2. **filters** - 7 hacks (3 files) 🔥 CRITICAL
**Why Second:** Used by all filterable resources. Phase 5 features need consistent filter UX.

**Files:**
- `FilterCategory.tsx` (5 hacks)
  - Line 20: `hover:bg-[color:var(--background-subtle)]` → `hover:bg-muted`
  - Line 22: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 22: `group-hover:text-[color:var(--text-body)]` → `group-hover:text-foreground`
  - Line 25: `text-[color:var(--text-body)]` → `text-foreground`
  - Line 28: `bg-[color:var(--accent-clay-600)]` → `bg-accent` (verify accent token exists)
- `FilterChipsPanel.tsx` (1 hack)
  - Line 42: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `FilterChip.tsx` (1 hack) - **Note:** May be duplicate of FilterCategory

**Dependencies:** Used by Organizations, Contacts, Products, Opportunities filters
**Reuse Pattern:** Organizations filter cleanup provides reference implementation

#### 3. **notes** - 4 hacks (2 files)
**Why Third:** Shared component used in Contacts and Opportunities detail views.

**Files:**
- `NoteInputs.tsx` (2 hacks)
  - Line 71: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 75: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `Note.tsx` (2 hacks)
  - Line 78: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 84: `text-[color:var(--text-subtle)]` → `text-muted-foreground`

**Dependencies:** ContactNotesTab, OpportunityNotesTab
**Reuse Pattern:** Follow Contacts/Opportunities cleanup patterns

---

### MEDIUM PRIORITY - Phase 2: High-Volume Modules (28 hacks)

#### 4. **activity** - 11 hacks (5 files) ⚡ REFACTORING OPPORTUNITY
**Sequencing:** After simple-list (activity logs use simple-list components)

**Files:** (All use identical `text-[color:var(--text-subtle)]` pattern)
- `ActivityLogOpportunityCreated.tsx` (3 hacks) - Lines 18, 26, 30
- `ActivityLogOrganizationCreated.tsx` (2 hacks) - Lines 18, 26
- `ActivityLogOpportunityNoteCreated.tsx` (2 hacks) - Lines 20, 30
- `ActivityLogContactNoteCreated.tsx` (2 hacks) - Lines 23, 33
- `ActivityLogContactCreated.tsx` (2 hacks) - Lines 17, 25

**Refactoring Recommendation:**
```tsx
// Create shared component to eliminate duplication
// src/atomic-crm/activity/ActivityLogText.tsx
export const ActivityLogText = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted-foreground text-sm">{children}</span>
);

// Then replace all 11 instances with:
<ActivityLogText>by {sales}</ActivityLogText>
```

**Dependencies:** Used in Contacts ActivitiesTab, Organizations ActivitiesTab, Opportunities detail
**Reuse Pattern:** Contacts ActivitiesTab cleanup shows pattern (already converted in commit de2a07db)

#### 5. **products** - 10 hacks (4 files)
**Sequencing:** Independent - can run parallel with activity

**Files:**
- `ProductListContent.tsx` (5 hacks)
  - Line 24: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 52: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 58: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 62: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 54: `hover:bg-[color:var(--muted)]` → `hover:bg-muted`
- `ProductCard.tsx` (3 hacks)
  - Line 32: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 38: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 40: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `ProductEmpty.tsx` (1 hack)
  - Line 17: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `ProductEdit.tsx` (1 hack)
  - Line 63: `text-[color:var(--text-subtle)]` → `text-muted-foreground`

**Dependencies:** None - Products module is isolated
**Reuse Pattern:** Follow Organizations/Opportunities cleanup

#### 6. **dashboard** - 7 hacks (5 files) ⚠️ LEGACY SPACING
**Sequencing:** CRITICAL - Must complete before Phase 5 dashboard entry points

**Files:**
- `TasksListFilter.tsx` (2 hacks)
  - Line 35: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 38: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
- `TasksList.tsx` (2 hacks)
  - Line 62: `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Line 64: `text-[color:var(--text-title)]` → `text-foreground` (verify --text-title exists)
- `v2/components/DashboardHeader.tsx` (1 hack) **LEGACY SPACING**
  - Line 66: `px-[var(--spacing-edge-desktop)]` → `px-6` (24px standard)
- `v2/PrincipalDashboardV2.tsx` (1 hack) **LEGACY SPACING**
  - Line 142: `px-[var(--spacing-edge-desktop)]` → `px-6`
- `TasksListEmpty.tsx` (1 hack)
  - Line 8: `text-[color:var(--text-body)]` → `text-foreground`

**Special Case - Legacy Spacing Migration:**
Dashboard V2 uses `--spacing-edge-desktop` token that should be replaced with Tailwind v4 semantic spacing:
- Desktop (1440px+): `px-6` (24px)
- iPad (768-1024px): Consider responsive `px-4 lg:px-6` if needed

**Dependencies:** Tasks module (already cleaned - commit c63965aa)
**Phase 5 Blocker:** New dashboard entry points must match design system styles

---

### LOW PRIORITY - Phase 3: Remaining Modules (12 hacks)

#### 7. **pages** - 8 hacks (1 file) ✨ QUICK WIN
**Files:**
- `WhatsNew.tsx` (8 hacks) - All `text-[color:var(--text-subtle)]` → `text-muted-foreground`
  - Lines: 30, 52, 55, 60, 64, 66, 68, 79

**Why Quick Win:** Single file, all identical replacements

#### 8. **misc** - 2 hacks (2 files)
**Files:**
- `ImageEditorField.tsx` (1 hack) - Line 45
- `ContactOption.tsx` (1 hack) - Line 21

#### 9. **settings** - 1 hack (1 file)
**Files:**
- `SettingsPage.tsx` (1 hack) - Line 13

#### 10. **tags** - 1 hack (1 file)
**Files:**
- `TagDialog.tsx` (1 hack) - Line 88

---

## Sequencing & Dependencies

### Critical Path (Blocks Phase 5)

```
Phase 1 (MUST complete first):
  simple-list → filters → notes
  ↓
Phase 2 (Before Phase 5 features):
  dashboard (new entry points)
  ↓
Phase 5 Deliverables
  (New features use cleaned components)
```

### Parallel Execution Opportunities

**Can run in parallel:**
- activity module (after simple-list)
- products module (independent)
- pages/misc/settings/tags (independent)

**Sequential dependencies:**
- simple-list MUST complete before activity (activity logs use simple-list)
- filters SHOULD complete before dashboard (dashboard uses filter components)
- notes can run parallel with activity/products

---

## Component Reuse Patterns

### Already-Cleaned Components You Can Reference

1. **Organizations Module** (commit a11b53e8)
   - `OrganizationListFilter.tsx` - Filter sidebar pattern
   - `OrganizationType.tsx` - Tag color system (`.tag-*` classes)
   - `ActivitiesTab.tsx` - Activity timeline styling

2. **Contacts Module** (commit de2a07db)
   - `ContactAside.tsx` - Sidebar info cards
   - `ActivitiesTab.tsx` - Activity log pattern (EXACT match for activity module)
   - `SidebarActiveFilters.tsx` - Active filter chips

3. **Tasks Module** (commit c63965aa)
   - `SidebarActiveFilters.tsx` - Filter chip component
   - `Task.tsx` - Text color patterns

4. **Opportunities Module** (commit 73d9e38b)
   - `OpportunityShow.tsx` - Detail page layout
   - `ChangeLogTab.tsx` - Timeline styling

### Shared Component Migration Impact

| Component | Used By | Cleanup Impact |
|-----------|---------|----------------|
| `simple-list` | All list views | High - affects every resource |
| `filters` | Filterable resources | High - affects 6+ resources |
| `notes` | Contacts, Opportunities | Medium - 2 detail pages |
| `activity` | Contacts, Organizations, Opportunities | Medium - 3 modules |

**Key Insight:** Cleaning shared components in Phase 1 means:
- Less duplication in Phase 2/3
- Consistent UX across all modules
- Easier visual regression testing

---

## How to Repeat the Process

### Step 1: Scan Module for CSS Hacks

```bash
# Example for dashboard module
grep -rn "text-\[color:var\|bg-\[color:var\|border-\[color:var\|hover:bg-\[var\|px-\[var" \
  src/atomic-crm/dashboard/ 2>/dev/null

# Expected output format:
# src/atomic-crm/dashboard/TasksList.tsx:64:text-[color:var(--text-title)]
```

### Step 2: Create Replacement Checklist

For each file:
1. Read the file: `Read file_path`
2. Identify all inline CSS variable patterns
3. Map to semantic utilities:
   - `text-[color:var(--text-subtle)]` → `text-muted-foreground`
   - `bg-[color:var(--background-subtle)]` → `bg-muted`
   - `border-[color:var(--border)]` → `border-border`
   - `px-[var(--spacing-edge-desktop)]` → `px-6`

### Step 3: Make Replacements

Use the Edit tool for exact string replacements:
```typescript
Edit({
  file_path: "src/atomic-crm/dashboard/TasksList.tsx",
  old_string: 'className="text-[color:var(--text-title)]"',
  new_string: 'className="text-foreground"'
});
```

### Step 4: Verify Zero Hacks Remain

```bash
# Must return 0 matches
grep -rn "text-\[color:var\|bg-\[color:var\|border-\[color:var" src/atomic-crm/MODULE_NAME/
```

### Step 5: Run Verification Suite (CRITICAL)

**Design System Compliance Tests:**
```bash
# 1. Build verification
npm run build
# Expected: ✓ built in ~35-45s with zero errors

# 2. Lint verification
npm run lint
# Expected: Zero new errors in cleaned module

# 3. Unit tests
npm test
# Expected: All tests pass

# 4. E2E Smoke Tests (REQUIRED)
npm run test:e2e tests/e2e/design-system-smoke.spec.ts
# Expected: All visual regression tests pass
```

**Visual Regression Checklist:**
- [ ] Take screenshots before cleanup (save to `test-results/before/`)
- [ ] Run cleanup
- [ ] Take screenshots after cleanup (save to `test-results/after/`)
- [ ] Compare side-by-side for visual differences
- [ ] Verify interactive states (hover, active, focus)
- [ ] Test responsive breakpoints (iPad 768px, Desktop 1440px)

### Step 6: Commit with Standard Message

```bash
git add .
git commit -m "refactor(MODULE_NAME): Replace inline CSS hacks with semantic utilities"
```

---

## Verification & Testing Strategy

### Per-Module Checklist

After cleaning each module:

**1. Automated Verification**
```bash
# Zero CSS hacks
grep -rn "text-\[color:var\|bg-\[color:var" src/atomic-crm/MODULE_NAME/
# Expected: 0 matches

# Build passes
npm run build
# Expected: ✓ built successfully

# Lint passes
npm run lint
# Expected: Zero new errors
```

**2. Design System Playwright Suite**
```bash
# Run full design system test suite
npm run test:e2e tests/e2e/design-system-smoke.spec.ts

# Or run specific tests for module
npm run test:e2e -- --grep "MODULE_NAME"
```

**Tests Cover:**
- Color contrast (WCAG AA compliance)
- Interactive states (hover, focus, active)
- Responsive behavior (iPad + Desktop)
- Semantic utility usage
- Visual consistency with cleaned modules

**3. Manual Browser Testing**

**Critical Flows:**
- [ ] Navigate to module (e.g., `/dashboard`)
- [ ] Verify text colors match muted-foreground/foreground pattern
- [ ] Test hover states on interactive elements
- [ ] Verify spacing is consistent (no layout shifts)
- [ ] Check responsive behavior at 768px and 1440px
- [ ] Lighthouse audit ≥95 accessibility score

**4. Cross-Module Integration**

After Phase 1 (shared components):
- [ ] Test simple-list in Contacts, Tasks, Opportunities
- [ ] Test filters in Organizations, Products
- [ ] Test notes in Contacts and Opportunities detail views
- [ ] Verify no visual regressions in cleaned modules

---

## Compliance Bar

### Success Criteria (Per Module)

✅ **Zero CSS variable hacks** - All inline `var(...)` removed
✅ **Build passes** - No TypeScript errors
✅ **Lint passes** - Zero new warnings
✅ **Tests pass** - All unit + E2E tests green
✅ **Visual parity** - Screenshots match before/after
✅ **Accessibility maintained** - Lighthouse ≥95
✅ **Design system aligned** - Uses semantic utilities only

### Final Verification (All Modules Complete)

```bash
# Comprehensive scan - should return ZERO
grep -rn "text-\[color:var\|bg-\[color:var\|border-\[color:var" \
  src/atomic-crm/dashboard/ \
  src/atomic-crm/products/ \
  src/atomic-crm/settings/ \
  src/atomic-crm/activity/ \
  src/atomic-crm/notes/ \
  src/atomic-crm/filters/ \
  src/atomic-crm/misc/ \
  src/atomic-crm/tags/ \
  src/atomic-crm/simple-list/ \
  src/atomic-crm/pages/ 2>/dev/null

# Run full E2E suite
npm run test:e2e

# Verify design system documentation updated
# - Update docs/plans/2025-11-16-unified-design-system-rollout.md
# - Mark all modules as "Phase 4 Complete"
```

---

## Estimated Timeline

### Phase 1: Shared Infrastructure (Critical)
**Effort:** 2-3 hours
**Files:** 8 files (simple-list, filters, notes)
**Testing:** High priority - affects entire app

### Phase 2: High-Volume Modules
**Effort:** 3-4 hours
**Files:** 14 files (activity, products, dashboard)
**Testing:** Moderate - focus on dashboard v2 + activity refactoring

### Phase 3: Remaining Modules
**Effort:** 1-2 hours
**Files:** 5 files (pages, misc, settings, tags)
**Testing:** Light - isolated components

**Total:** 6-9 hours focused work + 2-3 hours comprehensive testing = **8-12 hours end-to-end**

---

## Quick Reference: Semantic Utility Mappings

```tsx
// Text Colors
text-[color:var(--text-subtle)]        → text-muted-foreground
text-[color:var(--text-body)]          → text-foreground
text-[color:var(--text)]               → text-foreground
text-[color:var(--text-title)]         → text-foreground
text-[color:var(--primary)]            → text-primary
text-[color:var(--destructive)]        → text-destructive
text-[color:var(--success)]            → text-success
text-[color:var(--muted-foreground)]   → text-muted-foreground

// Backgrounds
bg-[color:var(--background-subtle)]    → bg-muted
bg-[color:var(--background)]           → bg-background
bg-[color:var(--muted)]                → bg-muted
bg-[color:var(--primary)]              → bg-primary
bg-[var(--warning-default)]            → bg-warning
bg-[var(--brand-100)]                  → bg-brand-100

// Borders
border-[color:var(--border)]           → border-border
border-[var(--primary)]                → border-primary

// Hover States
hover:bg-[color:var(--muted)]          → hover:bg-muted
hover:bg-[color:var(--background)]     → hover:bg-background
hover:bg-[var(--warning-hover)]        → hover:bg-warning/90
hover:text-[color:var(--text-body)]    → hover:text-foreground

// Spacing (Legacy → Tailwind v4)
px-[var(--spacing-edge-desktop)]       → px-6  (24px)
py-[var(--spacing-section)]            → py-6  (24px)
```

---

## Files Changed Summary

**Total:** 27 files across 10 modules
**Commits Expected:** 10 (1 per module)
**Lines Changed:** ~120 deletions, ~120 insertions (net zero, pure refactoring)

---

## Related Documentation

- [Unified Design System Rollout](2025-11-16-unified-design-system-rollout.md) - Overall strategy
- [Cleanup Strategy](2025-11-16-unified-design-system-cleanup-strategy.md) - Phase 4 requirements
- [Design System](../architecture/design-system.md) - Semantic utilities reference
- [Testing Guide](../development/testing-quick-reference.md) - E2E test patterns

---

**Last Updated:** 2025-11-17
**Status:** Ready for Execution
**Next Action:** Start with Phase 1 (simple-list → filters → notes)
