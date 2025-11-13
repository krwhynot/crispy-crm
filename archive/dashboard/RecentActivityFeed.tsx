import React, { useMemo } from 'react';
import { useGetList } from 'ra-core';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from './DashboardWidget';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';
import { getActivityIcon } from '@/atomic-crm/utils/getActivityIcon';

interface Activity {
  id: number | string;
  type: string;
  principal_name: string;
  created_at: string;
  notes?: string;
  [key: string]: any;
}

/**
 * RecentActivityFeed - Desktop-first widget showing last 7 activities
 *
 * Design:
 * - Compact spacing: 12px padding, 32px (h-8) row height
 * - Header: uppercase "RECENT ACTIVITY" with count badge
 * - Rows: Icon | Principal Name | Compact Timestamp
 * - Activity notes as single-line subtitle (truncated)
 * - Inline hover interactions (hidden until hover)
 * - Semantic colors only
 * - No responsive fallbacks (desktop-only)
 */
export const RecentActivityFeed: React.FC = () => {
  const navigate = useNavigate();

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  const { data: activities = [], isPending, error } = useGetList('activities', {
    filter: {
      deleted_at: null,
      created_at_gte: sevenDaysAgo,
    },
    sort: { field: 'created_at', order: 'DESC' },
    pagination: { page: 1, perPage: 7 },
  });

  if (isPending) {
    return (
      <DashboardWidget>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            RECENT ACTIVITY
          </h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="activity-skeleton" className="space-y-compact">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </DashboardWidget>
    );
  }

  const hasNoActivities = activities.length === 0;

  return (
    <DashboardWidget>
      {/* Header - Compact (h-6) */}
      <div className="flex items-center justify-between mb-compact h-6">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          RECENT ACTIVITY
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {activities.length}
        </span>
      </div>

      {/* Empty State */}
      {hasNoActivities && (
        <div className="text-center py-compact">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      )}

      {/* Activity Rows - h-8 desktop-compact */}
      {!hasNoActivities && (
        <div className="space-y-0">
          {(activities as Activity[]).map((activity) => {
            const IconComponent = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="h-8 border-b border-border/30 hover:bg-accent/5 flex items-center px-2 cursor-pointer group transition-colors"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                {/* Icon - Compact 3px */}
                <div className="flex-shrink-0 w-3 h-3 mr-compact text-muted-foreground group-hover:text-foreground transition-colors">
                  <IconComponent className="w-full h-full" aria-hidden="true" />
                </div>

                {/* Principal Name + Timestamp */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-compact">
                  <span className="text-xs font-medium text-foreground truncate">
                    {activity.principal_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-xs text-destructive">
          Failed to load activities
        </div>
      )}
    </DashboardWidget>
  );
};

export default RecentActivityFeed;
