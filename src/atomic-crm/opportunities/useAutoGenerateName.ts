import { useEffect, useCallback } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetOne } from "ra-core";

/**
 * Auto-Generate Name Hook
 * Automatically generates opportunity name from customer + principal + context + date
 *
 * @param mode - 'create' for auto-generation, 'edit' for manual regeneration
 * @returns regenerate function and loading state
 */
export const useAutoGenerateName = (mode: "create" | "edit") => {
  const { setValue } = useFormContext();

  // Watch relevant fields
  const customerOrgId = useWatch({ name: "customer_organization_id" });
  const principalOrgId = useWatch({ name: "principal_organization_id" });
  const opportunityContext = useWatch({ name: "opportunity_context" });
  const currentName = useWatch({ name: "name" });

  // Fetch customer organization name
  const { data: customerOrg, isLoading: isLoadingCustomer } = useGetOne(
    "organizations",
    { id: customerOrgId },
    { enabled: !!customerOrgId }
  );

  // Fetch principal organization name
  const { data: principalOrg, isLoading: isLoadingPrincipal } = useGetOne(
    "organizations",
    { id: principalOrgId },
    { enabled: !!principalOrgId }
  );

  const isLoading = isLoadingCustomer || isLoadingPrincipal;

  /**
   * Generate name from components
   * Format: "Customer Name - Principal Name - Context - MMM YYYY"
   */
  const generateName = useCallback(() => {
    const parts = [
      customerOrg?.name,
      principalOrg?.name,
      opportunityContext,
      new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    ].filter(Boolean);

    return parts.join(" - ");
  }, [customerOrg?.name, principalOrg?.name, opportunityContext]);

  /**
   * Manual regenerate function for edit mode
   */
  const regenerate = useCallback(() => {
    if (!isLoading) {
      const newName = generateName();
      if (newName) {
        setValue("name", newName, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [generateName, setValue, isLoading]);

  /**
   * Auto-generate in create mode when fields change and name is empty
   */
  useEffect(() => {
    if (mode === "create" && !currentName && !isLoading) {
      const newName = generateName();
      if (newName) {
        setValue("name", newName, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [mode, currentName, generateName, setValue, isLoading]);

  return { regenerate, isLoading };
};
