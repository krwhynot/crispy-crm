import { memo } from "react";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import type { OrganizationRecord } from "./types";

/**
 * OrganizationHierarchyChips - Inline context chips for hierarchy relationships
 *
 * Renders 0-2 small badges after the org name in the datagrid:
 *
 * 1. Parent chip (if org has a parent):
 *    - Shows "Parent: {name}" (truncated)
 *    - Click: filters list to siblings (same parent_organization_id)
 *
 * 2. Branches chip (if org has children):
 *    - Shows "{N} branches" or "1 branch"
 *    - Click: filters list to children (parent_organization_id = this org)
 *
 * Both chips use FilterableBadge for click-to-filter with toggle,
 * aria-pressed, stopPropagation, and ring highlight.
 */
export const OrganizationHierarchyChips = memo(function OrganizationHierarchyChips({
  record,
}: {
  record: OrganizationRecord;
}) {
  const hasParent =
    record.parent_organization_id != null &&
    record.parent_organization_name != null &&
    record.parent_organization_name !== "";
  const branchCount = record.child_branch_count ?? 0;
  const hasBranches = branchCount > 0;

  if (!hasParent && !hasBranches) return null;

  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0">
      {hasParent && (
        <FilterableBadge
          source="parent_organization_id"
          value={String(record.parent_organization_id)}
          label={`Parent: ${record.parent_organization_name}`}
        >
          <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 truncate max-w-[160px]">
            Parent: {record.parent_organization_name}
          </span>
        </FilterableBadge>
      )}
      {hasBranches && (
        <FilterableBadge
          source="parent_organization_id"
          value={String(record.id)}
          label={`${branchCount} ${branchCount === 1 ? "branch" : "branches"}`}
        >
          <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 whitespace-nowrap">
            {branchCount} {branchCount === 1 ? "branch" : "branches"}
          </span>
        </FilterableBadge>
      )}
    </span>
  );
});
