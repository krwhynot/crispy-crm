import React from 'react';

export const PrincipalCardSkeleton = () => {
  return (
    <div className="border border rounded-lg p-widget bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-section mb-section">
        <div className="h-6 bg-muted/50 rounded w-32"></div>
        <div className="h-6 bg-muted/50 rounded w-24"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-section mb-section">
        <div className="h-4 bg-muted/50 rounded w-24"></div>
        <div className="h-4 bg-muted/50 rounded w-24"></div>
      </div>

      {/* Opportunity skeleton */}
      <div className="mb-section p-content bg-info/5 rounded">
        <div className="h-4 bg-muted/50 rounded w-32 mb-compact"></div>
        <div className="h-5 bg-muted/50 rounded w-40"></div>
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-compact pt-section border-t border">
        <div className="flex-1 h-10 bg-muted/50 rounded"></div>
        <div className="flex-1 h-10 bg-muted/50 rounded"></div>
      </div>
    </div>
  );
};