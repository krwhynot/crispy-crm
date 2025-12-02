import { useState, useCallback } from "react";
import { PrincipalPipelineTable } from "./components/PrincipalPipelineTable";
import { TasksKanbanPanel } from "./components/TasksKanbanPanel";
import { ActivityFeedPanel } from "./components/ActivityFeedPanel";
import { LogActivityFAB } from "./components/LogActivityFAB";
import { MobileQuickActionBar } from "./components/MobileQuickActionBar";
import { TaskCompleteSheet } from "./components/TaskCompleteSheet";
import { KPISummaryRow } from "./components/KPISummaryRow";
import { DashboardHeader } from "./components/DashboardHeader";

/**
 * PrincipalDashboardV3 - Vertically stacked dashboard with Log Activity FAB
 *
 * Layout (all sections stack vertically with semantic spacing):
 * - DashboardHeader (reusable header component)
 * - KPI Summary Row (4-column on desktop, 2x2 on mobile)
 * - Pipeline Table (full width, Card-wrapped)
 * - Tasks Kanban Board (full width)
 * - Activity Feed (full width)
 *
 * Features:
 * - Pure vertical stacking for maximum data visibility
 * - FAB opens Sheet slide-over for activity logging
 * - Draft persistence in localStorage
 * - Team activity feed showing recent activities with avatars
 * - Section landmarks for accessibility
 */
export function PrincipalDashboardV3() {
  // Refresh key to force data components to re-mount and re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  // Task completion sheet state (for mobile quick action bar)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  // Memoized to prevent child re-renders when passed as prop
  const handleRefresh = useCallback(() => {
    // Increment refresh key to force data components to re-mount and re-fetch
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Open task completion sheet (from mobile quick action bar)
  const handleCompleteTask = useCallback(() => {
    setIsTaskSheetOpen(true);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <DashboardHeader title="Principal Dashboard" />

      {/* Main Content - Vertically stacked layout */}
      {/* Note: Using <div> instead of <main> because Layout.tsx already wraps in <main> */}
      <div className="relative flex-1 overflow-auto p-content lg:p-widget">
        <div className="flex flex-col gap-section">
          {/* KPI Summary Row */}
          <KPISummaryRow key={`kpi-${refreshKey}`} />

          {/* Pipeline Table - Full width */}
          <section aria-label="Pipeline by Principal">
            <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
          </section>

          {/* Tasks Kanban Board - Full width */}
          <section aria-label="My Tasks">
            <TasksKanbanPanel key={`tasks-${refreshKey}`} />
          </section>

          {/* Activity Feed - Full width */}
          <section aria-label="Team Activity">
            <ActivityFeedPanel key={`activities-${refreshKey}`} limit={15} />
          </section>
        </div>

        {/* FAB - Fixed position, opens Log Activity Sheet (desktop only) */}
        <LogActivityFAB onRefresh={handleRefresh} />

        {/* Mobile Quick Action Bar - Bottom-positioned (mobile/tablet only) */}
        <MobileQuickActionBar onRefresh={handleRefresh} onCompleteTask={handleCompleteTask} />

        {/* Task Completion Sheet - Opens from mobile quick action bar */}
        <TaskCompleteSheet
          open={isTaskSheetOpen}
          onOpenChange={setIsTaskSheetOpen}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
