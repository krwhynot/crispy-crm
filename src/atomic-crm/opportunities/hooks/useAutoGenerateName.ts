import { useEffect, useCallback } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetOne } from "ra-core";
import { generateOpportunityName } from "../utils/generateOpportunityName";

/**
 * Auto-Generate Name Hook
 * Automatically generates opportunity name from principal + customer + month/year
 *
 * Format: "{Principal Name} - {Customer Name} - MMYY"
 * Example: "Ocean Hugger - Nobu Miami - 1225" (December 2025)
 *
 * @param mode - 'create' for auto-generation, 'edit' for manual regeneration
 * @returns regenerate function, loading state, and canGenerate flag
 */
export const useAutoGenerateName = (mode: "create" | "edit") => {
  const { setValue } = useFormContext();

  // Watch relevant fields
  const customerOrgId = useWatch({ name: "customer_organization_id" });
  const principalOrgId = useWatch({ name: "principal_organization_id" });
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

  // Button should be enabled when at least one of customer or principal is selected
  const canGenerate = !!(customerOrg?.name || principalOrg?.name);

  /**
   * Generate name using the standardized utility function
   * Format: "{Principal Name} - {Customer Name} - MMYY"
   */
  const generateName = useCallback(() => {
    return generateOpportunityName({
      customerName: customerOrg?.name,
      principalName: principalOrg?.name,
      date: new Date(),
    });
  }, [customerOrg?.name, principalOrg?.name]);

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

  return { regenerate, isLoading, canGenerate };
};
