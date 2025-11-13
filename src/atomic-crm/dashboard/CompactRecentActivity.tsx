import React, { useMemo } from 'react';
import { useGetList } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { subDays, startOfDay } from 'date-fns';
import { Activity as ActivityIcon } from 'lucide-react';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';
import { getActivityIcon } from '@/atomic-crm/utils/getActivityIcon';
import type { ActivityRecord } from '../types';

/**
 * Compact Recent Activity Widget
 *
 * Displays the 4 most recent activities in a compact format.
 * Part of the compact dashboard grid layout.
 */

export const CompactRecentActivity: React.FC = () => {
  const navigate = useNavigate();

  // Fetch activities from last 7 days
  const sevenDaysAgoFilter = useMemo(
    () => subDays(startOfDay(new Date()), 7).toISOString(),
    []
  );

  const { data: activities = [], isPending } = useGetList<ActivityRecord>(
    'activities',
    {
      filter: {
        'created_at@gte': sevenDaysAgoFilter,
      },
      sort: { field: 'created_at', order: 'DESC' },
      pagination: { page: 1, perPage: 4 }, // Only show 4 most recent
    }
  );

  if (isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-2 h-7">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" />
            Recent Activity
          </h2>
        </div>
        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ActivityIcon className="w-4 h-4" />
          Recent Activity
        </h2>
        <span className="bg-info/10 text-info text-xs px-2 py-0.5 rounded-full">
          {activities.length}
        </span>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);

          return (
            <div
              key={activity.id}
              onClick={() => navigate(`/activities/${activity.id}`)}
              className="flex items-start gap-2 py-1 px-2 hover:bg-muted rounded cursor-pointer group"
            >
              <Icon className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-foreground">
                  {activity.notes || `${activity.type} activity`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(activity.activity_date))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length >= 4 && (
        <a
          href="/activities"
          className="text-xs text-primary hover:underline mt-2 block"
          onClick={(e) => {
            e.preventDefault();
            navigate('/activities');
          }}
        >
          View all activities →
        </a>
      )}
    </div>
  );
};
