import { useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAriaAnnounce } from "@/lib/design-system";
import { PrincipalDashboardTable } from "./PrincipalDashboardTable";
import { UpcomingEventsByPrincipal } from "./UpcomingEventsByPrincipal";
import { MyTasksThisWeek } from "./MyTasksThisWeek";
import { RecentActivityFeed } from "./RecentActivityFeed";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Principal-Centric Dashboard with Supporting Widgets
 *
 * Layout: Grid with 70% main content (left) + 30% sidebar (right)
 * Responsive: Stacks to single column on iPad portrait and mobile
 *
 * Widgets (4 total - Pipeline Summary pending):
 * 1. Upcoming Events by Principal - This week's scheduled activities
 * 2. Principal Table - Main priority-sorted relationship view
 * 3. My Tasks This Week - Task management with urgency grouping
 * 4. Recent Activity Feed - Last 7 activities for context
 *
 * PRD: docs/prd/14-dashboard.md
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md
 *
 * Key Features:
 * - Grid layout optimized for iPad landscape/desktop
 * - Auto-refresh every 5 minutes for all widgets
 * - Manual refresh button updates all data
 * - Supporting widgets provide context for weekly prioritization
 */
export const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useRefresh();
  const announce = useAriaAnnounce();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refresh]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    announce('Dashboard data refreshed');
    // Give feedback for at least 500ms
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <main role="main" aria-label="Dashboard">
      <div className="space-y-4">
        {/* Dashboard Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            My Principals
          </h1>
          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Grid Layout: 70% main content (left) + 30% sidebar (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          {/* Left Column - Main Focus */}
          <div className="space-y-6">
            <UpcomingEventsByPrincipal />
            <div className="rounded-lg border border-border bg-card">
              <PrincipalDashboardTable />
            </div>
          </div>

          {/* Right Sidebar - Supporting Context */}
          <aside className="space-y-6" aria-label="Supporting information">
            <MyTasksThisWeek />
            <RecentActivityFeed />
            {/* PipelineSummary widget to be added */}
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
