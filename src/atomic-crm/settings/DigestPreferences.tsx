import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

import { digestKeys } from "../queryKeys";
import { Mail, Bell, BellOff } from "lucide-react";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";

/**
 * Response type from get_digest_preference RPC
 */
interface DigestPreferenceResponse {
  success: boolean;
  digest_opt_in?: boolean;
  email?: string;
  error?: string;
}

/**
 * Response type from update_digest_preference RPC
 */
interface UpdatePreferenceResponse {
  success: boolean;
  digest_opt_in?: boolean;
  message?: string;
  error?: string;
}

/**
 * DigestPreferences Component
 *
 * Allows users to manage their daily digest email preferences.
 * Uses RPC functions for secure preference management:
 * - get_digest_preference() - Fetches current preference using auth.uid()
 * - update_digest_preference(boolean) - Updates preference using auth.uid()
 */
export function DigestPreferences() {
  const { success, actionError } = useSafeNotify();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  // Fetch current preference
  const {
    data: preference,
    isLoading,
    error: fetchError,
  } = useQuery<DigestPreferenceResponse>({
    queryKey: digestKeys.all,
    queryFn: async () => {
      // Use generic RPC typing to avoid explicit assertion
      return dataProvider.rpc<DigestPreferenceResponse>("get_digest_preference", {});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update preference mutation
  const { mutate: updatePreference, isPending: isUpdating } = useMutation({
    mutationFn: async (optIn: boolean) => {
      // Use generic RPC typing to avoid explicit assertion
      const response = await dataProvider.rpc<UpdatePreferenceResponse>(
        "update_digest_preference",
        { p_opt_in: optIn }
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update preference");
      }

      return response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: digestKeys.all });
      success(data.message || notificationMessages.updated("Preference"));
    },
    onError: (error: Error) => {
      actionError(error, "update", "preference");
    },
  });

  const handleToggle = (checked: boolean) => {
    updatePreference(checked);
  };

  // Loading state
  if (isLoading) {
    return (
      <SectionCard icon={<Mail className="h-5 w-5" />} title="Email Notifications">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </SectionCard>
    );
  }

  // Error state
  if (fetchError || !preference?.success) {
    return (
      <SectionCard icon={<Mail className="h-5 w-5" />} title="Email Notifications">
        <p className="text-sm text-destructive">
          Unable to load email preferences. Please try refreshing the page.
        </p>
      </SectionCard>
    );
  }

  const isOptedIn = preference.digest_opt_in ?? true;

  return (
    <SectionCard
      icon={<Mail className="h-5 w-5" />}
      title="Email Notifications"
      description="Manage how you receive updates about your tasks and opportunities"
      contentClassName="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOptedIn ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="space-y-0.5">
            <Label htmlFor="digest-toggle" className="text-sm font-medium">
              Daily Digest Emails
            </Label>
            <p className="text-xs text-muted-foreground">
              {isOptedIn
                ? "You'll receive a morning summary of overdue tasks and stale deals"
                : "Daily digest emails are disabled"}
            </p>
          </div>
        </div>
        <Switch
          id="digest-toggle"
          checked={isOptedIn}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          aria-label="Toggle daily digest emails"
        />
      </div>

      {isOptedIn && (
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Digest includes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Tasks due today</li>
            <li>Overdue tasks requiring attention</li>
            <li>Stale deals that haven't been updated recently</li>
          </ul>
          <p className="mt-2 italic">Digests are only sent when you have actionable items.</p>
        </div>
      )}
    </SectionCard>
  );
}
