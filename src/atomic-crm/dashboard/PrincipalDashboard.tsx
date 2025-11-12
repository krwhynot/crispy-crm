import React from 'react';
import { OpportunitiesByPrincipalDesktopContainer } from './OpportunitiesByPrincipalDesktopContainer';
import { UpcomingEventsByPrincipal } from './UpcomingEventsByPrincipal';
import { MyTasksThisWeek } from './MyTasksThisWeek';
import { RecentActivityFeed } from './RecentActivityFeed';
import { PipelineSummary } from './PipelineSummary';
import '../styles/desktop.css';

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Week of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Grid Layout: 70% main content (left) + 30% sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        {/* Left Column - Main Focus */}
        <div className="space-y-6">
          <UpcomingEventsByPrincipal />
          <OpportunitiesByPrincipalDesktopContainer />
        </div>

        {/* Right Sidebar - Supporting Context */}
        <aside className="space-y-6" aria-label="Supporting information">
          <MyTasksThisWeek />
          <RecentActivityFeed />
          <PipelineSummary />
        </aside>
      </div>
    </div>
  );
};

export default PrincipalDashboard;