import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGetIdentity, useListFilterContext } from "ra-core";

export const OnlyMineInput = (_: { alwaysOn: boolean; source: string }) => {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const { data: identity } = useGetIdentity();

  const handleChange = () => {
    const newFilterValues = { ...filterValues };
    if (typeof filterValues.opportunity_owner_id !== "undefined") {
      delete newFilterValues.opportunity_owner_id;
    } else {
      newFilterValues.opportunity_owner_id = identity && identity?.id;
    }
    setFilters(newFilterValues, displayedFilters);
  };
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="only-mine"
        checked={typeof filterValues.opportunity_owner_id !== "undefined"}
        onCheckedChange={handleChange}
      />
      <Label htmlFor="only-mine">Only opportunities I manage</Label>
    </div>
  );
};
