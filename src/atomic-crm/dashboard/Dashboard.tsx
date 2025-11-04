import { useGetList, useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contact, ContactNote } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { HotContacts } from "./HotContacts";
import { TasksList } from "./TasksList";
import { MiniPipeline } from "./MiniPipeline";
import { QuickAdd } from "./QuickAdd";
import { MetricsCardGrid } from "./MetricsCardGrid";
import { MyOpenOpportunities } from "./MyOpenOpportunities";
import { OverdueTasks } from "./OverdueTasks";
import { ThisWeeksActivities } from "./ThisWeeksActivities";
import { OpportunitiesByPrincipal } from "./OpportunitiesByPrincipal";
import { PipelineByStage } from "./PipelineByStage";
import { RecentActivities } from "./RecentActivities";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useRefresh();

  const {
    data: _dataContact,
    total: _totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  const { total: _totalContactNotes, isPending: isPendingContactNotes } =
    useGetList<ContactNote>("contactNotes", {
      pagination: { page: 1, perPage: 1 },
    });

  const { total: _totalOpportunities, isPending: isPendingOpportunities } =
    useGetList<Contact>("opportunities", {
      pagination: { page: 1, perPage: 1 },
    });

  const isPending =
    isPendingContact || isPendingContactNotes || isPendingOpportunities;

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

  if (isPending) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Dashboard Header with Refresh Button - Ultra compact */}
      <div className="flex items-center justify-between">
        <h1 className="text-base md:text-lg lg:text-xl font-bold text-foreground">Dashboard</h1>
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

      {/* Metrics Grid - iPad optimized, full width */}
      <MetricsCardGrid />

      {/* Phase 4 Widgets - Fixed 6-widget dashboard (COMPLETE) - Ultra compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
        <MyOpenOpportunities />
        <OverdueTasks />
        <ThisWeeksActivities />
        <OpportunitiesByPrincipal />
        <PipelineByStage />
        <RecentActivities />
      </div>

      {/* Existing Dashboard Components - Ultra compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2 mt-1">
        {/* Left column - Action zone (2/3 width) - Ultra compact */}
        <div className="md:col-span-2 lg:col-span-2 space-y-2">
          <TasksList />
          <DashboardActivityLog />
        </div>

        {/* Right column - Context zone (1/3 width) - Ultra compact */}
        <div className="md:col-span-2 lg:col-span-1 space-y-2">
          <HotContacts />
          <MiniPipeline />
        </div>

        {/* Full-width quick actions */}
        <div className="md:col-span-2 lg:col-span-3">
          <QuickAdd />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
