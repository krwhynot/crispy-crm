# Unified Design System Cleanup Strategy

**Date:** 2025-11-16
**Status:** Planning
**Related Document:** [Unified Design System Rollout](2025-11-16-unified-design-system-rollout.md)
**Type:** Refactoring & Technical Debt

## Overview

This document defines a **phase-locked cleanup cadence** that pairs with each milestone of the unified design system rollout. The goal: ensure legacy code is purged immediately after its replacement ships, preventing fallback patterns and keeping the codebase clean for subsequent phases.

**Core Principle:** Cleanup is NOT a post-launch task. It happens **in lockstep with each phase** so that by Phase 4, there are zero deprecated patterns left to discover.

---

## Philosophy: Direct Migration Without Legacy Burden

Per Engineering Constitution: **no-backward-compatibility: Breaking changes allowed**.

This cleanup strategy enforces that principle operationally:
- **No gradual migration.** Delete old components when new ones ship.
- **No feature flags.** No fallbacks to old layouts.
- **No cleanup debt.** Each phase leaves zero deprecated code behind.
- **No confusion.** Devs can't accidentally use old patterns.

---

## Phase 0: Foundation Prep (Before Phase 1 Kickoff)

**Goal:** Ensure the codebase is clean before introducing new standard components.

### Cleanup Tasks

#### 1. Remove Deprecated Utility Classes & Aliases

**Search for and remove:**
```bash
# Old card/table utilities
grep -r "\.card-base\|\.card-minimal\|\.table-legacy\|\.table-dense" src/

# Old spacing aliases
grep -r "spacing-tight\|spacing-loose\|spacing-dashboard" src/

# Old color fallbacks
grep -r "legacy-brand\|fallback-neutral" src/
```

**Action:** Delete all matches and update imports.

#### 2. Audit CSS Modules & Inline Styles

**Search for:**
```bash
# CSS modules tied to old layouts
find src -name "*.module.css" | grep -i "list\|show\|edit\|create" | head -20

# Inline tailwind hacks for old patterns
grep -r "className=.*\[color:var(--" src/ | head -10
```

**Action:**
- Inline CSS modules into component files (small ones only)
- Delete unused CSS modules
- Convert inline style hacks to semantic utilities

#### 3. Remove Stale Color Maps

**Search for:**
```bash
grep -r "colorMap\|tagColorLegacy\|statusColorFallback" src/
```

**Action:** Delete functions that predate the new semantic palette.

#### 4. Clean Up Old Route Definitions

**Search for:**
```bash
grep -r "/:id/show\|/:id/edit.*fullPage\|:resource/create/wizard" src/
```

**Action:** Remove any route definitions that won't exist in the new pattern (`?view=123` instead of `/contacts/123/show`).

#### 5. Verify New Components Exist

**Checklist:**
- [ ] `src/components/admin/StandardListLayout.tsx` exists
- [ ] `src/components/admin/ResourceSlideOver.tsx` exists
- [ ] `src/components/admin/PremiumDatagrid.tsx` exists
- [ ] All three components have unit tests (>70% coverage)
- [ ] `src/index.css` includes all tokenized utilities:
  - `.card-container`
  - `.create-form-card`
  - `.interactive-card`
  - `.table-row-premium`
  - `.filter-sidebar`
  - `.btn-premium`
  - `.focus-ring`

**Verification Command:**
```bash
grep -E "\.card-container|\.create-form-card|\.table-row-premium|\.filter-sidebar" src/index.css
# Should find all 7 utility classes
```

#### 6. Update Skill Documentation

**Actions:**
- [ ] `.claude/skills/crispy-design-system/SKILL.md` references only new patterns
- [ ] All resource files in `.claude/skills/crispy-design-system/resources/` cross-link to rollout plan
- [ ] No outdated examples showing old layout patterns

---

## Phase 1: Foundation Components (Week 1)

**Shipped Deliverables:**
- StandardListLayout.tsx
- ResourceSlideOver.tsx
- PremiumDatagrid.tsx (wrapper around React Admin Datagrid)
- Tokenized utility classes in `src/index.css`

### Cleanup Gate: Phase 1 Completion

**Before Phase 2 (Contacts) can start, ALL of the following must be true:**

#### 1. Delete Beta/Archived Layout Components

