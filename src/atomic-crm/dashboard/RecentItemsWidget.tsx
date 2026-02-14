import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRecentSearches, type RecentSearchItem } from "../hooks/useRecentSearches";
import { Building2, User, Target, ListTodo, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icon mapping for each resource type.
 * Falls back to Building2 for unknown resources.
 */
const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  organizations: Building2,
  contacts: User,
  opportunities: Target,
  tasks: ListTodo,
};

/**
 * Module-level RelativeTimeFormat instance for performance.
 * Created once at module load instead of on every render.
 * Constitution P13: Use native APIs for localization.
 */
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Format a Unix timestamp as relative time using Intl.RelativeTimeFormat.
 * Constitution P13: Use native APIs for localization.
 *
 * @example
 * formatRelativeTime(1704268800000) // "2 hours ago"
 */
const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return relativeTimeFormatter.format(-diffMins, "minute");
  if (diffMins < 1440) return relativeTimeFormatter.format(-Math.floor(diffMins / 60), "hour");
  return relativeTimeFormatter.format(-Math.floor(diffMins / 1440), "day");
};

/**
 * Memoized list item component for rendering a single recent item.
 * Performance: Prevents re-renders when other items change.
 */
const RecentItemLink = memo(function RecentItemLink({ item }: { item: RecentSearchItem }) {
  const Icon = RESOURCE_ICONS[item.entityType] || Building2;

  return (
    <li>
      <Link
        to={`/${item.entityType}?view=${item.id}`}
        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted min-h-[44px] transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.label}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
        </div>
      </Link>
    </li>
  );
});

/**
 * RecentItemsWidget - Dashboard widget showing recently viewed records.
 *
 * Features:
 * - Shows last 5 viewed records with icons and timestamps
 * - Links to record show pages for quick navigation
 * - Empty state when no history exists
 * - Uses semantic colors (text-muted-foreground, hover:bg-muted)
 * - 44px minimum touch targets for tablet accessibility
 *
 * @example
 * ```tsx
 * // Full-size in dashboard tab
 * <RecentItemsWidget />
 *
 * // Compact variant in V4 widget row (200px height, scrollable)
 * <RecentItemsWidget compact />
 * ```
 */
export function RecentItemsWidget({ compact = false }: { compact?: boolean }) {
  const { recentItems } = useRecentSearches();
  const displayItems = recentItems.slice(0, compact ? 8 : 5);

  return (
    <Card
      className={cn(compact && "h-[200px] flex flex-col overflow-hidden")}
      data-tutorial="dashboard-recent-items-widget"
    >
      <CardHeader className={cn(compact ? "py-2 px-3 shrink-0" : "pb-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", compact ? "text-sm" : "text-base")}>
            <Clock className="h-4 w-4 text-primary" />
            Recently Viewed
          </CardTitle>
          {compact && (
            <Link
              to="/contacts"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              View All
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "flex-1 overflow-y-auto px-3 pb-3")}>
        {displayItems.length === 0 ? (
          <p className="text-muted-foreground text-sm py-2">
            No recent items. Start browsing to see your history.
          </p>
        ) : (
          <ul className="space-y-1">
            {displayItems.map((item) => (
              <RecentItemLink key={`${item.entityType}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
