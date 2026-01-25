import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify } from "ra-core";
import { logger } from "@/lib/logger";
import { saleKeys } from "@/atomic-crm/queryKeys";
import type { CrmDataProvider } from "../../providers/types";
import type { SalesFormData } from "../../types";

interface UseSalesUpdateOptions {
  /**
   * The user ID to update. Required.
   */
  userId: string | undefined;
  /**
   * Optional callback fired on successful update.
   * Use this to trigger refetches, close modals, etc.
   */
  onSuccess?: () => void;
}

/**
 * Custom hook for updating sales/user profile data.
 *
 * Centralizes the mutation logic previously duplicated in SettingsPage and PersonalSection.
 * Uses the unified data provider pattern per project architecture.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useSalesUpdate({
 *   userId: identity?.id,
 *   onSuccess: () => {
 *     refetchIdentity();
 *     notify("Profile updated!");
 *   },
 * });
 *
 * // Trigger update
 * mutate({ first_name: "John", last_name: "Doe" });
 * ```
 */
export function useSalesUpdate({ userId, onSuccess }: UseSalesUpdateOptions) {
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateProfile", userId],
    mutationFn: async (data: SalesFormData) => {
      if (!userId) {
        throw new Error("User ID is required for profile update");
      }
      return dataProvider.salesUpdate(userId, data);
    },
    onSuccess: () => {
      // Invalidate cache to ensure fresh data after profile update
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: saleKeys.detail(userId) });
      }
      notify("Your profile has been updated");
      onSuccess?.();
    },
    onError: (error) => {
      logger.error("Profile update failed", error, { feature: "useSalesUpdate", userId });
      notify("An error occurred. Please try again.", {
        type: "error",
      });
    },
  });
}
