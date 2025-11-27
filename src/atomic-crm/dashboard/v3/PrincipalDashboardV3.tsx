import { useState, useCallback } from "react";
import { PrincipalPipelineTable } from "./components/PrincipalPipelineTable";
import { TasksKanbanPanel } from "./components/TasksKanbanPanel";
import { LogActivityFAB } from "./components/LogActivityFAB";
import { KPISummaryRow } from "./components/KPISummaryRow";

/**
 * PrincipalDashboardV3 - Vertically stacked dashboard with Log Activity FAB
 *
 * Layout:
 * - KPI Summary Row (4-column on desktop, 2x2 on mobile)
 * - Pipeline Table (full width)
 * - Tasks Kanban Board (full width)
 *
 * Features:
 * - Vertical stacking for better data visibility
 * - FAB opens Sheet slide-over for activity logging
 * - Draft persistence in localStorage
 */
export function PrincipalDashboardV3() {
  // Refresh key to force data components to re-mount and re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoized to prevent child re-renders when passed as prop
  const handleRefresh = useCallback(() => {
    // Increment refresh key to force data components to re-mount and re-fetch
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold">Principal Dashboard</h1>
        </div>
      </header>

      {/* Main Content - CSS Grid layout */}
      <main className="relative flex-1 overflow-hidden p-4">
        <div className="flex h-full flex-col gap-4">
          {/* KPI Summary Row - Above the main grid */}
          <KPISummaryRow key={`kpi-${refreshKey}`} />

          {/*
            Main Grid Layout:
            - Base (mobile/tablet <1024px): Single column stacked
            - Desktop (≥1024px): 2-column (2fr | 3fr = 40% | 60%)
          */}
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr] min-h-0">
            {/* Panel 1: Pipeline by Principal (40% on desktop) */}
            <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />

            {/* Panel 2: My Tasks Kanban (60% on desktop) */}
            <TasksKanbanPanel key={`tasks-${refreshKey}`} />
          </div>
        </div>

        {/* FAB - Fixed position, opens Log Activity Sheet */}
        <LogActivityFAB onRefresh={handleRefresh} />
      </main>
    </div>
  );
}
