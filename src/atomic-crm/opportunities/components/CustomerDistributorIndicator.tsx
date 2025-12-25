import { useWatch } from "react-hook-form";
import { Star, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomerDistributors } from "../hooks/useCustomerDistributors";

/**
 * Visual indicator showing distributor-customer relationship status.
 *
 * Displays contextual feedback about the selected distributor:
 * - Primary distributor badge (star icon)
 * - Existing relationship badge (users icon)
 * - Available relationships hint (info icon)
 *
 * Follows Engineering Constitution:
 * - Fail-fast: Shows loading state, error displays naturally
 * - Semantic colors: Uses muted-foreground, primary, etc.
 * - Touch targets: Icons are decorative, no action needed
 */
export function CustomerDistributorIndicator() {
  const customerId = useWatch({ name: "customer_organization_id" });
  const distributorId = useWatch({ name: "distributor_organization_id" });

  const {
    distributorIds,
    primaryDistributorId,
    hasCustomerSelected,
    hasRelationships,
    isLoading,
  } = useCustomerDistributors(customerId);

  // Don't show anything if no customer selected
  if (!hasCustomerSelected) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
        <Info className="h-3 w-3" />
        <span>Checking distributor relationships...</span>
      </div>
    );
  }

  // No relationships exist for this customer
  if (!hasRelationships) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>No existing distributor relationships for this customer</span>
      </div>
    );
  }

  // Check if selected distributor is related
  const isSelectedPrimary = distributorId === primaryDistributorId;
  const isSelectedRelated = distributorId && distributorIds.includes(distributorId);

  // Primary distributor is selected
  if (isSelectedPrimary) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary">
        <Star className="h-3 w-3 fill-current" />
        <span>Primary distributor for this customer</span>
      </div>
    );
  }

  // A related (but not primary) distributor is selected
  if (isSelectedRelated) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary">
        <Users className="h-3 w-3" />
        <span>Existing relationship with this customer</span>
      </div>
    );
  }

  // No distributor selected yet, or non-related distributor selected
  const relationshipCount = distributorIds.length;
  const message = distributorId
    ? `This customer has ${relationshipCount} other distributor${relationshipCount > 1 ? "s" : ""}`
    : `${relationshipCount} distributor${relationshipCount > 1 ? "s" : ""} serve${relationshipCount === 1 ? "s" : ""} this customer`;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        distributorId ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
      )}
    >
      <Info className="h-3 w-3" />
      <span>{message}</span>
    </div>
  );
}
