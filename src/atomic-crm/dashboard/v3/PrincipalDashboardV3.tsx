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

  // iPad-optimized height calculation:
  // - Layout header: ~56px (py-3 + h-8 logo)
  // - Layout main padding: 80px (pt-4 + pb-16)
  // - Using dvh for Safari dynamic viewport (handles address bar)
  // - Total chrome: ~136px, using 140px for safety margin
  return (
    <div className="flex h-[calc(100dvh-140px)] flex-col overflow-hidden">
      {/* Main Content - fills calculated height, no internal header (Layout provides one) */}
      <main className="relative flex min-h-0 flex-1 flex-col gap-3">
        {/* KPI Summary Row - compact, shrinks to content */}
        <div className="shrink-0">
          <KPISummaryRow key={`kpi-${refreshKey}`} />
        </div>

        {/* Tabbed interface - fills ALL remaining height */}
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
