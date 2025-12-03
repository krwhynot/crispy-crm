import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetIdentity, useGetList } from "ra-core";
import { NotificationDropdown } from "./NotificationDropdown";

interface Notification {
  id: number;
  read: boolean;
  user_id: string;
}

export const NotificationBell = () => {
  const { data: identity, isLoading } = useGetIdentity();

  const { total: unreadCount = 0, refetch } = useGetList<Notification>(
    "notifications",
    {
      pagination: { page: 1, perPage: 1 },
      filter: identity?.user_id
        ? { user_id: identity.user_id, read: false }
        : {},
    },
    {
      enabled: !!identity?.user_id && !isLoading,
      refetchInterval: 30000,
    }
  );

  const ariaLabel = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications";

  return (
    <NotificationDropdown onOpenChange={(open) => open && refetch()}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={ariaLabel}
        className="relative min-h-[44px] min-w-[44px]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </NotificationDropdown>
  );
};
