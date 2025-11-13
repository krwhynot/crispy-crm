import { useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAriaAnnounce } from "@/lib/design-system";
import { OpportunitiesByPrincipalDesktopContainer } from "./OpportunitiesByPrincipalDesktopContainer";
import { UpcomingEventsByPrincipal } from "./UpcomingEventsByPrincipal";
import { MyTasksThisWeek } from "./MyTasksThisWeek";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { PipelineSummary } from "./PipelineSummary";
import QuickLogActivity from "./QuickActionModals/QuickLogActivity";
import { useKeyboardShortcuts, globalShortcuts } from "@/atomic-crm/utils/keyboardShortcuts";
import { useContextMenu, ContextMenu, type ContextMenuItem } from "@/atomic-crm/utils/contextMenu";

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
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);
  const refresh = useRefresh();
  const announce = useAriaAnnounce();
  const { showContextMenu, closeContextMenu, contextMenuComponent } = useContextMenu();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refresh]);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "l",
      ctrl: true,
      handler: () => {
        setQuickLogOpen(true);
        announce("Quick log activity modal opened");
      },
      description: "Quick log activity (Ctrl+L)",
    },
    {
      key: "r",
      ctrl: true,
      handler: () => handleRefresh(),
      description: "Refresh dashboard (Ctrl+R)",
    },
  ]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    announce("Dashboard data refreshed");
    // Give feedback for at least 500ms
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle quick log activity submission
  const handleQuickLogSubmit = (data: {
    type: "call" | "email" | "meeting";
    notes: string;
    principalId: string;
  }) => {
    announce(
      `Activity logged: ${data.type} for principal ${data.principalId}. Notes: ${data.notes || "None"}`
    );
    setQuickLogOpen(false);
    // TODO: Call API to create activity
  };

  return (
    <main role="main" aria-label="Dashboard">
      <div className="space-y-[var(--spacing-content)]">
        {/* Dashboard Header with Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              My Principals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Keyboard shortcuts: <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd> Quick log
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Ctrl+R</kbd> Refresh
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="default"
              onClick={() => setQuickLogOpen(true)}
              className="gap-2"
              aria-label="Quick log activity (Ctrl+L)"
              title="Quick log activity"
            >
              + Quick Log
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
              aria-label="Refresh dashboard (Ctrl+R)"
              title="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Grid Layout: 70% main content (left) + 30% sidebar (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-[var(--spacing-section)]">
          {/* Left Column - Main Focus */}
          <div className="space-y-[var(--spacing-section)]">
            <UpcomingEventsByPrincipal />
            <OpportunitiesByPrincipalDesktopContainer />
          </div>

          {/* Right Sidebar - Supporting Context */}
          <aside className="space-y-[var(--spacing-section)]" aria-label="Supporting information">
            <MyTasksThisWeek />
            <RecentActivityFeed />
            <PipelineSummary />
          </aside>
        </div>

        {/* Quick Log Activity Modal */}
        <QuickLogActivity
          open={quickLogOpen}
          onClose={() => setQuickLogOpen(false)}
          onSubmit={handleQuickLogSubmit}
          principalId={selectedPrincipalId || "current-principal"}
        />

        {/* Context Menu */}
        {contextMenuComponent}
      </div>
    </main>
  );
};

export default Dashboard;
