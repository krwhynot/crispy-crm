"use client";

import { Suspense, lazy, memo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTaskCount } from "./useTaskCount";
import { useRecentSearches, type RecentSearchItem } from "../hooks/useRecentSearches";
import {
  LayoutGrid,
  CheckSquare,
  TrendingUp,
  Users,
  Clock,
  Building2,
  User,
  Target,
  ListTodo,
} from "lucide-react";

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
 * Icon mapping for each resource type.
 * Falls back to Building2 for unknown resources.
 */
const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  organizations: Building2,
  contacts: User,
  opportunities: Target,
  tasks: ListTodo,
};

/**
 * Module-level RelativeTimeFormat instance for performance.
 * Created once at module load instead of on every render.
 */
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Format a Unix timestamp as relative time using Intl.RelativeTimeFormat.
 */
const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return relativeTimeFormatter.format(-diffMins, "minute");
  if (diffMins < 1440) return relativeTimeFormatter.format(-Math.floor(diffMins / 60), "hour");
  return relativeTimeFormatter.format(-Math.floor(diffMins / 1440), "day");
};

/**
 * Memoized list item component for rendering a single recent item.
 */
const RecentItemLink = memo(function RecentItemLink({ item }: { item: RecentSearchItem }) {
  const Icon = RESOURCE_ICONS[item.entityType] || Building2;

  return (
    <li>
      <Link
        to={`/${item.entityType}?view=${item.id}`}
        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted min-h-[44px] transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.label}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
        </div>
      </Link>
    </li>
  );
});

/**
 * Content component for the Recently Viewed tab.
 * Shows all recent items (up to 10) with icons and timestamps.
 */
function RecentItemsTabContent() {
  const { recentItems } = useRecentSearches();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recently Viewed
      </h2>
      {recentItems.length === 0 ? (
        <p className="text-muted-foreground text-sm py-2">
          No recent items. Start browsing to see your history.
        </p>
      ) : (
        <ul className="space-y-1">
          {recentItems.map((item) => (
            <RecentItemLink key={`${item.entityType}-${item.id}`} item={item} />
          ))}
        </ul>
      )}
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
          <TabsList
            className="h-11 w-full justify-start gap-2 bg-transparent p-0"
            data-tutorial="dashboard-tabs"
          >
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

            {/* Recently Viewed Tab */}
            <TabsTrigger
              value="recent"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-tutorial="dashboard-tab-recent"
            >
              <Clock className="h-4 w-4" />
              <span>Recently Viewed</span>
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

          {/* Recently Viewed Tab Content */}
          <TabsContent
            value="recent"
            className="absolute inset-0 m-0 overflow-auto focus-visible:ring-0"
          >
            <RecentItemsTabContent />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default DashboardTabPanel;
