/**
 * HierarchyBreadcrumb Component
 *
 * Displays breadcrumb navigation for organization hierarchies.
 * Shows: Organizations > Parent > Current
 *
 * - Returns null if organization has no parent (no hierarchy)
 * - Parent name is clickable, navigates to parent organization
 * - Current organization name is not clickable
 */

import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { OrganizationWithHierarchy } from "../types";

interface HierarchyBreadcrumbProps {
  organization: OrganizationWithHierarchy;
}

const HierarchyBreadcrumb = ({
  organization,
}: HierarchyBreadcrumbProps) => {
  const navigate = useNavigate();

  // Return null if no parent organization
  if (!organization.parent_organization_id) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Organizations link */}
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => navigate("/organizations")}
            className="cursor-pointer"
          >
            Organizations
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Parent organization link */}
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() =>
              navigate(`/organizations/${organization.parent_organization_id}`)
            }
            className="cursor-pointer"
          >
            {organization.parent_organization_name}
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Current organization (not clickable) */}
        <BreadcrumbItem>
          <BreadcrumbPage>{organization.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default HierarchyBreadcrumb;
