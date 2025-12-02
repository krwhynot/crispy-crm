import { useState, useCallback } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { PrincipalPipelineTable } from "./components/PrincipalPipelineTable";
import { ActivityFeedPanel } from "./components/ActivityFeedPanel";
import { LogActivityFAB } from "./components/LogActivityFAB";
import { MobileQuickActionBar } from "./components/MobileQuickActionBar";
import { TaskCompleteSheet } from "./components/TaskCompleteSheet";
import { KPISummaryRow } from "./components/KPISummaryRow";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardGrid } from "./components/DashboardGrid";
import { ResponsiveTasksPanel } from "./components/ResponsiveTasksPanel";

/**
 * PrincipalDashboardV3 - Responsive dashboard with 5-breakpoint grid layout
 *
 * Layout (PRD Section 9.2.6 compliant):
 * - Desktop (1440px+): 2-column grid with inline 320px tasks panel
 * - Laptop (1280-1439px): 2-column grid with 48px icon rail + drawer
 * - Tablet landscape (1024-1279px): Single column with header tasks button + drawer
 * - Tablet portrait (768-1023px): Single column with header tasks button + drawer
 * - Mobile (<768px): Single column with MobileQuickActionBar
 *
 * Structure:
 * - DashboardHeader with optional tasks button (tablet)
 * - KPI Summary Row (always full width above grid)
 * - DashboardGrid containing Pipeline + ResponsiveTasksPanel
 * - Activity Feed (in main column on mobile/tablet-portrait)
 *
 * Features:
 * - Responsive CSS Grid layout
 * - FAB opens Sheet slide-over for activity logging (desktop)
 * - Draft persistence in localStorage
 * - Section landmarks for accessibility
 */
export function PrincipalDashboardV3() {
  const breakpoint = useBreakpoint();

  // Refresh key to force data components to re-mount and re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  // Task completion sheet state (for mobile quick action bar)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  // Tasks drawer state (for header button on tablet)
  const [tasksDrawerOpen, setTasksDrawerOpen] = useState(false);

  // Determine if activity feed should show in main column
  const showActivityFeedInMain = breakpoint === "mobile" || breakpoint === "tablet-portrait";

  // Placeholder task count (TODO: integrate with actual tasks data)
  const taskCount = 5;

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
          {/* KPI Summary Row - Always full width above grid */}
          <KPISummaryRow key={`kpi-${refreshKey}`} />

          {/* Main Content Grid - Responsive columns based on breakpoint */}
          <DashboardGrid>
            {/* Main Column - Pipeline + conditionally Activity Feed */}
            <div className="flex flex-col gap-section">
              {/* Pipeline Table */}
              <section aria-label="Pipeline by Principal">
                <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
              </section>

              {/* Activity Feed - In main column on mobile/tablet-portrait */}
              {showActivityFeedInMain && (
                <section aria-label="Team Activity">
                  <ActivityFeedPanel key={`activities-${refreshKey}`} limit={15} />
                </section>
              )}
            </div>

            {/* Tasks Panel - Responsive: inline panel, icon rail, or drawer */}
            <ResponsiveTasksPanel
              key={`tasks-${refreshKey}`}
              taskCount={taskCount}
              externalDrawerOpen={tasksDrawerOpen}
              onExternalDrawerChange={setTasksDrawerOpen}
            />
          </DashboardGrid>

          {/* Activity Feed - Below grid on desktop/laptop/tablet-landscape */}
          {!showActivityFeedInMain && (
            <section aria-label="Team Activity">
              <ActivityFeedPanel key={`activities-${refreshKey}`} limit={15} />
            </section>
          )}
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
