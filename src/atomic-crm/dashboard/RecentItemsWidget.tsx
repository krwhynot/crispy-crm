import { memo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useRecentItems, type RecentItem } from "../hooks/useRecentItems";
import { Building2, User, Target, ListTodo, Clock } from "lucide-react";

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
 * Format a timestamp as relative time using Intl.RelativeTimeFormat.
 * Constitution P13: Use native APIs for localization.
 *
 * @example
 * formatRelativeTime("2025-01-03T10:00:00Z") // "2 hours ago"
 */
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return rtf.format(-diffMins, "minute");
  if (diffMins < 1440) return rtf.format(-Math.floor(diffMins / 60), "hour");
  return rtf.format(-Math.floor(diffMins / 1440), "day");
};

/**
 * Memoized list item component for rendering a single recent item.
 * Performance: Prevents re-renders when other items change.
 */
const RecentItemLink = memo(function RecentItemLink({
  item,
}: {
  item: RecentItem;
}) {
  const Icon = RESOURCE_ICONS[item.resource] || Building2;

  return (
    <li>
      <Link
        to={`/${item.resource}/${item.id}/show`}
        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted min-h-[44px] transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(item.viewedAt)}
          </p>
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
 * // In dashboard layout
 * <RecentItemsWidget />
 * ```
 */
export function RecentItemsWidget() {
  const { recentItems } = useRecentItems();
  const displayItems = recentItems.slice(0, 5);

  return (
    <Card data-tutorial="dashboard-recent-items-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Recently Viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <p className="text-muted-foreground text-sm py-2">
            No recent items. Start browsing to see your history.
          </p>
        ) : (
          <ul className="space-y-1" role="list">
            {displayItems.map((item) => (
              <RecentItemLink
                key={`${item.resource}-${item.id}`}
                item={item}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
