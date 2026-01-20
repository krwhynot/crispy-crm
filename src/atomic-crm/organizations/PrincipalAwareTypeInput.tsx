import { useState, useEffect, useRef } from "react";
import { useRecordContext, useGetList } from "ra-core";
import { useFormContext, useWatch } from "react-hook-form";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { PrincipalChangeWarning } from "./PrincipalChangeWarning";
import {
  ORGANIZATION_TYPE_CHOICES,
  ORGANIZATION_TYPE_DESCRIPTIONS,
  type OrganizationType,
} from "./constants";
import type { Organization } from "../types";

interface Product {
  id: number;
  name: string;
  principal_id: number;
}

/**
 * A SelectInput for organization_type that validates principal type changes.
 *
 * When an organization is currently a "principal" and the user tries to change
 * the type, this component:
 * 1. Checks if products are assigned to this principal
 * 2. If products exist, shows a warning dialog and reverts the change
 * 3. If no products, allows the change
 *
 * This provides immediate feedback at form field level, not at save time.
 */
export const PrincipalAwareTypeInput = (): JSX.Element => {
  const record = useRecordContext<Organization>();
  const { setValue } = useFormContext();
  const currentType = useWatch({ name: "organization_type" });

  const [showWarning, setShowWarning] = useState(false);
  const [attemptedType, setAttemptedType] = useState<string>("");

  // Track the original type from the record
  const originalType = record?.organization_type;
  const wasPrincipal = originalType === "principal";

  // Track previous value to detect changes
  const previousTypeRef = useRef<string | undefined>(currentType);

  // Pre-fetch products for principals (only fetches if record was originally a principal)
  const { data: products, isLoading: productsLoading } = useGetList<Product>(
    "products",
    {
      filter: { principal_id: record?.id },
      pagination: { page: 1, perPage: 1 }, // Only need to know if ANY exist
      sort: { field: "name", order: "ASC" },
    },
    {
      enabled: wasPrincipal && !!record?.id,
    }
  );

  const hasProducts = (products?.length ?? 0) > 0;

  // Watch for type changes and validate
  useEffect(() => {
    const previousType = previousTypeRef.current;

    // Only act if the value actually changed
    if (previousType === currentType) {
      return;
    }

    // If changing FROM principal to something else
    if (
      wasPrincipal &&
      previousType === "principal" &&
      currentType !== "principal" &&
      !productsLoading
    ) {
      // Check if products are assigned
      if (hasProducts) {
        // Revert the change and show warning
        setAttemptedType(currentType);
        setShowWarning(true);
        setValue("organization_type", "principal", { shouldDirty: false });
        // Don't update previousTypeRef - we reverted
        return;
      }
    }

    // Update the ref for next comparison
    previousTypeRef.current = currentType;
  }, [currentType, wasPrincipal, hasProducts, productsLoading, setValue]);

  const handleWarningClose = () => {
    setShowWarning(false);
    setAttemptedType("");
  };

  /**
   * Custom renderer that displays organization type with description
   * This provides inline context about what each type means without needing
   * to hover over tooltips - better for accessibility and discoverability.
   */
  const renderTypeWithDescription = (choice: { id: string; name: string }) => {
    const description = ORGANIZATION_TYPE_DESCRIPTIONS[choice.id as OrganizationType];
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{choice.name}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
    );
  };

  return (
    <>
      <SelectInput
        source="organization_type"
        label="Type"
        choices={ORGANIZATION_TYPE_CHOICES}
        helperText={false}
        emptyText="Select organization type"
        optionText={renderTypeWithDescription}
      />

      <PrincipalChangeWarning
        open={showWarning}
        onClose={handleWarningClose}
        onConfirm={handleWarningClose}
        newType={attemptedType}
      />
    </>
  );
};
