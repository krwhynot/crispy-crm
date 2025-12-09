"use client";

import { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTaskCount } from "../hooks/useTaskCount";
import { LayoutGrid, CheckSquare, TrendingUp, Users } from "lucide-react";

// Lazy load tab content for performance
const PrincipalPipelineTable = lazy(() => import("./PrincipalPipelineTable"));
const TasksKanbanPanel = lazy(() => import("./TasksKanbanPanel"));
const MyPerformanceWidget = lazy(() => import("./MyPerformanceWidget"));
const ActivityFeedPanel = lazy(() => import("./ActivityFeedPanel"));

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/**
 * DashboardTabPanel - Tabbed interface for all dashboard sections
 *
 * Replaces vertically stacked layout with tabs to eliminate scrolling
 * and improve focus on iPad devices.
 *
 * Four tabs:
 * - Pipeline (default) - Principal pipeline table with drill-down
 * - My Tasks - Kanban board with pending task count badge
 * - Performance - Personal performance metrics
 * - Team Activity - Recent activities across the team
 *
 * Features:
 * - forceMount preserves component state when switching tabs
 * - Lazy loading reduces initial bundle size
 * - 44px touch targets for iPad accessibility
 * - Semantic colors only (Tailwind v4)
 */
export function DashboardTabPanel() {
  const { pendingCount, isLoading } = useTaskCount();

  return (
    <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
      <Tabs defaultValue="pipeline" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <TabsList className="h-11 w-full justify-start gap-2 bg-transparent p-0" data-tutorial="dashboard-tabs">
            {/* Pipeline Tab - 44px touch target */}
            <TabsTrigger
              value="pipeline"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-tutorial="dashboard-tab-pipeline"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Pipeline</span>
            </TabsTrigger>

            {/* My Tasks Tab */}
            <TabsTrigger
              value="tasks"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-tutorial="dashboard-tab-tasks"
            >
              <CheckSquare className="h-4 w-4" />
              <span>My Tasks</span>
              {!isLoading && pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* Performance Tab */}
            <TabsTrigger
              value="performance"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-tutorial="dashboard-tab-performance"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>

            {/* Team Activity Tab */}
            <TabsTrigger
              value="activity"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-tutorial="dashboard-tab-activity"
            >
              <Users className="h-4 w-4" />
              <span>Team Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="relative min-h-0 flex-1 p-0">
          {/* Pipeline Tab Content - forceMount preserves filter state */}
          <TabsContent
            value="pipeline"
            className="absolute inset-0 m-0 overflow-auto focus-visible:ring-0"
            forceMount
          >
            <Suspense fallback={<TabSkeleton />}>
              <PrincipalPipelineTable />
            </Suspense>
          </TabsContent>

          {/* Tasks Tab Content - forceMount preserves kanban state */}
          <TabsContent
            value="tasks"
            className="absolute inset-0 m-0 overflow-auto focus-visible:ring-0"
            forceMount
          >
            <Suspense fallback={<TabSkeleton />}>
              <TasksKanbanPanel />
            </Suspense>
          </TabsContent>

          {/* Performance Tab Content - forceMount prevents refetch */}
          <TabsContent
            value="performance"
            className="absolute inset-0 m-0 overflow-auto focus-visible:ring-0"
            forceMount
          >
            <Suspense fallback={<TabSkeleton />}>
              <MyPerformanceWidget />
            </Suspense>
          </TabsContent>

          {/* Team Activity Tab Content - forceMount preserves scroll */}
          <TabsContent
            value="activity"
            className="absolute inset-0 m-0 overflow-auto focus-visible:ring-0"
            forceMount
          >
            <Suspense fallback={<TabSkeleton />}>
              <ActivityFeedPanel />
            </Suspense>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default DashboardTabPanel;
