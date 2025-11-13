import React, { useMemo } from 'react';
import { useGetList } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { subDays, startOfDay } from 'date-fns';
import { Activity as ActivityIcon } from 'lucide-react';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';
import { getActivityIcon } from '@/atomic-crm/utils/getActivityIcon';
import { DashboardWidget } from './DashboardWidget';
import type { ActivityRecord } from '../types';

/**
 * Unified Activity Feed Component
 *
 * Consolidates three previous implementations:
 * - RecentActivityFeed.tsx (sidebar variant)
 * - CompactRecentActivity.tsx (compact variant)
 * - RecentActivities.tsx (full variant - archived)
 *
 * Features:
 * - Three display variants: compact, sidebar, full
 * - Configurable item count and date filtering
 * - Shared loading/error/empty states
 * - Semantic colors and spacing tokens
 * - Optional "View all" link
 * - Consistent navigation behavior
 *
 * Design: docs/plans/2025-11-13-p3-widget-consolidation-analysis.md
 */

export type ActivityFeedVariant = 'compact' | 'sidebar' | 'full';

export interface ActivityFeedProps {
  /** Display variant - determines layout and styling */
  variant: ActivityFeedVariant;
  /** Maximum number of items to display (default: 4 for compact, 7 for sidebar, 10 for full) */
  maxItems?: number;
  /** Show "View all activities →" link (default: true for compact, false otherwise) */
  showViewAllLink?: boolean;
  /** Filter activities by date range (default: 'last7days') */
  dateRangeFilter?: 'last7days' | 'all';
  /** Custom title override */
  title?: string;
  /** Wrapper type (default: 'widget' for sidebar/full, 'none' for compact) */
  wrapper?: 'widget' | 'none';
}

