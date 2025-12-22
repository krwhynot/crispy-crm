import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useNotify } from "ra-core";
import type { QuickAddInput } from "@/atomic-crm/validation/quickAdd";
import { setStorageItem } from "@/atomic-crm/utils/secureStorage";

/**
 * Quick Add Hook for Booth Visitor Creation
 *
 * Provides a mutation for creating booth visitors (organization + contact + opportunity)
 * with localStorage persistence for campaign and principal selections.
 *
 * Features:
 * - Creates booth visitor via data provider RPC call
 * - Persists last campaign and principal to localStorage for next use
 * - Shows success toast with created contact/org details
 * - Shows error toast on failure, preserves form data
 * - No retry logic per Engineering Constitution (fail fast)
 *
 * @returns Mutation object with mutate, mutateAsync, isPending, isError, etc.
 */
export const useQuickAdd = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const mutation = useMutation({
    mutationFn: async (formData: QuickAddInput) => {
      return await dataProvider.createBoothVisitor(formData);
    },
    onSuccess: (result, formData) => {
      // Update localStorage with last used campaign and principal
      localStorage.setItem("last_campaign", formData.campaign);
      localStorage.setItem("last_principal", formData.principal_id.toString());

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
