# Dashboard Module

Executive dashboard for Crispy CRM. Provides KPI summaries, pipeline views, task management, and activity logging.

## Key Components

| File | Purpose |
|------|---------|
| `index.tsx` | Entry point — lazy-loads V3/V4 with `CurrentSaleProvider` |
| `PrincipalDashboardV3.tsx` | 2-column layout: Pipeline (40%) + Tasks (60%) |
| `PrincipalDashboardV4.tsx` | 3-column layout: KPIs + Pipeline + Tasks |
| `KPISummaryRow.tsx` | KPI cards row (active opps, win rate, etc.) |
| `DashboardTasksList.tsx` | Task list grouped by due date |
| `ActivityFeedPanel.tsx` | Recent activity feed |
| `PipelineDrillDownSheet.tsx` | Pipeline drill-down sheet overlay |
| `CurrentSaleContext.tsx` | Shared salesId context provider |

## Architecture

- **41 files** — performance-optimized dashboard
- **Lazy loading**: Both V3 and V4 use `React.lazy()` with `Suspense` fallback skeleton
- **CurrentSaleProvider**: Caches `salesId` at dashboard level to prevent N+1 queries from child components (saves ~4 DB queries, ~100-200ms)
- **Two versions**: V3 (2-column) and V4 (3-column 12-grid) — both exported, V4 is current
- **Activity logging**: FAB opens sheet slide-over for quick activity entry (<30s target)
- **Error boundary**: `DashboardErrorBoundary.tsx` for graceful failure handling
- **Draft persistence**: Activity form saves drafts to localStorage

## Data Flow

- No direct table writes — reads aggregated views and RPCs
- `useKPIMetrics` hook fetches KPI data
- Pipeline data via `PrincipalPipelineTable` / `PipelineTableRow`
- Tasks via `DashboardTasksList` with `TasksKanbanPanel`

## Exported Types

- `PrincipalPipelineRow`, `TaskItem`, `TaskStatus`, `Priority`, `TaskType`, `Momentum`
- `KPIMetrics`, `KPICardProps`

## Related

- BRD: `docs/brd/dashboard.md`
- Tasks module (task management integration)
- Activities module (activity logging)
