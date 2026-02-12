/**
 * AuthorizationsEmptyState - Empty state for when no principals are authorized
 *
 * Displays a helpful message and CTA button to add the first principal.
 * Uses the centralized EmptyState component for consistent empty state rendering.
 */

import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface AuthorizationsEmptyStateProps {
  onAddClick: () => void;
}

export function AuthorizationsEmptyState({ onAddClick }: AuthorizationsEmptyStateProps) {
  return (
    <EmptyState
      icon={Building2}
      title="No Authorized Principals"
      description="Add principals that are authorized to sell through this distributor."
      action={{ label: "Add First Principal", onClick: onAddClick }}
      className="border border-dashed border-border rounded-lg py-4"
    />
  );
}
