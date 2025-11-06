import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import { useGetIdentity } from "ra-core";
import { NotificationDropdown } from "./NotificationDropdown";

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: identity, isLoading } = useGetIdentity();

  // Fetch initial unread count
  useEffect(() => {
    if (!identity?.user_id || isLoading) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", identity.user_id)
        .eq("read", false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
  }, [identity?.user_id, isLoading]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!identity?.id || isLoading) return;

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${identity.id}`,
        },
        async () => {
          // Refetch count when notifications change
          const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", identity.id)
            .eq("read", false);

          if (!error && count !== null) {
            setUnreadCount(count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [identity?.id, isLoading]);

  // Accessible label
  const ariaLabel =
    unreadCount > 0
      ? `Notifications (${unreadCount} unread)`
      : "Notifications";

  return (
    <NotificationDropdown>
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
