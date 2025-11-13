import React from 'react';
import { OpportunitiesByPrincipalDesktopContainer } from './OpportunitiesByPrincipalDesktopContainer';
import { UpcomingEventsByPrincipal } from './UpcomingEventsByPrincipal';
import { MyTasksThisWeek } from './MyTasksThisWeek';
import { ActivityFeed } from './ActivityFeed';
import { PipelineSummary } from './PipelineSummary';

/**
 * Principal Dashboard - Main dashboard view for managing principal relationships
 *
 * Layout: Grid with 70% main content (left) + 30% sidebar (right)
 * Responsive: Stacks to single column on iPad portrait and mobile
 *
 * Widgets (5 total):
 * 1. Upcoming Events by Principal - This week's scheduled activities (left)
 * 2. Principal Table - Main priority-sorted relationship view (left)
 * 3. My Tasks This Week - Task management with urgency grouping (sidebar)
 * 4. Recent Activity Feed - Last 7 activities for context (sidebar)
 * 5. Pipeline Summary - Pipeline metrics and health indicators (sidebar)
 *
 * Data is fetched independently by each widget container using
 * the dashboard_principal_summary database view and related tables.
 */
export const PrincipalDashboard = () => {
  return (
    <div className="space-y-section p-widget">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Principal Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Week of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Grid Layout: 70% main content (left) + 30% sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-section">
        {/* Left Column - Main Focus */}
        <div className="space-y-section">
          <UpcomingEventsByPrincipal />
          <OpportunitiesByPrincipalDesktopContainer />
        </div>

        {/* Right Sidebar - Supporting Context */}
        <aside className="space-y-section" aria-label="Supporting information">
          <MyTasksThisWeek />
          <ActivityFeed variant="sidebar" />
          <PipelineSummary />
        </aside>
      </div>
    </div>
  );
};

export default PrincipalDashboard;