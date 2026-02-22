import { memo } from "react";
import { CornerDownRight } from "lucide-react";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import type { OrganizationRecord } from "./types";

/**
 * OrganizationHierarchyChips - Inline context chips for hierarchy relationships
 *
 * Renders 0-2 small badges after the org name in the datagrid:
 *
 * 1. Parent chip (if org has a parent):
 *    - Default mode: Shows "Parent: {name}" (truncated) - used in cards
 *    - listCompact mode: Shows icon + name (no prefix) - used in list table
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
  parentClassName,
  parentDisplayMode = "default",
}: {
  record: OrganizationRecord;
  parentClassName?: string;
  parentDisplayMode?: "default" | "listCompact";
}) {
  const hasParent =
    record.parent_organization_id != null &&
    record.parent_organization_name != null &&
    record.parent_organization_name !== "";
  const branchCount = record.child_branch_count ?? 0;
  const hasBranches = branchCount > 0;

  if (!hasParent && !hasBranches) return null;

  const isCompact = parentDisplayMode === "listCompact";

  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0">
      {hasParent && (
        <FilterableBadge
          source="parent_organization_id"
          value={String(record.parent_organization_id)}
          label={record.parent_organization_name!}
          className={parentClassName}
        >
          <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 truncate max-w-[160px] inline-flex items-center gap-1">
            {isCompact ? (
              <>
                <CornerDownRight
                  className="h-3 w-3 flex-shrink-0"
                  aria-hidden="true"
                  data-testid="hierarchy-parent-icon"
                />
                {record.parent_organization_name}
              </>
            ) : (
              <>Parent: {record.parent_organization_name}</>
            )}
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