**Search for:**
```bash
find src -type d -name "*beta*" -o -name "*archived*" -o -name "*old*" | grep -i "layout\|list\|show\|edit"
```

**Action:** Delete entire directories:
```bash
rm -rf src/components/layouts/beta
rm -rf src/components/admin/deprecated
```

#### 2. Remove Feature Flags for New Components

**Search for:**
```bash
grep -r "ENABLE_NEW_LIST_LAYOUT\|FEATURE_SLIDE_OVER\|USE_PREMIUM_DATAGRID" src/
```

**Action:** Delete all conditional branches - components are now the default.

#### 3. Prune Unused Exports

**Search for:**
```bash
grep -r "export.*Legacy\|export.*Old\|export.*Deprecated" src/
```

**Action:** Remove deprecated exports from `index.ts` files.

#### 4. Update Routing Configuration

**Search for:**
```bash
grep -r "showRoute\|editRoute\|createRoute.*page" src/ | grep -v "slide.*over\|modal"
```

**Action:**
- Remove old full-page route definitions
- Ensure all routes use query param navigation (`?view=123`, `?edit=123`)
- Add redirect rules if needed (old URLs → new URL with query params)

#### 5. Verify New Components Are Discoverable

**Checklist:**
- [ ] `src/components/admin/index.ts` exports all three new components
- [ ] README or dev docs mention the three new standard components
- [ ] Example code in comments uses NEW patterns only
- [ ] No comments mentioning "legacy" or "deprecated" patterns

**Verification:**
```bash
grep -l "StandardListLayout\|ResourceSlideOver\|PremiumDatagrid" src/components/admin/*.tsx | wc -l
# Should be 3+ files
```

#### 6. Update `.claude/skills` References

**Actions:**
- [ ] `.claude/skills/crispy-design-system/SKILL.md` mentions Phase 1 completion
- [ ] Resource files show StandardListLayout/ResourceSlideOver examples only
- [ ] No mentions of "legacy list view" or "old show pattern"

#### 7. Mark Old Components for Deletion (Contacts Only)

**Note:** Don't delete yet - create deletion tasks for Phase 2 instead. Just mark them:

```typescript
// src/atomic-crm/contacts/ListLegacy.tsx
/**
 * @deprecated Use StandardListLayout + PremiumDatagrid instead
 * @see src/atomic-crm/contacts/List.tsx
 * @deleteAfter Phase 2 (2025-11-20)
 */
```

---

## Phase 2: Pilot Resource - Contacts (Week 2)

**Shipped Deliverables:**
- ContactList migrated to StandardListLayout + PremiumDatagrid
- ContactShow/Edit migrated to ResourceSlideOver
- ContactCreate migrated to full-page .create-form-card
- New routing with query params

### Cleanup Gate: Phase 2 Completion

**Contacts legacy code is DELETED.** No fallbacks. No dual maintenance.

#### 1. Delete Legacy Contact Components

**Files to delete:**
```bash
rm src/atomic-crm/contacts/ListLegacy.tsx          # If exists
rm src/atomic-crm/contacts/LegacyShow.tsx         # If exists
rm src/atomic-crm/contacts/LegacyEdit.tsx         # If exists
rm src/atomic-crm/contacts/LegacyCreate.tsx       # If exists
rm src/atomic-crm/contacts/*.module.css           # Old CSS modules
rm -rf src/atomic-crm/contacts/styles/           # Old style directory
```

#### 2. Delete Legacy Route Definitions

**Search for:**
```bash
grep -n "contacts.*show\|contacts.*edit.*full" src/root/CRM.tsx
```

**Action:** Remove from `<Resource name="contacts">` definition:
```tsx
// DELETE THESE:
show: ContactShow,
edit: ContactEdit,

// KEEP THIS:
list: ContactList,
create: ContactCreate,
```

#### 3. Remove Contact-Specific Feature Flags

**Search for:**
```bash
grep -r "contactsNewLayout\|useContactSlideOver\|contactsClassicView" src/
```

**Action:** Delete all conditions. Code now assumes new layout.

#### 4. Update Tests

