/**
 * AuthorizationsEmptyState - Empty state for when no principals are authorized
 *
 * Displays a helpful message and CTA button to add the first principal.
 */

import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthorizationsEmptyStateProps {
  onAddClick: () => void;
}

export function AuthorizationsEmptyState({ onAddClick }: AuthorizationsEmptyStateProps) {
  return (
    <div className="text-center py-12 border border-dashed border-border rounded-lg">
      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No Authorized Principals</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add principals that are authorized to sell through this distributor.
      </p>
      <Button variant="outline" onClick={onAddClick} className="h-11">
        <Plus className="h-4 w-4 mr-1" />
        Add First Principal
      </Button>
    </div>
  );
}
