/**
 * useOrganizationVariant - Centralized variant detection and field requirement logic
 *
 * Eliminates UI duplication by providing a single hook that:
 * 1. Detects form variant (create/edit/quickCreate) from context
 * 2. Returns variant-specific configuration
 * 3. Provides helper methods for field requirements
 *
 * CRITICAL:
 * - Detects quickCreate from URL path or location.state
 * - Detects edit mode from record.id presence
 * - Falls back to create mode as default
 *
 * @example
 * ```tsx
 * const variant = useOrganizationVariant();
 *
 * // Check if field is required
 * if (variant.isRequired('sales_id')) {
 *   return <TextInput source="sales_id" validate={required()} />;
 * }
 *
 * // Get default value
 * const defaultPriority = variant.getDefault('priority'); // 'C'
 *
 * // Check if field should be preserved during update
 * if (variant.shouldPreserve('created_at')) {
 *   // Keep field in payload
 * }
 * ```
 */
import { useLocation } from "react-router-dom";
import { useRecordContext } from "react-admin";
import {
  type OrganizationFormVariant,
  ORGANIZATION_FORM_VARIANTS,
} from "@/atomic-crm/validation/organizationFormConfig";

interface UseOrganizationVariantResult extends OrganizationFormVariant {
  /**
   * Check if a field is required for the current variant
   */
  isRequired: (fieldName: string) => boolean;

  /**
   * Get default value for a field (if any)
   */
  getDefault: <K extends keyof OrganizationFormVariant["defaultValues"]>(
    fieldName: K
  ) => OrganizationFormVariant["defaultValues"][K] | undefined;

  /**
   * Check if a field should be preserved from original record during update
   */
  shouldPreserve: (fieldName: string) => boolean;
}

/**
 * Detect form variant from URL and record context
 */
export function useOrganizationVariant(): UseOrganizationVariantResult {
  const location = useLocation();
  const record = useRecordContext();

  // Detect variant based on URL path and record context
  let variantKey: OrganizationFormVariant["variant"];

  // 1. Check URL path for quickCreate (/organizations/create/quick)
  if (location.pathname.includes("/quick")) {
    variantKey = "quickCreate";
  }
  // 2. Check location.state for quickCreate (passed from QuickCreatePopover)
  else if (location.state && "isQuickCreate" in location.state && location.state.isQuickCreate) {
    variantKey = "quickCreate";
  }
  // 3. Check record.id to detect edit mode
  else if (record && record.id) {
    variantKey = "edit";
  }
  // 4. Default to create mode
  else {
    variantKey = "create";
  }

  const variantConfig = ORGANIZATION_FORM_VARIANTS[variantKey];

  // Helper methods
  const isRequired = (fieldName: string): boolean => {
    return variantConfig.requiredFields.includes(fieldName);
  };

  const getDefault = <K extends keyof OrganizationFormVariant["defaultValues"]>(
    fieldName: K
  ): OrganizationFormVariant["defaultValues"][K] | undefined => {
    return variantConfig.defaultValues[fieldName];
  };

  const shouldPreserve = (fieldName: string): boolean => {
    return variantConfig.preserveFields.includes(fieldName);
  };

  return {
    ...variantConfig,
    isRequired,
    getDefault,
    shouldPreserve,
  };
}
