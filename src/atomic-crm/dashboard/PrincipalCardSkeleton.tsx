import React from 'react';

export const PrincipalCardSkeleton = () => {
  return (
    <div className="border border rounded-lg p-6 bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="h-6 bg-muted/50 rounded w-32"></div>
        <div className="h-6 bg-muted/50 rounded w-24"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-4 bg-muted/50 rounded w-24"></div>
        <div className="h-4 bg-muted/50 rounded w-24"></div>
      </div>

      {/* Opportunity skeleton */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <div className="h-4 bg-muted/50 rounded w-32 mb-2"></div>
        <div className="h-5 bg-muted/50 rounded w-40"></div>
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-2 pt-4 border-t border">
        <div className="flex-1 h-10 bg-muted/50 rounded"></div>
        <div className="flex-1 h-10 bg-muted/50 rounded"></div>
      </div>
    </div>
  );
};