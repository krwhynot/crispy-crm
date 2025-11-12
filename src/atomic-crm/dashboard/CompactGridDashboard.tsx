import React from 'react';
import { CompactDashboardHeader } from './CompactDashboardHeader';

export const CompactGridDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CompactDashboardHeader />
      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_30%_30%] gap-4">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-3">
            <div className="h-[260px]">Principal Table Placeholder</div>
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Upcoming Events Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">My Tasks Placeholder</div>
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