**Actions:**
- [ ] Delete all tests for legacy components
- [ ] Update ContactList tests to use StandardListLayout selectors
- [ ] Update ContactShow/Edit tests to use ResourceSlideOver selectors
- [ ] Verify E2E tests use `?view=` and `?edit=` query params

**Command:**
```bash
rm src/atomic-crm/contacts/**/*.legacy.test.tsx
# Update remaining tests to use new selectors
```

#### 5. Verify No Broken Imports

**Search for:**
```bash
grep -r "from.*contacts.*List\|from.*contacts.*Show\|from.*contacts.*Edit" src/ | grep -v "new-"
```

**Action:** Ensure all imports point to NEW component files only.

#### 6. Update Documentation

**Actions:**
- [ ] `src/atomic-crm/contacts/README.md` (if exists) mentions new pattern only
- [ ] Remove any screenshots showing old list/show/edit layout
- [ ] Update inline code examples to use new components
- [ ] Delete any "legacy" or "migration" notes in comments

**Search for:**
```bash
grep -ri "old layout\|previous design\|legacy show" src/atomic-crm/contacts/
```

#### 7. Remove Contacts-Specific Utilities

**Search for:**
```bash
grep -r "makeContactRows\|contactListConfig\|legacyContactFilters" src/
```

**Action:** Delete functions that served old Contact list layout.

#### 8. Verify Zero Warnings

**Run build:**
```bash
npm run build 2>&1 | grep -i "deprecated\|legacy\|warning.*contacts"
```

**Expected:** Zero matches.

---

## Phase 3: Resource Rollout (Weeks 3-5)

**Sequence:**
- **Week 3:** Tasks & Sales
- **Week 4:** Organizations & Products
- **Week 5:** Opportunities

### Per-Resource Cleanup (Run for Tasks, then Sales, then Orgs, then Products, then Opps)

#### Week 3: Tasks & Sales Cleanup

**Files to delete (Tasks):**
```bash
rm src/atomic-crm/tasks/ListLegacy.tsx
rm src/atomic-crm/tasks/LegacyShow.tsx
rm src/atomic-crm/tasks/LegacyEdit.tsx
rm src/atomic-crm/tasks/LegacyCreate.tsx
rm src/atomic-crm/tasks/**/*.module.css
find src/atomic-crm/tasks -name "*.deprecated.ts" -delete
```

**Files to delete (Sales):**
```bash
rm src/atomic-crm/sales/ListLegacy.tsx
rm src/atomic-crm/sales/LegacyShow.tsx
rm src/atomic-crm/sales/LegacyEdit.tsx
rm src/atomic-crm/sales/**/*.module.css
```

**Routing cleanup:**
```typescript
// src/root/CRM.tsx
// REMOVE from <Resource name="tasks"> and <Resource name="sales">:
// show: TaskShow,
// edit: TaskEdit,
// (but keep list: TaskList and create: TaskCreate)
```

**Feature flags:**
```bash
grep -r "tasksNewLayout\|salesNewLayout\|useTasksSlideOver" src/ && rm -rf # matches
```

**Test cleanup:**
```bash
rm src/atomic-crm/tasks/**/*.legacy.test.tsx
rm src/atomic-crm/sales/**/*.legacy.test.tsx
```

**Repo-wide sweep (after Tasks & Sales complete):**
```bash
# Find any lingering references to old task/sales patterns
grep -r "TaskListLegacy\|SalesShowOld\|legacySalesEdit" src/ && echo "FOUND DEPRECATED REFS"

# Remove temp instrumentation added during migration
grep -r "console.log.*legacy\|TODO.*migrate.*layout" src/atomic-crm/tasks src/atomic-crm/sales
```

#### Week 4: Organizations & Products Cleanup

**Files to delete (Organizations):**
```bash
rm src/atomic-crm/organizations/ListLegacy.tsx
rm src/atomic-crm/organizations/LegacyShow.tsx
rm src/atomic-crm/organizations/LegacyEdit.tsx
rm src/atomic-crm/organizations/LegacyCreate.tsx
rm src/atomic-crm/organizations/**/*.module.css
find src/atomic-crm/organizations -name "*.deprecated.ts" -delete
```

**Files to delete (Products):**
```bash
rm src/atomic-crm/products/ListLegacy.tsx
rm src/atomic-crm/products/LegacyShow.tsx
rm src/atomic-crm/products/LegacyEdit.tsx
rm src/atomic-crm/products/**/*.module.css
```

