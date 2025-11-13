import React, { useState, useEffect } from 'react';
import { useGetList } from 'react-admin';
import { endOfWeek } from 'date-fns';
import { CompactDashboardHeader } from './CompactDashboardHeader';
import { CompactPrincipalTable } from './CompactPrincipalTable';
import { CompactTasksWidget } from './CompactTasksWidget';
import { ActivityFeed } from './ActivityFeed';
import QuickLogActivity from './QuickActionModals/QuickLogActivity';
import type { Task } from '../types';

interface Principal {
  id: number;
  principal_name: string;
  opportunity_count?: number;
  last_activity_date?: string;
  status_indicator?: string;
}

export const CompactGridDashboard: React.FC = () => {
  // Modal state
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);

  // Listen for quick-log-activity custom events
  useEffect(() => {
    const handleQuickLogEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ principalId: number | null; activityType: string }>;
      setSelectedPrincipalId(customEvent.detail.principalId?.toString() || null);
      setQuickLogOpen(true);
    };

    window.addEventListener('quick-log-activity', handleQuickLogEvent);
    return () => window.removeEventListener('quick-log-activity', handleQuickLogEvent);
  }, []);

  // Fetch real data from API
  const today = new Date();
  const endOfWeekDate = endOfWeek(today);

  // Fetch principals from dashboard_principal_summary view
  const { data: principalsData = [], isPending: principalsLoading } = useGetList<Principal>(
    'dashboard_principal_summary',
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'principal_name', order: 'ASC' }
    }
  );

  // Fetch tasks for this week (incomplete tasks only)
  const { data: tasksData = [], isPending: tasksLoading } = useGetList<Task>(
    'tasks',
    {
      filter: {
        completed: false,
      },
      pagination: { page: 1, perPage: 20 },
      sort: { field: 'due_date', order: 'ASC' },
    }
  );

  // Transform principals data for compact table
  const principals = principalsData.map(p => ({
    id: p.id,
    name: p.principal_name,
    opportunityCount: p.opportunity_count || 0,
    weeklyActivities: 0, // TODO: Calculate from activities in last 7 days
    assignedReps: [], // TODO: Get from opportunities relationship
  }));

  // Transform tasks data for compact widget
  const tasks = tasksData.map(t => ({
    id: t.id,
    title: t.title,
    priority: (t.priority || 'normal') as 'high' | 'normal' | 'low'
  }));

  // Show loading state while data is being fetched
  if (principalsLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <CompactDashboardHeader />
        <div className="p-edge-mobile md:p-edge-ipad lg:p-edge-desktop flex items-center justify-center">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <CompactDashboardHeader />
      <div className="p-edge-mobile md:p-edge-ipad lg:p-edge-desktop">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_30%_30%] gap-content">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-content">
            <CompactPrincipalTable data={principals} />
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-section">
            <div className="bg-white rounded-lg p-content">
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                Upcoming Events - Coming Soon
              </div>
            </div>
            <div className="bg-white rounded-lg p-content">
              <CompactTasksWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column - Activity & Pipeline */}
          <div className="space-y-section">
            <div className="bg-white rounded-lg p-content">
              <ActivityFeed variant="compact" />
            </div>
            <div className="bg-white rounded-lg p-content">
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                Pipeline Summary - Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Log Activity Modal */}
      <QuickLogActivity
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSubmit={(data) => {
          console.log('Activity logged:', data);
          setQuickLogOpen(false);
          // TODO: Implement actual activity creation
        }}
        principalId={selectedPrincipalId || undefined}
      />
    </div>
  );
};
