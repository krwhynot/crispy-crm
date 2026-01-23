import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "../queryKeys";
import { DashboardTabPanel } from "./DashboardTabPanel";
import { LogActivityFAB } from "./LogActivityFAB";
import { MobileQuickActionBar } from "./MobileQuickActionBar";
import { TaskCompleteSheet } from "./TaskCompleteSheet";
import { KPISummaryRow } from "./KPISummaryRow";
import { DashboardTutorial } from "./DashboardTutorial";

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
  const queryClient = useQueryClient();
  // Task completion sheet state (for mobile quick action bar)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  // Invalidate dashboard queries to trigger refetch without remounting components
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }, [queryClient]);

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
          <KPISummaryRow />
        </div>

        {/* Tabbed interface - fills ALL remaining height */}
        <DashboardTabPanel />

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

        {/* Dashboard Tutorial Button - Fixed bottom-left */}
        <DashboardTutorial />
      </main>
    </div>
  );
}