**Routing cleanup:**
```typescript
// src/root/CRM.tsx
// REMOVE show/edit from Organizations and Products
```

**Feature flags & instrumentation:**
```bash
grep -r "orgsNewLayout\|productsNewLayout\|debugOrgsMigration" src/ && rm -rf # matches
grep -r "console.log.*org\|TODO.*product.*layout" src/atomic-crm/organizations src/atomic-crm/products
```

**Repo-wide sweep (after Orgs & Products complete):**
```bash
# Comprehensive cleanup before Opportunities
grep -r "LegacyShow\|LegacyEdit\|LegacyCreate\|\.legacy\." src/ --include="*.tsx" --include="*.ts"
# Expected: ZERO matches (except Opportunities, which hasn't migrated yet)
```

#### Week 5: Opportunities Cleanup

**Note:** Opportunities is most complex (Kanban stays as alternate view).

**Files to delete:**
```bash
rm src/atomic-crm/opportunities/ListLegacy.tsx        # Old table list
rm src/atomic-crm/opportunities/LegacyShow.tsx       # Old full-page show
rm src/atomic-crm/opportunities/LegacyEdit.tsx       # Old full-page edit
rm src/atomic-crm/opportunities/LegacyCreate.tsx     # Old full-page create
rm src/atomic-crm/opportunities/**/*.module.css
find src/atomic-crm/opportunities -name "*.deprecated.ts" -delete
```

**Preserve:**
```typescript
// src/atomic-crm/opportunities/KanbanView.tsx stays
// It's the alternate view, not the list view
```

**Routing cleanup:**
```typescript
// src/root/CRM.tsx
// REMOVE show/edit
// KEEP list: OpportunitiesList (table)
// KEEP list alternate: KanbanView
// KEEP create: OpportunitiesCreate
```

**Feature flags:**
```bash
grep -r "opportunitiesNewLayout\|useOppSlideOver\|kanbanLegacy" src/ && rm -rf # matches
```

**Repo-wide final sweep (after Opps complete):**
```bash
# Everything should be migrated now
grep -r "LegacyList\|LegacyShow\|LegacyEdit\|LegacyCreate\|\.legacy\.\|\.deprecated\." src/ --include="*.tsx" --include="*.ts" --exclude-dir=node_modules

# Expected output: ZERO matches
# If found: ERROR - Phase 3 incomplete, don't proceed to Phase 4
```

---

## Phase 4: Polish & Optimization (Week 6)

**Shipped Deliverables:**
- All resources migrated
- Accessibility audit (WCAG 2.1 AA, Lighthouse ≥95)
- Performance optimization
- Zero deprecated code

### Final Cleanup Gate

#### 1. Comprehensive Deprecated Code Scan

```bash
#!/bin/bash
# Scan entire codebase for deprecated patterns

echo "=== Scanning for legacy layout patterns ==="
grep -r "LegacyList\|LegacyShow\|LegacyEdit\|LegacyCreate" src/ && echo "ERROR: Found legacy components" || echo "✓ No legacy components"

echo "=== Scanning for deprecated utilities ==="
grep -r "card-base\|table-legacy\|spacing-tight\|spacing-dashboard" src/ && echo "ERROR: Found deprecated utilities" || echo "✓ No deprecated utilities"

echo "=== Scanning for feature flags ==="
grep -r "ENABLE_NEW\|USE_LEGACY\|FEATURE_.*_OLD\|newLayout\|classicView" src/ && echo "ERROR: Found feature flags" || echo "✓ No feature flags"

echo "=== Scanning for old routes ==="
grep -r ":id/show\|:id/edit.*page\|create/wizard" src/root/ && echo "ERROR: Found old routes" || echo "✓ Using query params only"

echo "=== Scanning for inline CSS variable hacks ==="
grep -r "className=.*\[color:var(--\|shadow-\[var(--" src/atomic-crm/ && echo "ERROR: Found inline CSS vars" || echo "✓ Using semantic utilities only"

echo "=== Scanning for console.log migrations ==="
grep -r "console.log.*legacy\|console.log.*TODO.*layout" src/ && echo "WARNING: Debug logging from migration" || echo "✓ No debug logging"

echo "Done."
```

