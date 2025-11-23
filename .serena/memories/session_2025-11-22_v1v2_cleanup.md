# Session: V1/V2 Dashboard Cleanup (2025-11-22)

## Summary
Removed all legacy V1/V2 dashboard components, tests, and documentation. V3 is now the only dashboard version in the codebase.

## Changes Made

### Files Deleted (34 total, ~5,800 lines)

**Archive Source Code (17 files):**
- `archive/dashboard/*.tsx` - Legacy components including:
  - CompactRecentActivity, DashboardActivityLog, HotContacts
  - LatestNotes, MetricsCardGrid, MiniPipeline
  - MyOpenOpportunities, OverdueTasks, PipelineByStage
  - PrincipalDashboardTable, QuickAdd, RecentActivities
  - RecentActivityFeed, ThisWeeksActivities
- `archive/dashboard/__tests__/RecentActivityFeed.test.tsx`

**V2 E2E Tests (12 files):**
- `tests/e2e/dashboard-v2-*.spec.ts` (11 test files)
- `tests/e2e/dashboard-v2-screenshots.spec.ts-snapshots/` (5 PNG files)

**V2 Documentation (3 files):**
- `docs/dashboard-v2-migration.md`
- `docs/development/dashboard-v2-testing.md`
- `docs/testing/dashboard-v2-ui-ux-coverage.md`

### Files Kept (Active V3)
- `src/atomic-crm/dashboard/v3/` - All V3 components and tests
- `tests/e2e/dashboard-v3/` - V3 E2E tests
- `tests/e2e/dashboard-layout.spec.ts` - Generic tests using DashboardPage POM
- `tests/e2e/dashboard-quick-actions.spec.ts` - Generic quick action tests
- `docs/dashboard/PRINCIPAL-DASHBOARD-COMPLETE-GUIDE.md` - Current architecture docs

## Key Discoveries

1. **V3 Already Default**: `CRM.tsx:163-166` uses `PrincipalDashboardV3` exclusively
2. **No V1/V2 Source in src/**: Already moved to `archive/` folder
3. **V2 Tests Were Dead Code**: Used `?layout=v2` URL param that V3 doesn't support
4. **Zero Import Dependencies**: Grep confirmed no imports from archive/dashboard/

## Validation
- Build: ✅ Passed (52.35s)
- Working tree: ✅ Clean
- Commit: `413c9cf4 chore: remove legacy V1/V2 dashboard components and tests`
- Pushed to origin/main

## Current Dashboard Architecture
```
src/atomic-crm/dashboard/
├── index.ts              # Exports only V3
└── v3/
    ├── PrincipalDashboardV3.tsx
    ├── DashboardErrorBoundary.tsx
    ├── components/
    │   ├── PrincipalPipelineTable.tsx
    │   ├── TasksPanel.tsx
    │   ├── QuickLoggerPanel.tsx
    │   └── ...
    ├── hooks/
    │   ├── useCurrentSale.ts
    │   ├── useMyTasks.ts
    │   └── usePrincipalPipeline.ts
    └── __tests__/
```

## Future Considerations
- The `archive/styles/` folder still exists (not dashboard-related)
- Generic E2E tests (`dashboard-layout.spec.ts`, etc.) may need updates if V3 UI changes significantly
- Consider consolidating `docs/plans/` historical docs if they become stale
