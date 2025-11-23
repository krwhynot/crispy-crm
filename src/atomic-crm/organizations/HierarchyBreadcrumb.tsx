import { useGetOne, useRecordContext, useCreatePath } from "react-admin";
import { ChevronRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Company } from "../types";

/**
 * Component displaying organization hierarchy breadcrumb
 * Shows: Organizations > Parent Organization > Current Organization
 * Used for navigating organization hierarchy
 */
export const HierarchyBreadcrumb = () => {
  const record = useRecordContext<Company>();
  const createPath = useCreatePath();

  // Fetch parent organization if it exists
  const { data: parent, isLoading } = useGetOne<Company>(
    "organizations",
    { id: record?.parent_organization_id },
    { enabled: !!record?.parent_organization_id }
  );

  if (!record || isLoading) {
    return null;
  }

  // If no parent, just show current organization
  if (!record.parent_organization_id || !parent) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Building2 className="h-4 w-4" />

      <Link
        to={createPath({
          resource: "organizations",
          type: "list",
        })}
        className="hover:text-primary transition-colors"
      >
        Organizations
      </Link>

      <ChevronRight className="h-4 w-4" />

      <Link
        to={createPath({
          resource: "organizations",
          type: "edit",
          id: parent.id,
        })}
        className="hover:text-primary transition-colors"
      >
        {parent.name}
      </Link>

      <ChevronRight className="h-4 w-4" />

      <span className="text-foreground font-medium">{record.name}</span>
    </div>
  );
};