**Action:** Run this scan. If ANY errors found, don't proceed to documentation cleanup.

#### 2. Remove Temporary Instrumentation

**Search for and delete:**
```bash
# Debug props added during migration
grep -r "debug.*layout\|_legacyMode\|showOldUI" src/ && rm -rf # matches

# TODO comments from migration
grep -r "TODO.*migrate\|TODO.*replace.*old\|FIXME.*legacy" src/ && sed -i '' '/TODO.*migrate/d' # matches

# Unused imports from deleted components
grep -r "import.*Legacy\|import.*Old\|from.*deprecated" src/ && rm -rf # matches
```

**Verification:**
```bash
npm run lint 2>&1 | grep -i "unused import\|deprecated"
# Should show zero unused imports from deleted modules
```

#### 3. Update Documentation & Screenshots

**Remove outdated content:**
```bash
# Find screenshots showing old UI
find docs -name "*.png" -o -name "*.jpg" | xargs grep -l "legacy\|old.*layout\|fullpage.*list"
# Review and delete old screenshots

# Remove migration guides
rm docs/migration/legacy-to-unified-layout.md  # If exists
rm docs/OLD_PATTERNS.md
```

**Search for outdated text:**
```bash
grep -r "old layout\|previous design\|legacy.*pattern\|you can still use.*full-page" docs/

# Replace any "new unified" language with just the pattern name
# Example: "new unified list pattern" → "list view"
```

**Update resource READMEs:**
```bash
# For each resource (contacts, organizations, tasks, etc.)
# Remove any "migration" or "transition" notes
# Update code examples to use ONLY new patterns
# Remove screenshots showing old layout

for resource in contacts organizations tasks sales products opportunities; do
  grep -i "old.*layout\|legacy\|deprecated\|previously" "src/atomic-crm/$resource/README.md"
  # Review and clean up
done
```

#### 4. Audit `.claude/skills` One Final Time

**Check that no outdated patterns are documented:**

```bash
# Search all resource files for "old", "legacy", "deprecated"
grep -ri "old.*layout\|legacy\|deprecated\|previously used" .claude/skills/crispy-design-system/resources/

# Expected: ZERO matches
```

**Actions:**
- [ ] color-system.md shows ONLY semantic utilities (bg-card, text-foreground, etc.)
- [ ] design-tokens.md references ONLY new spacing variables
- [ ] data-tables.md shows StandardListLayout + PremiumDatagrid only
- [ ] form-patterns.md shows create-form-card and full-page patterns only
- [ ] component-architecture.md references StandardListLayout, ResourceSlideOver, PremiumDatagrid
- [ ] elevation.md mentions .card-container, .create-form-card, .table-row-premium
- [ ] typography.md shows heading scale from plan (no inline CSS variable examples)
- [ ] dashboard-layouts.md notes StandardListLayout is for resource lists

#### 5. Verify Build Succeeds

```bash
npm run build 2>&1 | grep -i "error\|deprecat\|legacy"
# Expected: Zero matches (other than possible third-party warnings)

npm run lint 2>&1 | grep -i "unused\|deprecated\|legacy"
# Expected: Zero matches
```

#### 6. Final Smoke Test

```bash
# Open each resource in the UI and verify:
# - List view shows table with sidebar filters ✓
# - Clicking row opens slide-over (not full page) ✓
# - Edit button in slide-over toggles edit mode ✓
# - Create button opens full-page form ✓
# - No console errors or deprecation warnings ✓

for resource in contacts organizations tasks sales products opportunities; do
  echo "Testing $resource..."
  # Navigate to /resources
  # Click list item → verify slide-over opens
  # Click Edit → verify edit mode
  # Click Cancel → verify returns to list
  # Click Create → verify full-page form
done
```

---

## Verification Checklist (All Phases)

### Phase 0 Completion
- [ ] All deprecated utilities removed from src/index.css
- [ ] Phase 0 cleanup script passes (zero matches)
- [ ] StandardListLayout, ResourceSlideOver, PremiumDatagrid exist with tests
- [ ] Tokenized utilities defined in src/index.css
- [ ] Skill documentation references only new patterns

