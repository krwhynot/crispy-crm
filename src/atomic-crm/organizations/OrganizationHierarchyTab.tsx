import { useRecordContext } from "react-admin";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { BranchLocationsSection } from "./BranchLocationsSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { Company } from "../types";

/**
 * Tab component for managing organization hierarchy
 * Includes parent organization selection and branch locations display
 * Used in the Organization Edit form
 */
export const OrganizationHierarchyTab = () => {
  const record = useRecordContext<Company>();

  if (!record) {
    return null;
  }

  const hasBranches = (record as any).child_branch_count > 0;

  return (
    <div className="space-y-6">
      {/* Information about hierarchy */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Organizations can be structured hierarchically with parent-child relationships. This helps
          track multi-location businesses, franchise operations, and corporate structures.
        </AlertDescription>
      </Alert>

      {/* Parent Organization Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Parent Organization</h3>
        <p className="text-sm text-muted-foreground mb-4">
          If this organization is a branch, subsidiary, or division of another organization, select
          the parent organization below.
        </p>
        <ParentOrganizationInput />
      </div>

      {/* Branch Locations Display (only show for organizations with branches) */}
      {hasBranches && (
        <div>
          <h3 className="text-lg font-medium mb-4">Branch Locations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This organization has the following branch locations:
          </p>
          <BranchLocationsSection />
        </div>
      )}

      {/* Hierarchy Rules */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Hierarchy Rules:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Organizations can have only one parent</li>
          <li>• Maximum depth is two levels (no grandchildren)</li>
          <li>• Circular references are not allowed</li>
          <li>• Organizations with branches cannot be deleted</li>
          <li>• Only distributor, customer, and principal types can be parents</li>
        </ul>
      </div>
    </div>
  );
};
