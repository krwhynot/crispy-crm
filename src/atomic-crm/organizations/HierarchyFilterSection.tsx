import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useListContext } from "ra-core";
import { isMatch, pickBy } from "es-toolkit/compat";
import { CircleX } from "lucide-react";
import { FilterCategory } from "../filters/FilterCategory";
import { HIERARCHY_FILTERS } from "./constants";

/**
 * Conflict keys for mutual exclusion between hierarchy toggles.
 * When toggling ON a filter, its conflictKeys are removed from filterValues first.
 *
 * "Has parent" and "Root orgs" are logically exclusive:
 * an org can't both have and not have a parent.
 * The plain `parent_organization_id` key (from chip clicks) is also
 * cleared because "children of X" contradicts both toggles semantically.
 */
const CONFLICT_KEYS: Record<string, string[]> = {
  "parent_organization_id@not.is": ["parent_organization_id@is", "parent_organization_id"],
  "parent_organization_id@is": ["parent_organization_id@not.is", "parent_organization_id"],
};

/**
 * MutualExclusiveToggle - Toggle filter button with conflict key clearing
 *
 * Like ToggleFilterButton but removes conflicting filter keys before applying.
 * Reuses isMatch from es-toolkit for selection detection (same as ToggleFilterButton).
 */
function MutualExclusiveToggle({
  label,
  value,
  conflictKeys = [],
}: {
  label: string;
  value: Record<string, unknown>;
  conflictKeys?: string[];
}) {
  const { filterValues, setFilters } = useListContext();
  const currentFilters = filterValues || {};

  const isSelected = isMatch(
    currentFilters,
    pickBy(value, (val) => typeof val !== "undefined")
  );

  const handleClick = () => {
    if (isSelected) {
      // Toggle OFF: remove this filter's keys
      const keysToRemove = Object.keys(value);
      const next = Object.keys(currentFilters).reduce(
        (acc, key) => (keysToRemove.includes(key) ? acc : { ...acc, [key]: currentFilters[key] }),
        {} as Record<string, unknown>
      );
      setFilters(next);
    } else {
      // Toggle ON: remove conflict keys first, then apply value
      const allKeysToRemove = new Set(conflictKeys);
      const cleaned = Object.keys(currentFilters).reduce(
        (acc, key) => (allKeysToRemove.has(key) ? acc : { ...acc, [key]: currentFilters[key] }),
        {} as Record<string, unknown>
      );
      setFilters({ ...cleaned, ...value });
    }
  };

  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      onClick={handleClick}
      aria-pressed={isSelected}
      className={cn(
        "cursor-pointer",
        "flex flex-row items-center gap-2 px-2.5",
        "min-w-0 w-full justify-between"
      )}
      size="sm"
    >
      <span className="truncate">{label}</span>
      {isSelected && <CircleX className="h-4 w-4 opacity-50 flex-shrink-0" />}
    </Button>
  );
}

/**
 * HierarchyFilterSection - Sidebar section with hierarchy toggle filters
 *
 * Provides 3 toggles:
 * - "Has branches" — orgs with child_branch_count > 0
 * - "Has parent" — orgs with a parent_organization_id
 * - "Root orgs" — orgs without a parent (top-level)
 *
 * "Has parent" and "Root orgs" are mutually exclusive — activating one
 * clears the other via MutualExclusiveToggle.
 */
export function HierarchyFilterSection() {
  const { filterValues } = useListContext();

  const hasActiveHierarchyFilter =
    filterValues?.["child_branch_count@gt"] !== undefined ||
    filterValues?.["parent_organization_id@not.is"] !== undefined ||
    filterValues?.["parent_organization_id@is"] !== undefined;

  return (
    <FilterCategory
      icon={<GitBranch className="h-4 w-4" />}
      label="Hierarchy"
      hasActiveFilters={hasActiveHierarchyFilter}
    >
      <MutualExclusiveToggle
        label="Has branches"
        value={HIERARCHY_FILTERS.HAS_BRANCHES}
      />
      <MutualExclusiveToggle
        label="Has parent"
        value={HIERARCHY_FILTERS.HAS_PARENT}
        conflictKeys={CONFLICT_KEYS["parent_organization_id@not.is"] ?? []}
      />
      <MutualExclusiveToggle
        label="Root orgs"
        value={HIERARCHY_FILTERS.ROOT_ONLY}
        conflictKeys={CONFLICT_KEYS["parent_organization_id@is"] ?? []}
      />
    </FilterCategory>
  );
}
