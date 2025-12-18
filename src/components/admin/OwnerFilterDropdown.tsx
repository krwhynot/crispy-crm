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
  label?: string;
}

export const OwnerFilterDropdown = ({ source, label = "Owner" }: OwnerFilterDropdownProps) => {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const { data: identity } = useGetIdentity();
  const { isRep } = useUserRole();
  const { teamMembers } = useTeamMembers();

  const currentUserId = identity?.id;
  const currentFilterValue = filterValues[source];

  const handleRepToggle = () => {
    const newFilterValues = { ...filterValues };
    if (typeof currentFilterValue !== "undefined") {
      delete newFilterValues[source];
    } else {
      newFilterValues[source] = currentUserId;
    }
    setFilters(newFilterValues, displayedFilters);
  };

  const handleManagerSelectChange = (value: string) => {
    if (value === "all") {
      const { [source]: _, ...rest } = filterValues;
      setFilters(rest, displayedFilters);
    } else if (value === "mine") {
      setFilters({ ...filterValues, [source]: currentUserId }, displayedFilters);
    } else {
      setFilters({ ...filterValues, [source]: value }, displayedFilters);
    }
  };

  if (isRep) {
    return (
      <div className="flex items-center space-x-2">
        <Switch
          id={`${source}-owner-filter`}
          checked={typeof currentFilterValue !== "undefined"}
          onCheckedChange={handleRepToggle}
          aria-label={`Filter by my ${label.toLowerCase()}`}
        />
        <Label htmlFor={`${source}-owner-filter`}>My Items</Label>
      </div>
    );
  }

  const getSelectValue = () => {
    if (typeof currentFilterValue === "undefined") {
      return "all";
    }
    if (currentFilterValue === currentUserId) {
      return "mine";
    }
    return String(currentFilterValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor={`${source}-owner-select`}>{label}:</Label>
      <Select value={getSelectValue()} onValueChange={handleManagerSelectChange}>
        <SelectTrigger id={`${source}-owner-select`} aria-label={`Filter by ${label.toLowerCase()}`}>
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
