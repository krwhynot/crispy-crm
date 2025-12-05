'use client';

import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTaskCount } from '../hooks/useTaskCount';
import { CheckSquare, TrendingUp, Users } from 'lucide-react';

// Lazy load tab content for performance
const TasksKanbanPanel = lazy(() => import('./TasksKanbanPanel'));
const MyPerformanceWidget = lazy(() => import('./MyPerformanceWidget'));
const ActivityFeedPanel = lazy(() => import('./ActivityFeedPanel'));

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
 * DashboardTabPanel - Tabbed interface for dashboard bottom sections
 *
 * Replaces vertically stacked layout with tabs to reduce scrolling
 * and improve focus on iPad devices.
 *
 * Three tabs:
 * - My Tasks (default) - Kanban board with pending task count badge
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
    <Card className="flex-1">
      <Tabs defaultValue="tasks" className="w-full">
        <div className="border-b border-border px-4 pt-4">
          <TabsList className="h-11 w-full justify-start gap-2 bg-transparent p-0">
            {/* My Tasks Tab - 44px touch target */}
            <TabsTrigger
              value="tasks"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <CheckSquare className="h-4 w-4" />
              <span>My Tasks</span>
              {!isLoading && pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* Performance Tab */}
            <TabsTrigger
              value="performance"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>

            {/* Team Activity Tab */}
            <TabsTrigger
              value="activity"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Users className="h-4 w-4" />
              <span>Team Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          {/* Tasks Tab Content - forceMount preserves kanban state */}
          <TabsContent value="tasks" className="m-0 focus-visible:ring-0" forceMount>
            <Suspense fallback={<TabSkeleton />}>
              <TasksKanbanPanel />
            </Suspense>
          </TabsContent>

          {/* Performance Tab Content - forceMount prevents refetch */}
          <TabsContent value="performance" className="m-0 focus-visible:ring-0" forceMount>
            <Suspense fallback={<TabSkeleton />}>
              <MyPerformanceWidget />
            </Suspense>
          </TabsContent>

          {/* Team Activity Tab Content - forceMount preserves scroll */}
          <TabsContent value="activity" className="m-0 focus-visible:ring-0" forceMount>
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
