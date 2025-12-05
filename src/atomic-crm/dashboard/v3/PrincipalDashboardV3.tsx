import { useState, useCallback } from "react";
import { DashboardTabPanel } from "./components/DashboardTabPanel";
import { LogActivityFAB } from "./components/LogActivityFAB";
import { MobileQuickActionBar } from "./components/MobileQuickActionBar";
import { TaskCompleteSheet } from "./components/TaskCompleteSheet";
import { KPISummaryRow } from "./components/KPISummaryRow";

/**
 * PrincipalDashboardV3 - Vertically stacked dashboard with Log Activity FAB
 *
 * Layout (all sections stack vertically):
 * - KPI Summary Row (4-column on desktop, 2x2 on mobile)
 * - Pipeline Table (full width)
 * - Tasks Kanban Board (full width)
 * - Performance + Activity Feed (2-column on desktop, stacked on mobile)
 *
 * Features:
 * - Pure vertical stacking for maximum data visibility
 * - FAB opens Sheet slide-over for activity logging
 * - Draft persistence in localStorage
 * - Team activity feed showing recent activities with avatars
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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold">Principal Dashboard</h1>
        </div>
      </header>

      {/* Main Content - Flex layout with tabs filling remaining space */}
      <main className="relative flex flex-1 flex-col gap-4 overflow-hidden p-4">
        {/* KPI Summary Row - shrinks to content */}
        <KPISummaryRow key={`kpi-${refreshKey}`} />

        {/* Tabbed interface - Pipeline, Tasks, Performance, Activity - fills remaining height */}
        <DashboardTabPanel key={`tabs-${refreshKey}`} />

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
      </main>
    </div>
  );
}
