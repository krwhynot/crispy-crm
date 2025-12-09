import { formatDistanceToNow } from "date-fns";
import { Eye, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetIdentity, useGetList, useUpdate, useNotify } from "ra-core";
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
  user_id: string;
}

interface NotificationDropdownProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const NotificationDropdown = ({ children, onOpenChange }: NotificationDropdownProps) => {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useGetList<Notification>(
    "notifications",
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "created_at", order: "DESC" },
      filter: identity?.user_id ? { user_id: identity.user_id } : {},
    },
    { enabled: !!identity?.user_id }
  );

  const [update] = useUpdate();

  const markAsRead = async (notificationId: number) => {
    if (!identity?.user_id) return;

    update(
      "notifications",
      {
        id: notificationId,
        data: { read: true },
        previousData: notifications.find((n) => n.id === notificationId),
      },
      {
        onSuccess: () => {
          refetch();
        },
        onError: () => {
          notify("Error marking notification as read", { type: "error" });
        },
      }
    );
  };

  const markAllAsRead = async () => {
    if (!identity?.user_id) return;

    const unreadNotifications = notifications.filter((n) => !n.read);

    await Promise.allSettled(
      unreadNotifications.map((notification) =>
        update("notifications", {
          id: notification.id,
          data: { read: true },
          previousData: notification,
        })
      )
    );

    refetch();
  };

  const getEntityLink = (entityType: string | null, entityId: number | null) => {
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-11 text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  getEntityLink={getEntityLink}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Link to="/notifications">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ExternalLink className="size-4 mr-2" />
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  getEntityLink: (entityType: string | null, entityId: number | null) => string | null;
}

const NotificationItem = ({ notification, onMarkAsRead, getEntityLink }: NotificationItemProps) => {
  const entityLink = getEntityLink(notification.entity_type, notification.entity_id);
  const timeAgo = formatDistanceToNow(parseDateSafely(notification.created_at) ?? new Date(), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-2 h-2 rounded-full mt-2",
          !notification.read ? "bg-primary" : "bg-muted-foreground/30"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-1">{notification.message}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {entityLink && (
            <>
              <span>•</span>
              <Link
                to={entityLink}
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                View {notification.entity_type}
                <ExternalLink className="size-3" />
              </Link>
            </>
          )}
        </div>
      </div>
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-11 w-11"
          onClick={() => onMarkAsRead(notification.id)}
          aria-label="Mark as read"
        >
          <Eye className="size-4" />
        </Button>
      )}
    </div>
  );
};
