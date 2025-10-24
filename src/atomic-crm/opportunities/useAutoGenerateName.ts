import { useEffect, useCallback, useMemo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetOne } from "ra-core";

/**
 * Auto-Generate Name Hook
 * Automatically generates opportunity name from customer + principal + products + date
 *
 * @param mode - 'create' for auto-generation, 'edit' for manual regeneration
 * @returns regenerate function and loading state
 */
export const useAutoGenerateName = (mode: "create" | "edit") => {
  const { setValue } = useFormContext();

  // Watch relevant fields
  const customerOrgId = useWatch({ name: "customer_organization_id" });
  const principalOrgId = useWatch({ name: "principal_organization_id" });
  const productsRaw = useWatch({ name: "products" });
  const currentName = useWatch({ name: "name" });

  // Stabilize products array reference to prevent infinite loops
  // Only update when length or content actually changes (deep equality)
  const products = useMemo(() => {
    if (!productsRaw || !Array.isArray(productsRaw)) return [];
    return productsRaw;
  }, [productsRaw?.length, JSON.stringify(productsRaw)]);

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
   * Format: "Customer Name - Principal Name - Product/Count - MMM YYYY"
   */
  const generateName = useCallback(() => {
    const parts = [];

    if (customerOrg?.name) {
      parts.push(customerOrg.name);
    }

    if (principalOrg?.name) {
      parts.push(principalOrg.name);
    }

    if (products.length === 0) {
      parts.push("[No Product]");
    } else if (products.length === 1) {
      parts.push(products[0].product_name || "Product");
    } else {
      parts.push(`${products.length} products`);
    }

    parts.push(
      new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    );

    return parts.join(" - ");
  }, [customerOrg?.name, principalOrg?.name, products]);

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
