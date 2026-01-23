import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Eye, ExternalLink } from "lucide-react";
import { useListContext, useUpdate, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { List } from "@/components/ra-wrappers/list";
import { TopToolbar } from "../layout/TopToolbar";
import { Card } from "@/components/ui/card";
import { FilterLiveForm } from "ra-core";
import { SearchInput } from "@/components/ra-wrappers/search-input";
import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { AdminButton } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { parseDateSafely } from "@/lib/date-utils";

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
      title="Notifications"
      actions={<NotificationsListActions />}
      perPage={20}
      sort={{ field: "created_at", order: "DESC" }}
      empty={<NotificationsEmpty />}
    >
      <NotificationsListLayout />
    </List>
  );
};

const NotificationsListLayout = () => {
  const { isPending } = useListContext<Notification>();

  if (isPending) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="flex flex-row gap-6">
      <NotificationsListFilter />
      <div className="flex-1 flex flex-col gap-4">
        <Card className="bg-card border border-border shadow-sm rounded-xl p-2">
          <NotificationsListContent />
        </Card>
      </div>
      <BulkActionsToolbar>
        <NotificationsBulkActions />
      </BulkActionsToolbar>
    </div>
  );
};

const NotificationsListActions = () => (
  <TopToolbar>{/* No actions needed for notifications list */}</TopToolbar>
);

const NotificationsListFilter = () => {
  return (
    <div className="w-52 min-w-52 order-first">
      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <FilterLiveForm>
            <SearchInput source="q" placeholder="Search notifications..." />
          </FilterLiveForm>

          {/* Divider */}
          <div className="border-b border-border" />

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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Bell className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No notifications</p>
        <p className="text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {data.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

const NotificationRow = ({ notification }: { notification: Notification }) => {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const markAsRead = async () => {
    await update(
      "notifications",
      { id: notification.id, data: { read: true } },
      {
        onSuccess: () => {
          notify("Notification marked as read", { type: "success" });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: () => {
          notify("Error marking notification as read", { type: "error" });
        },
      }
    );
  };

  const timeAgo = formatDistanceToNow(parseDateSafely(notification.created_at) ?? new Date(), {
    addSuffix: true,
  });

  const entityLink = getEntityLink(notification.entity_type, notification.entity_id);

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors",
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
};

const NotificationsBulkActions = () => {
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { selectedIds } = useListContext();

  const markAllAsRead = async () => {
    try {
      // Phase 3: Use Promise.allSettled() to handle partial failures gracefully
      const results = await Promise.allSettled(
        selectedIds.map((id) => update("notifications", { id, data: { read: true } }))
      );

      // Count successes and failures
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures === 0) {
        notify(`${successes} notification(s) marked as read`, { type: "success" });
      } else if (successes > 0) {
        notify(`${successes} notification(s) marked as read, ${failures} failed`, {
          type: "warning",
        });
      } else {
        notify("Failed to mark notifications as read", { type: "error" });
      }

      refresh();
    } catch {
      notify("Error marking notifications as read", { type: "error" });
    }
  };

  return (
    <AdminButton variant="ghost" size="sm" onClick={markAllAsRead} className="h-11 text-xs">
      <Check className="h-4 w-4 mr-2" />
      Mark as read
    </AdminButton>
  );
};

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
