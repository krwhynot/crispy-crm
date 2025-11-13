# Dashboard Cleanup & Semantic Colors Implementation Plan

**Date**: November 13, 2025
**Execution Method**: Subagent-Driven Development (Sequential with Quality Gates)

## Overview

Clean up dashboard dead code and complete semantic color migration for remaining dashboard components.

## Context

- **Completed**: MyTasksThisWeek and RecentActivityFeed now use 100% semantic colors
- **Remaining**: 12 unused component files (~1,300 LOC) + 7 files with hardcoded colors
- **Pattern Established**: Use `text-destructive`, `bg-destructive/10`, `text-warning/10`, `text-muted-foreground` etc.

---

## Task 1: Archive Unused Dashboard Components

### Objective
Move 12 unused dashboard component files to `archive/dashboard/` directory for safety (don't delete).

### Files to Archive (~/src/atomic-crm/dashboard/)
1. `DashboardActivityLog.tsx` (28 lines)
2. `QuickAdd.tsx` (23 lines)
3. `MetricsCardGrid.tsx` (192 lines)
4. `HotContacts.tsx` (89 lines)
5. `LatestNotes.tsx` (110 lines)
6. `MiniPipeline.tsx` (55 lines)
7. `MyOpenOpportunities.tsx` (61 lines)
8. `OverdueTasks.tsx` (68 lines)
9. `PipelineByStage.tsx` (184 lines)
10. `RecentActivities.tsx` (187 lines)
11. `ThisWeeksActivities.tsx` (69 lines)
12. `PrincipalDashboardTable.tsx` (251 lines)

### Steps
1. Create `archive/dashboard/` directory
2. Move all 12 files to archive directory using `git mv` (preserves history)
3. Check for any imports of these files in active code:
   - Search for imports in `src/atomic-crm/dashboard/`
   - Search for imports in `src/atomic-crm/root/CRM.tsx`
   - Remove any dead imports found
4. Run tests to ensure nothing breaks: `npm test`
5. Run build to ensure TypeScript is happy: `npm run build`
6. Commit with message: "chore(dashboard): Archive 12 unused components (~1,300 LOC)"

### Expected Outcome
- All 12 files moved to `archive/dashboard/`
- No broken imports
- All tests passing
- Build successful
- Git history preserved

### Verification
```bash
# Should show 0 results
grep -r "import.*DashboardActivityLog" src/
grep -r "import.*QuickAdd" src/
# ... (check all 12)

# Should pass
npm test
npm run build
```

---

## Task 2: Fix Semantic Colors in 7 Dashboard Files

### Objective
Replace all hardcoded color utilities with semantic color tokens in 7 remaining dashboard files.

### Files to Fix
1. `src/atomic-crm/dashboard/CompactRecentActivity.tsx`
2. `src/atomic-crm/dashboard/CompactTasksWidget.tsx`
3. `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx`
4. `src/atomic-crm/dashboard/PrincipalDashboard.tsx`
5. `src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktop.tsx`
6. `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx`
7. `src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx`

### Color Replacement Patterns

**Reference Files** (100% compliant):
- `MyTasksThisWeek.tsx` - See semantic color usage
- `RecentActivityFeed.tsx` - See semantic color usage

**Replace hardcoded grays:**
```typescript
// ❌ Before
bg-gray-50          → bg-muted or bg-secondary
bg-gray-100         → bg-muted
bg-gray-200         → bg-muted/50
text-gray-900       → text-foreground
text-gray-600       → text-muted-foreground
text-gray-500       → text-muted-foreground
text-gray-400       → text-muted-foreground/70
border-gray-300     → border-border
hover:bg-gray-50    → hover:bg-muted
```

**Replace hardcoded blues:**
```typescript
// ❌ Before
bg-blue-100 text-blue-800  → bg-info/10 text-info
text-blue-600              → text-primary
bg-blue-50                 → bg-info/5
```

**Replace hardcoded status colors:**
```typescript
// ❌ Before
text-red-600        → text-destructive
bg-red-50           → bg-destructive/10
text-green-600      → text-success
bg-green-50         → bg-success/10
text-yellow-600     → text-warning
bg-yellow-50        → bg-warning/10
border-yellow-300   → border-warning
border-green-300    → border-success
```

### Steps for Each File
1. Read the file to understand context
2. Find all hardcoded color utilities (grep for `bg-gray-`, `text-gray-`, `bg-blue-`, etc.)
3. Replace with semantic equivalents following patterns above
4. Run tests for that component if they exist
5. Verify build still works

### After All Files Fixed
1. Run full test suite: `npm test`
2. Run build: `npm run build`
3. Run color validation: `npm run validate:colors` (if exists)
4. Commit with message: "refactor(dashboard): Replace hardcoded colors with semantic tokens in 7 files"

### Expected Outcome
- All 7 files use semantic color tokens only
- No `bg-gray-*`, `text-gray-*`, `bg-blue-*`, `text-red-*`, etc. in these files
- All tests passing
- Build successful
- Design system compliant

### Verification
```bash
# Should show 0 matches in these 7 files
grep -E "(bg-gray-|text-gray-|bg-blue-|text-blue-|bg-yellow-|text-yellow-|bg-green-|text-green-|bg-red-|text-red-)" \
  src/atomic-crm/dashboard/CompactRecentActivity.tsx \
  src/atomic-crm/dashboard/CompactTasksWidget.tsx \
  src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx \
  src/atomic-crm/dashboard/PrincipalDashboard.tsx \
  src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktop.tsx \
  src/atomic-crm/dashboard/PrincipalDashboardTable.tsx \
  src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx

# Should pass
npm test
npm run build
```

---

## Success Criteria

### Overall
- ✅ All 12 unused files archived (not deleted)
- ✅ All 7 files use semantic colors only
- ✅ No broken imports
- ✅ All tests passing (1,529+ tests)
- ✅ Build successful (0 TypeScript errors)
- ✅ Git history preserved (using `git mv`)
- ✅ Clean commits (one per task)

### Quality Gates
- After Task 1: Code review checks for broken imports, test failures
- After Task 2: Code review checks for missed hardcoded colors, pattern consistency

---

## Notes

- **DO NOT DELETE** files - use archive/ for safety
- **USE GIT MV** to preserve file history
- **FOLLOW PATTERN** from MyTasksThisWeek.tsx and RecentActivityFeed.tsx
- **RUN TESTS** after each file to catch issues early
- **COMMIT FREQUENTLY** for easy rollback if needed