const VARIANT_DEFAULTS: Record<ActivityFeedVariant, Required<Omit<ActivityFeedProps, 'variant'>>> = {
  compact: {
    maxItems: 4,
    showViewAllLink: true,
    dateRangeFilter: 'last7days',
    title: 'Recent Activity',
    wrapper: 'none',
  },
  sidebar: {
    maxItems: 7,
    showViewAllLink: false,
    dateRangeFilter: 'last7days',
    title: 'RECENT ACTIVITY',
    wrapper: 'widget',
  },
  full: {
    maxItems: 10,
    showViewAllLink: false,
    dateRangeFilter: 'all',
    title: 'Recent Activities',
    wrapper: 'widget',
  },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = (props) => {
  const {
    variant,
    maxItems = VARIANT_DEFAULTS[variant].maxItems,
    showViewAllLink = VARIANT_DEFAULTS[variant].showViewAllLink,
    dateRangeFilter = VARIANT_DEFAULTS[variant].dateRangeFilter,
    title = VARIANT_DEFAULTS[variant].title,
    wrapper = VARIANT_DEFAULTS[variant].wrapper,
  } = props;

  const navigate = useNavigate();

  // Calculate date filter
  const dateFilter = useMemo(() => {
    if (dateRangeFilter === 'all') return null;
    return subDays(startOfDay(new Date()), 7).toISOString();
  }, [dateRangeFilter]);

  // Fetch activities with appropriate filter
  const { data: activities = [], isPending, error } = useGetList<ActivityRecord>(
    'activities',
    {
      filter: {
        deleted_at: null,
        ...(dateFilter && { 'created_at@gte': dateFilter }),
      },
      sort: { field: 'created_at', order: 'DESC' },
      pagination: { page: 1, perPage: maxItems },
    }
  );

  // Render content based on variant
  const content = isPending ? (
    <LoadingState variant={variant} title={title} />
  ) : error ? (
    <ErrorState variant={variant} title={title} />
  ) : activities.length === 0 ? (
    <EmptyState variant={variant} title={title} />
  ) : (
    <ActivityList
      activities={activities}
      variant={variant}
      title={title}
      showViewAllLink={showViewAllLink}
      onActivityClick={(id) => navigate(`/activities/${id}`)}
    />
  );

  // Wrap with DashboardWidget if needed
  if (wrapper === 'widget' && variant === 'sidebar') {
    return <DashboardWidget>{content}</DashboardWidget>;
  }

  if (wrapper === 'widget' && variant === 'full') {
    return <DashboardWidget>{content}</DashboardWidget>;
  }

  // No wrapper for compact or when explicitly set to 'none'
  return <div className="h-full">{content}</div>;
};

// ============================================================================
// Loading State
// ============================================================================

const LoadingState: React.FC<{ variant: ActivityFeedVariant; title: string }> = ({ variant, title }) => {
  if (variant === 'sidebar') {
    return (
      <>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="activity-skeleton" className="space-y-compact">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-xs text-muted-foreground">Loading...</div>
    </div>
  );
};

// ============================================================================
// Error State
// ============================================================================

const ErrorState: React.FC<{ variant: ActivityFeedVariant; title: string }> = ({ variant, title }) => {
  if (variant === 'sidebar') {
    return (
      <>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h2>
        </div>
        <div className="text-xs text-destructive">Failed to load activities</div>
      </>
    );
  }

  return (
    <div className="h-full">
      <Header variant={variant} title={title} count={0} />
      <div className="text-xs text-destructive mt-compact">Failed to load activities</div>
    </div>
  );
};

// ============================================================================
// Empty State
// ============================================================================

const EmptyState: React.FC<{ variant: ActivityFeedVariant; title: string }> = ({ variant, title }) => {
  if (variant === 'sidebar') {
    return (
      <>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
            0
          </span>
        </div>
        <div className="text-center py-compact">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header variant={variant} title={title} count={0} />
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No recent activity
      </div>
    </>
  );
};

// ============================================================================
// Activity List
// ============================================================================

interface ActivityListProps {
  activities: ActivityRecord[];
  variant: ActivityFeedVariant;
  title: string;
  showViewAllLink: boolean;
  onActivityClick: (id: string | number) => void;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  variant,
  title,
  showViewAllLink,
  onActivityClick,
}) => {
  if (variant === 'sidebar') {
    return (
      <>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
            {activities.length}
          </span>
        </div>
        <div className="space-y-0">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div
                key={activity.id}
                className="h-8 border-b border-border/30 hover:bg-accent/5 flex items-center px-2 cursor-pointer group transition-colors"
                onClick={() => onActivityClick(activity.id)}
              >
                <div className="flex-shrink-0 w-3 h-3 mr-compact text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon className="w-full h-full" aria-hidden="true" />
                </div>
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
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <Header variant={variant} title={title} count={activities.length} />
        <div className="space-y-compact">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick(activity.id)}
                className="flex items-start gap-compact py-1 px-2 hover:bg-muted rounded cursor-pointer group"
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
        {showViewAllLink && activities.length >= 4 && (
          <a
            href="/activities"
            className="text-xs text-primary hover:underline mt-compact block"
            onClick={(e) => {
              e.preventDefault();
              onActivityClick('/activities');
            }}
          >
            View all activities →
          </a>
        )}
      </>
    );
  }

  // Full variant (not currently used, but included for completeness)
  return (
    <>
      <Header variant={variant} title={title} count={activities.length} />
      <div className="space-y-content">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div
              key={activity.id}
              onClick={() => onActivityClick(activity.id)}
              className="flex flex-col gap-compact p-content rounded-md border border-border hover:bg-accent hover:border-primary/50 cursor-pointer transition-all"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onActivityClick(activity.id);
                }
              }}
              aria-label={`View activity: ${activity.type}`}
            >
              <div className="flex items-center gap-compact">
                <div className="text-primary">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                </div>
                <span className="font-medium text-sm text-foreground">{activity.type}</span>
              </div>
              {activity.notes && (
                <div className="text-sm text-muted-foreground pl-6">{activity.notes}</div>
              )}
              <div className="text-xs text-muted-foreground pl-6">
                {formatRelativeTime(new Date(activity.activity_date))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ============================================================================
// Header Component
// ============================================================================

const Header: React.FC<{ variant: ActivityFeedVariant; title: string; count: number }> = ({
  variant,
  title,
  count,
}) => {
  if (variant === 'compact' || variant === 'full') {
    return (
      <div className="flex items-center justify-between mb-compact h-7">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-compact">
          <ActivityIcon className="w-4 h-4" />
          {title}
        </h2>
        <span className="bg-info/10 text-info text-xs px-2 py-0.5 rounded-full">{count}</span>
      </div>
    );
  }

  // Sidebar variant uses inline header in ActivityList
  return null;
};

export default ActivityFeed;
