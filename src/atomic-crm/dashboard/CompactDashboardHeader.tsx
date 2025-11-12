import React, { useCallback } from 'react';
import { useRefresh } from 'react-admin';

export const CompactDashboardHeader: React.FC = () => {
  const refresh = useRefresh();

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle quick log - dispatch custom event for modal
  const handleQuickLog = useCallback(() => {
    window.dispatchEvent(new CustomEvent('quick-log-activity', {
      detail: {
        principalId: null, // No principal selected from header
        activityType: 'call' // Default to call
      }
    }));
  }, []);

  // Handle refresh - reload dashboard data
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-white border-b">
      <h1 className="text-xl font-semibold text-gray-900">
        Principal Dashboard - Week of {currentDate}
      </h1>
      <div className="flex gap-2">
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          title="Refresh dashboard data"
        >
          Refresh
        </button>
        <button
          onClick={handleQuickLog}
          className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary/90 rounded transition-colors"
          title="Log activity"
        >
          Quick Log
        </button>
      </div>
    </div>
  );
};
