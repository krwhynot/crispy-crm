import { useGetOne } from "react-admin";
import { Building2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { OrganizationRecord } from "./types";
import type { Organization } from "../types";

interface OrganizationHierarchyBreadcrumbProps {
  record: OrganizationRecord;
}

/**
 * Breadcrumb showing Organization's parent hierarchy
 * Displays: Parent Organization Name > Current Organization Name
 *
 * The parent organization link opens its slide-over.
 * Used in OrganizationSlideOver header for hierarchical context and navigation.
 */
export function OrganizationHierarchyBreadcrumb({ record }: OrganizationHierarchyBreadcrumbProps) {
  // Fetch the parent organization if this org has one
  const { data: parentOrg, isLoading } = useGetOne<Organization>(
    "organizations",
    { id: record.parent_organization_id! },
    { enabled: !!record.parent_organization_id }
  );

  // Don't show breadcrumb if no parent organization or still loading
  if (!record.parent_organization_id || isLoading || !parentOrg) {
    return null;
  }

  return (
    <nav
      aria-label="Organization hierarchy"
      className="flex items-center gap-2 text-xs text-muted-foreground/70 -ml-2"
    >
      {/* Parent organization link with 44px touch target (WCAG AA) */}
      <Link
        to={`/organizations?view=${parentOrg.id}`}
        className="inline-flex items-center gap-1.5 min-h-11 px-2 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors truncate max-w-[200px]"
        title={parentOrg.name}
      >
        <Building2 className="h-4 w-4 shrink-0" />
        {parentOrg.name}
      </Link>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <span className="flex items-center gap-1.5 min-h-11 px-2 text-foreground font-medium truncate">
        <Building2 className="h-4 w-4 shrink-0" />
        {record.name || `Organization #${record.id}`}
      </span>
    </nav>
  );
}