### Phase 1 Completion
- [ ] All "beta"/"archived" layout components deleted
- [ ] Feature flags for new components removed
- [ ] Old route definitions removed (query params only)
- [ ] New components discoverable in src/components/admin/
- [ ] Phase 1 cleanup script passes (zero matches)
- [ ] No "legacy" or "deprecated" comments in codebase

### Phase 2 Completion (Contacts)
- [ ] ContactListLegacy.tsx deleted
- [ ] ContactShow/Edit legacy files deleted
- [ ] Old route definitions removed from CRM.tsx
- [ ] All tests pass with new components
- [ ] Zero broken imports
- [ ] Phase 2 cleanup script passes (zero matches)

### Phase 3 Completion (Tasks, Sales, Orgs, Products, Opps)
- [ ] All legacy component files deleted per resource
- [ ] All routing definitions use query params only
- [ ] All feature flags removed
- [ ] All CSS modules tied to old layouts deleted
- [ ] All tests updated and passing
- [ ] Phase 3 comprehensive scan passes (zero matches)

### Phase 4 Completion (Polish)
- [ ] Comprehensive deprecated code scan passes
- [ ] All temporary instrumentation removed
- [ ] Documentation updated (no old screenshots)
- [ ] `.claude/skills` contains no outdated patterns
- [ ] Build succeeds with zero errors
- [ ] Lint passes with zero deprecated warnings
- [ ] E2E smoke tests pass for all resources

---

## Integration with Rollout Plan

This cleanup strategy is **NOT optional**. It's a hard gate for each phase:

| Phase | Blocked Until | Cleanup Complete |
|-------|---------------|------------------|
| 0 → 1 | Foundation components ship | All deprecated utilities removed |
| 1 → 2 | Contacts migrated | Feature flags deleted, old routes removed |
| 2 → 3 | Tasks/Sales ship | Contacts legacy code purged |
| 3 → 4 | All resources migrated | All resource legacy code purged |
| 4 → Launch | Polish complete | Final scan passes, docs updated |

**If cleanup incomplete, phase is NOT considered done.**

---

## Commands Summary

```bash
# Phase 0 Cleanup
grep -r "\.card-base\|\.table-legacy\|spacing-tight" src/ && echo "CLEANUP NEEDED"
grep -r "ENABLE_NEW_LIST_LAYOUT\|FEATURE_SLIDE_OVER" src/ && echo "CLEANUP NEEDED"
find src -type d -name "*beta*" -o -name "*archived*" | grep -i "layout"

# Phase 1 Cleanup
grep -r "Legacy.*Component\|\.deprecated\." src/components && echo "CLEANUP NEEDED"

# Phase 2+ Comprehensive Scan
grep -r "LegacyList\|LegacyShow\|LegacyEdit\|LegacyCreate" src/ --include="*.tsx" --include="*.ts"
grep -r "console.log.*legacy\|TODO.*migrate.*layout" src/
grep -r "className=.*\[color:var(--" src/atomic-crm/ | head -5

# Final Build Verification
npm run build 2>&1 | grep -iE "error|deprecat|legacy" | grep -v node_modules
npm run lint 2>&1 | grep -iE "unused|deprecated|legacy"
```

---

## Success Criteria

At **launch** (end of Phase 4):

✅ **Zero deprecated code** in src/
✅ **Zero legacy patterns** in `.claude/skills`
✅ **Zero feature flags** for layout patterns
✅ **Zero old routes** (all query param based)
✅ **Zero inline CSS variable hacks** (all semantic utilities)
✅ **Zero broken imports** (build succeeds)
✅ **All resources** use StandardListLayout + ResourceSlideOver + full-page creates
✅ **All tests** pass with new patterns
✅ **All documentation** reflects unified design system only

---

## Notes

- **Do not skip cleanup "for now."** Legacy code attracts bugs, confusion, and accidental usage.
- **Cleanup is part of the milestone.** Phase X is not complete until cleanup is done.
- **Use search queries liberally.** grep/rg are your friends. Run them before and after each deletion.
- **Test after each deletion.** Build, lint, and run a few manual E2E checks.
- **Document what you delete.** If someone asks "where did X go?", you should be able to point them to the PR and plan.

---

**Last Updated:** 2025-11-16
**Owner:** Engineering Team
**Status:** Ready for Phase 1
