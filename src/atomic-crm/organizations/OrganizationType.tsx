import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import type { Company, OrganizationType } from "../types";

// Organization type display names
const organizationTypeLabels: Record<OrganizationType, string> = {
  customer: "Customer",
  prospect: "Prospect",
  principal: "Principal",
  distributor: "Distributor",
  unknown: "Unknown",
};

// Organization type colors using MFB Garden to Table theme
const organizationTypeColors: Record<OrganizationType, string> = {
  customer: "bg-[color:var(--tag-warm-bg)] text-[color:var(--tag-warm-fg)]",
  prospect: "bg-[color:var(--tag-sage-bg)] text-[color:var(--tag-sage-fg)]",
  principal: "bg-[color:var(--tag-purple-bg)] text-[color:var(--tag-purple-fg)]",
  distributor: "bg-[color:var(--tag-teal-bg)] text-[color:var(--tag-teal-fg)]",
  unknown: "bg-[color:var(--tag-gray-bg)] text-[color:var(--tag-gray-fg)]",
};

// Priority colors for visual distinction using semantic state colors
// Follows urgency spectrum: Red (high) → Amber (medium-high) → Gray (medium) → Light gray (low)
const priorityColors = {
  A: "bg-destructive text-white hover:bg-destructive/90",                          // High priority: Red
  B: "border-transparent bg-[var(--warning-default)] text-white hover:bg-[var(--warning-hover)]",  // Medium-High: Amber
  C: "bg-secondary text-secondary-foreground hover:bg-secondary/90",               // Medium: Neutral gray
  D: "bg-muted text-[color:var(--text-subtle)] hover:bg-muted/90",                // Low: Light gray
};

export const OrganizationType = () => {
  const record = useRecordContext<Company>();
  if (!record) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Organization Type */}
      {record.organization_type && (
        <Badge
          className={`text-xs px-2 py-0.5 ${organizationTypeColors[record.organization_type] || organizationTypeColors.unknown}`}
        >
          {organizationTypeLabels[record.organization_type] ||
            record.organization_type}
        </Badge>
      )}

      {/* Priority Badge */}
      {record.priority && (
        <Badge
          className={
            priorityColors[record.priority] || "bg-muted text-[color:var(--text-subtle)]"
          }
          variant="default"
        >
          Priority {record.priority}
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
    <Badge
      className={`text-xs px-1 py-0 ${organizationTypeColors[record.organization_type] || organizationTypeColors.unknown}`}
    >
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
      className={`${priorityColors[record.priority] || "bg-muted text-[color:var(--text-subtle)]"} text-xs`}
      variant="default"
    >
      {record.priority}
    </Badge>
  );
};
