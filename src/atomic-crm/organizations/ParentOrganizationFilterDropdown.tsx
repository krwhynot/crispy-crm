import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetList, useListFilterContext } from "ra-core";

/**
 * ParentOrganizationFilterDropdown - Sidebar filter for parent organization hierarchy
 *
 * Options:
 * - "All" — no parent filter (default)
 * - "Has parent" — shows only orgs with a parent connection (PostgREST: parent_organization_id=not.is.null)
 * - Specific parent — shows children of a selected parent org (parent_organization_id=<id>)
 *
 * Note: Uses string "null" (not JS null) because React Admin's removeEmpty strips JS null from setFilters.
 *
 * Parent candidates are fetched via useGetList with child_branch_count > 0 filter.
 */
export const ParentOrganizationFilterDropdown = () => {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();

  // Fetch organizations that are actual parents (have at least one child branch)
  const { data: parentOrgs = [], isPending } = useGetList("organizations", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
    filter: { "child_branch_count@gt": 0 },
  });

  // Determine current state from filterValues
  const getCurrentValue = (): string => {
    // Check for "has parent" toggle (PostgREST operator syntax)
    if (filterValues["parent_organization_id@not.is"] === "null") return "has_parent";
    // Check for specific parent ID
    const parentId = filterValues.parent_organization_id;
    if (parentId) return String(parentId);
    return "all";
  };

  const handleChange = (value: string) => {
    const newFilterValues = { ...filterValues };

    // Clear both filter keys before setting new one
    delete newFilterValues.parent_organization_id;
    delete newFilterValues["parent_organization_id@not.is"];

    if (value === "has_parent") {
      // PostgREST: parent_organization_id IS NOT NULL
      newFilterValues["parent_organization_id@not.is"] = "null";
    } else if (value !== "all") {
      // Specific parent org ID
      newFilterValues.parent_organization_id = value;
    }
    // "all" — both keys already deleted

    setFilters(newFilterValues, displayedFilters);
  };

  return (
    <Select value={getCurrentValue()} onValueChange={handleChange}>
      <SelectTrigger className="w-full" aria-label="Filter by parent organization">
        <SelectValue placeholder={isPending ? "Loading..." : "All organizations"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All organizations</SelectItem>
        <SelectItem value="has_parent">Has parent connection</SelectItem>
        {parentOrgs.length > 0 && <SelectSeparator />}
        {parentOrgs.map((org) => (
          <SelectItem key={org.id} value={String(org.id)}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
