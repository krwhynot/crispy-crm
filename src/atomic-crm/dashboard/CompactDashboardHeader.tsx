import React from 'react';

export const CompactDashboardHeader: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-white border-b">
      <h1 className="text-xl font-semibold text-gray-900">
        Principal Dashboard - Week of {currentDate}
      </h1>
      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
          Refresh
        </button>
        <button className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary-dark rounded">
          Quick Log
        </button>
      </div>
    </div>
  );
};
