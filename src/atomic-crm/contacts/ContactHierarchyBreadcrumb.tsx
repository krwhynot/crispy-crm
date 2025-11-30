import { useGetOne } from "react-admin";
import { Building2, ChevronRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { Contact, Organization } from "../types";

interface ContactHierarchyBreadcrumbProps {
  record: Contact;
}

/**
 * Breadcrumb showing Contact's organization hierarchy
 * Displays: Organization Name > Contact Name
 *
 * The organization link opens the organization slide-over.
 * Used in ContactSlideOver header for context and quick navigation.
 */
export function ContactHierarchyBreadcrumb({ record }: ContactHierarchyBreadcrumbProps) {
  // Fetch the organization for this contact
  const { data: organization, isLoading } = useGetOne<Organization>(
    "organizations",
    { id: record.organization_id },
    { enabled: !!record.organization_id }
  );

  // Don't show breadcrumb if no organization or still loading
  if (!record.organization_id || isLoading || !organization) {
    return null;
  }

  const contactName = [record.first_name, record.last_name].filter(Boolean).join(" ");

  return (
    <nav aria-label="Contact hierarchy" className="flex items-center gap-1.5 text-sm">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />

      <Link
        to={`/organizations?view=${organization.id}`}
        className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]"
        title={organization.name}
      >
        {organization.name}
      </Link>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <span className="flex items-center gap-1 text-foreground font-medium truncate">
        <User className="h-3.5 w-3.5 shrink-0" />
        {contactName || `Contact #${record.id}`}
      </span>
    </nav>
  );
}
