import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import type { QuickAddInput } from "@/atomic-crm/validation/quickAdd";
import { setStorageItem } from "@/atomic-crm/utils/secureStorage";
import { organizationKeys, contactKeys, opportunityKeys } from "@/atomic-crm/queryKeys";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

/**
 * Quick Add Hook for Opportunity Creation
 *
 * Provides a mutation for creating opportunities (organization + contact + opportunity)
 * with localStorage persistence for campaign, principal, and account manager selections.
 *
 * Features:
 * - Creates opportunity via data provider RPC call
 * - Supports existing organization (organization_id) or new organization creation (org_name)
 * - Invalidates cache for organizations, contacts, and opportunities
 * - Persists last campaign, principal, and account manager to localStorage for next use
 * - Shows success toast with created contact/org details
 * - Shows error toast on failure, preserves form data
 * - No retry logic per Engineering Constitution (fail fast)
 *
 * @returns Mutation object with mutate, mutateAsync, isPending, isError, etc.
 */
export const useQuickAdd = () => {
  const dataProvider = useDataProvider();
  const { success, actionError } = useSafeNotify();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: QuickAddInput) => {
      return await dataProvider.createBoothVisitor(formData);
    },
    onSuccess: (_result, formData) => {
      // Invalidate all affected resource caches
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });

      // Update localStorage with last used campaign, principal, and account manager
      if (formData.campaign) {
        setStorageItem("last_campaign", formData.campaign, { type: "local" });
      }
      setStorageItem("last_principal", formData.principal_id.toString(), { type: "local" });
      setStorageItem("last_account_manager", formData.account_manager_id.toString(), {
        type: "local",
      });

      // Build success message with org name and optional contact name
      const orgName = formData.org_name || "Organization";
      const contactName =
        formData.first_name || formData.last_name
          ? `${formData.first_name || ""} ${formData.last_name || ""}`.trim()
          : "";

      const message = contactName
        ? `Created opportunity for ${contactName} at ${orgName}`
        : `Created opportunity for ${orgName}`;

      notify(message, {
        type: "success",
        autoHideDuration: 2000,
      });
    },
    onError: (error: Error) => {
      // Show error toast - form data is preserved automatically by React Hook Form
      notify(`Failed to create opportunity: ${error.message}`, {
        type: "error",
      });
    },
  });

  return mutation;
};
