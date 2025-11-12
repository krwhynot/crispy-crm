import React from 'react';
import { CompactDashboardHeader } from './CompactDashboardHeader';
import { CompactPrincipalTable } from './CompactPrincipalTable';
import { CompactTasksWidget } from './CompactTasksWidget';

export const CompactGridDashboard: React.FC = () => {
  // Mock data - in real implementation, fetch from API
  const principals = Array(8).fill(null).map((_, i) => ({
    id: i,
    name: `Principal ${i + 1}`,
    activity: `${i * 2}/${i * 3}`
  }));

  const tasks = Array(6).fill(null).map((_, i) => ({
    id: i,
    title: `Task ${i + 1}`,
    priority: i % 3 === 0 ? 'high' : 'normal' as const
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactDashboardHeader />
      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_30%_30%] gap-4">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-3">
            <CompactPrincipalTable data={principals} />
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Upcoming Events Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <CompactTasksWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column - Activity & Pipeline */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Recent Activity Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">Pipeline Summary Placeholder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
