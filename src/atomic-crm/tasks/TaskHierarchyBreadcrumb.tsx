import { useGetOne } from "react-admin";
import type { RaRecord, Identifier } from "react-admin";
import { Building2, Target, CheckSquare, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Use RaRecord-compatible types for fetched records
interface OpportunityRecord extends RaRecord {
  name?: string;
}

interface OrganizationRecord extends RaRecord {
  name?: string;
}

interface TaskHierarchyBreadcrumbProps {
  record: RaRecord & {
    title?: string;
    opportunity_id?: Identifier;
    organization_id?: Identifier;
  };
}

/**
 * Breadcrumb showing Task's parent hierarchy
 * Priority order (first matching relationship):
 * - Opportunity: "Opportunity Name > Task Title"
 * - Organization: "Organization Name > Task Title"
 *
 * Links open the parent entity's slide-over.
 * Used in TaskSlideOver header for context and quick navigation.
 */
export function TaskHierarchyBreadcrumb({ record }: TaskHierarchyBreadcrumbProps) {
  // Fetch opportunity if linked
  const { data: opportunity, isLoading: loadingOpp } = useGetOne<OpportunityRecord>(
    "opportunities",
    { id: record.opportunity_id! },
    { enabled: !!record.opportunity_id }
  );

  // Fetch organization if linked (and no opportunity)
  const { data: organization, isLoading: loadingOrg } = useGetOne<OrganizationRecord>(
    "organizations",
    { id: record.organization_id! },
    { enabled: !!record.organization_id && !record.opportunity_id }
  );

  // Don't show breadcrumb if no parent or still loading
  const hasOpportunity = !!record.opportunity_id && opportunity;
  const hasOrganization = !!record.organization_id && organization && !record.opportunity_id;

  if (loadingOpp || loadingOrg) {
    return null;
  }

  if (!hasOpportunity && !hasOrganization) {
    return null;
  }

  return (
    <nav
      aria-label="Task hierarchy"
      className="flex items-center gap-2 text-xs text-muted-foreground/70 -ml-2"
    >
      {/* Parent link with 44px touch target (WCAG AA) */}
      {hasOpportunity && (
        <Link
          to={`/opportunities?view=${opportunity.id}`}
          className="inline-flex items-center gap-1.5 min-h-11 px-2 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors truncate max-w-[200px]"
          title={opportunity.name || `Opportunity #${opportunity.id}`}
        >
          <Target className="h-4 w-4 shrink-0" />
          {opportunity.name || `Opportunity #${opportunity.id}`}
        </Link>
      )}

      {hasOrganization && (
        <Link
          to={`/organizations?view=${organization.id}`}
          className="inline-flex items-center gap-1.5 min-h-11 px-2 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors truncate max-w-[200px]"
          title={organization.name || `Organization #${organization.id}`}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          {organization.name || `Organization #${organization.id}`}
        </Link>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <span className="flex items-center gap-1.5 min-h-11 px-2 text-foreground font-medium truncate">
        <CheckSquare className="h-4 w-4 shrink-0" />
        {record.title || `Task #${record.id}`}
      </span>
    </nav>
  );
}
