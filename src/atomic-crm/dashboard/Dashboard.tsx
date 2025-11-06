import { useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrincipalDashboardTable } from "./PrincipalDashboardTable";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Principal-Centric Dashboard
 *
 * Replaces the widget-based dashboard with a focused table view of principals.
 * This design supports the account manager workflow where each AM manages 3-5
 * principal organizations (brands/manufacturers) with multiple opportunities each.
 *
 * PRD Reference: docs/prd/14-dashboard.md
 * Design: docs/plans/2025-11-05-principal-centric-crm-design.md
 *
 * Key Features:
 * - Table-based layout with 6 columns (Principal, # Opps, Status, Last Activity, Stuck, Next Action)
 * - Automatic filtering by current user's account_manager_id
 * - Priority sorting (most urgent principals first)
 * - Color-coded status indicators (Good/Warning/Urgent)
 * - Stuck opportunity warnings (30+ days in same stage)
 */
export const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useRefresh();

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
    // Give feedback for at least 500ms
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
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

      {/* Principal-Centric Table - Replaces all widgets */}
      <div className="rounded-lg border border-border bg-card">
        <PrincipalDashboardTable />
      </div>
    </div>
  );
};

export default Dashboard;
