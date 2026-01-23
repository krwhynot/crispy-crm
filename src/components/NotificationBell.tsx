import { Bell } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
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
      filter: identity?.user_id ? { user_id: identity.user_id, read: false } : {},
    },
    {
      enabled: !!identity?.user_id && !isLoading,
      refetchInterval: 30000,
      // staleTime < refetchInterval prevents double-fetching
      staleTime: 25000,
      // Don't poll when tab is in background
      refetchIntervalInBackground: false,
    }
  );

  const ariaLabel = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications";

  return (
    <NotificationDropdown onOpenChange={(open) => open && refetch()}>
      <AdminButton variant="ghost" size="icon" aria-label={ariaLabel} className="relative">
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </AdminButton>
    </NotificationDropdown>
  );
};
