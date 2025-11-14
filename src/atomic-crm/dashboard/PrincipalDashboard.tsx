import React from 'react';
import { Title } from 'react-admin';
import { PrincipalOpportunitiesWidget } from './PrincipalOpportunitiesWidget';
import { PriorityTasksWidget } from './PriorityTasksWidget';
import { QuickActivityLoggerWidget } from './QuickActivityLoggerWidget';

/**
 * Principal Dashboard - MVP dashboard for managing principal relationships
 *
 * Layout: Desktop-first 3-column grid optimized for 1440px+ screens
 * Responsive: Stacks to single column on mobile/tablet (<1024px)
 *
 * Widgets (3 total):
 * 1. Active Opportunities - Principal-grouped opportunities (left)
 * 2. Priority Tasks - Upcoming tasks by principal (middle)
 * 3. Quick Activity Logger - Log activities for principals (right)
 *
 * Data is fetched independently by each widget container using
 * the dashboard_principal_summary database view and related tables.
 */
export const PrincipalDashboard: React.FC = () => {
  return (
    <div className="p-content lg:p-widget">
      <Title title="Principal Dashboard" />

      <div className="space-y-section">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Principal Dashboard</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage your principal relationships and daily activities
          </p>
        </div>

        {/* Dashboard Grid - 3 equal columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-section">
          {/* Left Column - Opportunities */}
          <div className="lg:col-span-1">
            <PrincipalOpportunitiesWidget />
          </div>

          {/* Middle Column - Tasks */}
          <div className="lg:col-span-1">
            <PriorityTasksWidget />
          </div>

          {/* Right Column - Quick Logger */}
          <div className="lg:col-span-1">
            <QuickActivityLoggerWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;