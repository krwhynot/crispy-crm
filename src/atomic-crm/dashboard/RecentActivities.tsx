import { useGetList, useRedirect } from "ra-core";
import { formatDistanceToNow } from "date-fns";
import { Activity as ActivityIcon, Phone, Mail, Users, FileText, ClipboardCheck, Calendar, Building, MapPin, FileSignature, MessageCircle, Share2 } from "lucide-react";
import type { ActivityRecord, Sale } from "../types";
import { DashboardWidget } from "./DashboardWidget";

/**
 * Maps interaction type to corresponding Lucide icon
 */
const getActivityTypeIcon = (type: string): React.ReactNode => {
  const iconClassName = "h-4 w-4 flex-shrink-0";

  switch (type) {
    case "call":
      return <Phone className={iconClassName} />;
    case "email":
      return <Mail className={iconClassName} />;
    case "meeting":
      return <Users className={iconClassName} />;
    case "demo":
      return <FileText className={iconClassName} />;
    case "proposal":
      return <ClipboardCheck className={iconClassName} />;
    case "follow_up":
      return <Calendar className={iconClassName} />;
    case "trade_show":
      return <Building className={iconClassName} />;
    case "site_visit":
      return <MapPin className={iconClassName} />;
    case "contract_review":
      return <FileSignature className={iconClassName} />;
    case "check_in":
      return <MessageCircle className={iconClassName} />;
    case "social":
      return <Share2 className={iconClassName} />;
    default:
      return <ActivityIcon className={iconClassName} />;
  }
};

/**
 * Truncates text to specified length with ellipsis
 */
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formats activity type for display
 */
const formatActivityType = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * RecentActivities Widget
 *
 * Displays the last 10 activities across all users for team visibility.
 * Shows user name, activity type with icon, truncated description, and time ago.
 * Each activity is clickable and navigates to the full activity feed.
 *
 * Features:
 * - Last 10 activities reverse chronologically
 * - Activity type icons
 * - "Time ago" formatting (e.g., "2 hours ago")
 * - Truncated descriptions (~60 characters)
 * - Click activity to view details
 */
export const RecentActivities = () => {
  const redirect = useRedirect();

  // Fetch last 10 activities across all users
  const {
    data: activities,
    isPending,
    error,
    refetch,
  } = useGetList<ActivityRecord>("activities", {
    pagination: { page: 1, perPage: 10 },
    filter: {
      "deleted_at@is": null,
    },
    sort: { field: "activity_date", order: "DESC" },
  });

  // Fetch sales users to display names
  const { data: sales, isPending: isPendingSales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 1000 },
    filter: {},
  });

  // Create a map of sales ID to full name for quick lookup
  const salesMap = sales?.reduce((acc, sale) => {
    acc[sale.id] = `${sale.first_name} ${sale.last_name}`;
    return acc;
  }, {} as Record<string, string>);

  const handleActivityClick = (activityId: string | number) => {
    // Navigate to the activity details (assuming activities resource exists)
    // If not, navigate to a generic activity feed page
    redirect(`/activities/${activityId}/show`);
  };

  const isLoading = isPending || isPendingSales;

  return (
    <DashboardWidget
      title="Recent Activities"
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      icon={<ActivityIcon className="h-6 w-6 md:h-8 md:h-8" />}
    >
      <div className="flex flex-col w-full gap-3 max-h-[400px] overflow-y-auto">
        {activities && activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities
          </div>
        ) : (
          activities?.map((activity) => {
            const userName = activity.created_by
              ? salesMap?.[activity.created_by] || "Unknown User"
              : "System";
            const timeAgo = activity.activity_date
              ? formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })
              : "Date unknown";
            const description = truncateText(
              activity.description || activity.subject,
              60
            );

            return (
              <div
                key={activity.id}
                className="flex flex-col gap-2 p-3 rounded-md border border-border hover:bg-accent hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => handleActivityClick(activity.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleActivityClick(activity.id);
                  }
                }}
                aria-label={`View activity: ${activity.subject}`}
              >
                {/* Header: Icon, User, Type */}
                <div className="flex items-center gap-2">
                  <div className="text-primary">
                    {getActivityTypeIcon(activity.type)}
                  </div>
                  <span className="font-medium text-sm text-foreground">
                    {userName}
                  </span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className="text-xs text-muted-foreground">
                    {formatActivityType(activity.type)}
                  </span>
                </div>

                {/* Description */}
                <div className="text-sm text-muted-foreground pl-6">
                  {description}
                </div>

                {/* Time ago */}
                <div className="text-xs text-muted-foreground pl-6">
                  {timeAgo}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardWidget>
  );
};

export default RecentActivities;
