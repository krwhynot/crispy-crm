import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataProvider, useNotify } from "ra-core";
import type { QuickAddInput } from "@/atomic-crm/validation/quickAdd";
import { setStorageItem } from "@/atomic-crm/utils/secureStorage";
import { organizationKeys, contactKeys, opportunityKeys } from "@/atomic-crm/queryKeys";

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
  const notify = useNotify();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: QuickAddInput) => {
      return await dataProvider.createBoothVisitor(formData);
    },
    onSuccess: (result, formData) => {
      // Invalidate all affected resource caches
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });

      // Update localStorage with last used campaign and principal
      setStorageItem("last_campaign", formData.campaign, { type: "local" });
      setStorageItem("last_principal", formData.principal_id.toString(), { type: "local" });

      // Show success toast with 2-second auto-hide
      const message = `✅ Created: ${formData.first_name} ${formData.last_name} - ${formData.org_name}`;
      notify(message, {
        type: "success",
        autoHideDuration: 2000,
      });
    },
    onError: (error: Error) => {
      // Show error toast - form data is preserved automatically by React Hook Form
      notify(`Failed to create booth visitor: ${error.message}`, {
        type: "error",
      });
    },
  });

  return mutation;
};
