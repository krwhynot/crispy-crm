import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Eye, ExternalLink } from "lucide-react";
import { useListContext, useUpdate, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { List } from "@/components/ra-wrappers/list";
import { ListPagination } from "@/components/ra-wrappers/list-pagination";
import { ListPageLayout } from "@/components/layouts/ListPageLayout";
import { Card } from "@/components/ui/card";
import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { AdminButton } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { parseDateSafely } from "@/lib/date-utils";
import { notificationKeys } from "@/atomic-crm/queryKeys";

interface Notification {
  id: number;
  type: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  read: boolean;
  created_at: string;
}

const NotificationsList = () => {
  return (
    <List
      title={false}
      actions={false}
      perPage={20}
      sort={{ field: "created_at", order: "DESC" }}
      pagination={<ListPagination showExport />}
    >
      <ListPageLayout
        resource="notifications"
        showFilterSidebar={false}
        showFilterToggle={false}
        wrapMainInCard={false}
        emptyState={<NotificationsEmpty />}
      >
        <div className="flex flex-row gap-section w-full min-w-0">
          <NotificationsListFilter />
          <div className="flex-1 flex flex-col min-h-0">
            <Card className="card-list-surface p-content flex-1 overflow-y-auto min-h-0">
              <NotificationsListContent />
            </Card>
          </div>
        </div>
      </ListPageLayout>
    </List>
  );
};

const NotificationsListFilter = () => {
  return (
    <div className="w-52 min-w-52 order-first">
      <Card className="card-list-surface p-content">
        <div className="flex flex-col gap-4">
          {/* Read/Unread Filter */}
          <FilterCategory label="Status" icon={<Bell className="h-4 w-4" />}>
            <ToggleFilterButton
              className="w-full justify-between"
              label="Unread only"
              value={{ read: false }}
            />
            <ToggleFilterButton
              className="w-full justify-between"
              label="Read only"
              value={{ read: true }}
            />
          </FilterCategory>
        </div>
      </Card>
    </div>
  );
};

const NotificationsListContent = () => {
  const { data } = useListContext<Notification>();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="divide-y divide-border">
      {data.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

const NotificationRow = memo(function NotificationRow({
  notification,
}: {
  notification: Notification;
}) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const markAsRead = async () => {
    try {
      await update(
        "notifications",
        { id: notification.id, data: { read: true } },
        {
          returnPromise: true,
          onSuccess: () => {
            notify("Notification marked as read", { type: "success" });
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          },
          onError: () => {
            notify("Error marking notification as read", { type: "error" });
          },
        }
      );
    } catch {
      notify("Error marking notification as read", { type: "error" });
    }
  };

  const timeAgo = formatDistanceToNow(parseDateSafely(notification.created_at) ?? new Date(), {
    addSuffix: true,
  });

  const entityLink = getEntityLink(notification.entity_type, notification.entity_id);

  return (
    <div
      className={cn(
        "flex items-start gap-content p-content hover:bg-muted/30 transition-colors",
        !notification.read && "bg-muted/20"
      )}
    >
      {/* Status Indicator */}
      <div className="flex-shrink-0 mt-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            !notification.read ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm">{notification.message}</p>
          <Badge variant="outline" className="flex-shrink-0">
            {getNotificationTypeLabel(notification.type)}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {entityLink && (
            <>
              <span>•</span>
              <Link
                to={entityLink}
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                View {notification.entity_type}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mark as Read Button */}
      {!notification.read && (
        <AdminButton
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-11 w-11"
          onClick={markAsRead}
          aria-label="Mark as read"
        >
          <Eye className="h-4 w-4" />
        </AdminButton>
      )}
    </div>
  );
});

const NotificationsEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
      <Bell className="h-16 w-16 mb-4 opacity-50" />
      <h2 className="text-2xl font-semibold mb-2">No notifications yet</h2>
      <p className="text-sm">Notifications will appear here when you have updates.</p>
    </div>
  );
};

// Helper functions
const getEntityLink = (entityType: string | null, entityId: number | null): string | null => {
  if (!entityType || !entityId) return null;

  const routes: Record<string, string> = {
    task: `/tasks/${entityId}`,
    opportunity: `/opportunities/${entityId}/show`,
    contact: `/contacts/${entityId}/show`,
    organization: `/organizations/${entityId}/show`,
    product: `/products/${entityId}/show`,
  };

  return routes[entityType] || null;
};

const getNotificationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    task_overdue: "Overdue Task",
    task_assigned: "Task Assigned",
    mention: "Mention",
    opportunity_won: "Opportunity Won",
    opportunity_lost: "Opportunity Lost",
    system: "System",
  };

  return labels[type] || type;
};

export default NotificationsList;
