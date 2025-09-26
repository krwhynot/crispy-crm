import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import type { Company, OrganizationType } from "../types";

// Organization type display names
const organizationTypeLabels: Record<OrganizationType, string> = {
  customer: 'Customer',
  prospect: 'Prospect',
  vendor: 'Vendor',
  partner: 'Partner',
  principal: 'Principal',
  distributor: 'Distributor',
  unknown: 'Unknown',
};

// Priority colors for visual distinction
const priorityColors = {
  A: 'bg-red-500 text-white hover:bg-red-600',
  B: 'bg-orange-500 text-white hover:bg-orange-600',
  C: 'bg-yellow-500 text-black hover:bg-yellow-600',
  D: 'bg-green-500 text-white hover:bg-green-600',
};

export const OrganizationType = () => {
  const record = useRecordContext<Company>();
  if (!record) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Organization Type */}
      {record.organization_type && (
        <span className="text-sm font-medium text-muted-foreground">
          {organizationTypeLabels[record.organization_type] || record.organization_type}
        </span>
      )}

      {/* Priority Badge */}
      {record.priority && (
        <Badge
          className={priorityColors[record.priority] || 'bg-gray-200 text-gray-800'}
          variant="default"
        >
          Priority {record.priority}
        </Badge>
      )}

      {/* Segment */}
      {record.segment && (
        <span className="text-sm text-muted-foreground">
          • {record.segment}
        </span>
      )}

      {/* Special Flags */}
      {record.is_principal && (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          Principal
        </Badge>
      )}

      {record.is_distributor && (
        <Badge variant="outline" className="border-purple-500 text-purple-500">
          Distributor
        </Badge>
      )}
    </div>
  );
};

// Export for use in list views with simplified display
export const OrganizationTypeChip = () => {
  const record = useRecordContext<Company>();
  if (!record?.organization_type) return null;

  return (
    <Badge variant="secondary" className="text-xs">
      {organizationTypeLabels[record.organization_type]}
    </Badge>
  );
};

// Export for priority display in list views
export const OrganizationPriorityChip = () => {
  const record = useRecordContext<Company>();
  if (!record?.priority) return null;

  return (
    <Badge
      className={`${priorityColors[record.priority] || 'bg-gray-200 text-gray-800'} text-xs`}
      variant="default"
    >
      {record.priority}
    </Badge>
  );
};