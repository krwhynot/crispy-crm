import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUserRole } from "@/hooks/useUserRole";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useGetIdentity, useListFilterContext } from "ra-core";

interface OwnerFilterDropdownProps {
  source: string;
  secondarySource?: string;
  label?: string;
}

/**
 * Pattern G - Role-based owner filter (KEPT SEPARATE by design)
 *
 * This component has role-based UI logic that should NOT be abstracted:
 * - Rep: Sees Switch toggle ("My Items" on/off)
 * - Manager/Admin: Sees Select dropdown with team members
 *
 * The role-based split IS the business logic. Don't try to make
 * a generic component "role-aware" -- keep the decision explicit.
 *
 * When secondarySource is provided, "My Items" uses $or filter to match
 * records where the user is either primary or secondary account manager.
 */
export const OwnerFilterDropdown = ({
  source,
  secondarySource,
  label = "Owner",
}: OwnerFilterDropdownProps) => {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const { data: identity } = useGetIdentity();
  const { isRep } = useUserRole();
  const { teamMembers } = useTeamMembers();

  const currentUserId = identity?.id;

  // Detect if "my items" is active (check both direct source and $or)
  const isMyItemsActive = (() => {
    if (filterValues[source] === currentUserId) return true;
    if (secondarySource && Array.isArray(filterValues.$or)) {
      return filterValues.$or.some(
        (cond: Record<string, unknown>) => cond[source] === currentUserId
      );
    }
    return false;
  })();

  const handleRepToggle = () => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[source];
    delete newFilterValues.$or;

    if (!isMyItemsActive) {
      // Turning ON
      if (secondarySource) {
        newFilterValues.$or = [{ [source]: currentUserId }, { [secondarySource]: currentUserId }];
      } else {
        newFilterValues[source] = currentUserId;
      }
    }
    setFilters(newFilterValues, displayedFilters);
  };

  const handleManagerSelectChange = (value: string) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[source];
    delete newFilterValues.$or;

    if (value === "mine") {
      if (secondarySource) {
        newFilterValues.$or = [{ [source]: currentUserId }, { [secondarySource]: currentUserId }];
      } else {
        newFilterValues[source] = currentUserId;
      }
    } else if (value !== "all") {
      // Specific team member -- direct source only
      newFilterValues[source] = value;
    }
    // "all" -- we already deleted both keys

    setFilters(newFilterValues, displayedFilters);
  };

  if (isRep) {
    return (
      <div className="flex items-center space-x-2">
        <Switch
          id={`${source}-owner-filter`}
          checked={isMyItemsActive}
          onCheckedChange={handleRepToggle}
          aria-label={`Filter by my ${label.toLowerCase()}`}
        />
        <Label htmlFor={`${source}-owner-filter`}>My Items</Label>
      </div>
    );
  }

  const getSelectValue = () => {
    if (isMyItemsActive) return "mine";
    const directValue = filterValues[source];
    if (typeof directValue !== "undefined") return String(directValue);
    return "all";
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor={`${source}-owner-select`}>{label}:</Label>
      <Select value={getSelectValue()} onValueChange={handleManagerSelectChange}>
        <SelectTrigger
          id={`${source}-owner-select`}
          aria-label={`Filter by ${label.toLowerCase()}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mine">My Items</SelectItem>
          <SelectItem value="all">All</SelectItem>
          <SelectSeparator />
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={String(member.id)}>
              {member.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
