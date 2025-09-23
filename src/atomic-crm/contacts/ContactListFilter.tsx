import { Badge } from "@/components/ui/badge";
import { endOfYesterday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Building2, CheckSquare, Clock, Tag, TrendingUp, Users } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList } from "ra-core";
import { cn } from "@/lib/utils";

import { ToggleFilterButton, SearchInput } from "@/components/admin";
import { FilterCategory } from "../filters/FilterCategory";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { getTagColorClass } from "../tags/tag-colors";

export const ContactListFilter = () => {
  const { noteStatuses } = useConfigurationContext();
  const { identity } = useGetIdentity();
  const { data } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  return (
    <div className="w-52 min-w-52 order-first pt-0.75 flex flex-col gap-4">
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search name, company..." />
      </FilterLiveForm>

      <FilterCategory label="Last activity" icon={<Clock />}>
        <ToggleFilterButton
          className="w-full justify-between"
          label="Today"
          value={{
            "last_seen@gte": endOfYesterday().toISOString(),
            "last_seen@lte": undefined,
          }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="This week"
          value={{
            "last_seen@gte": startOfWeek(new Date()).toISOString(),
            "last_seen@lte": undefined,
          }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Before this week"
          value={{
            "last_seen@gte": undefined,
            "last_seen@lte": startOfWeek(new Date()).toISOString(),
          }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Before this month"
          value={{
            "last_seen@gte": undefined,
            "last_seen@lte": startOfMonth(new Date()).toISOString(),
          }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Before last month"
          value={{
            "last_seen@gte": undefined,
            "last_seen@lte": subMonths(
              startOfMonth(new Date()),
              1,
            ).toISOString(),
          }}
        />
      </FilterCategory>

      <FilterCategory label="Status" icon={<TrendingUp />}>
        {noteStatuses.map((status) => (
          <ToggleFilterButton
            key={status.value}
            className="w-full justify-between"
            label={
              <span>
                {status.label} <Status status={status.value} />
              </span>
            }
            value={{ status: status.value }}
          />
        ))}
      </FilterCategory>

      <FilterCategory label="Tags" icon={<Tag />}>
        {data &&
          data.map((record) => (
            <ToggleFilterButton
              className="w-full justify-between"
              key={record.id}
              label={
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-normal cursor-pointer",
                    getTagColorClass(record?.color)
                  )}
                >
                  {record?.name}
                </Badge>
              }
              value={{ "tags@cs": `{${record.id}}` }}
            />
          ))}
      </FilterCategory>

      <FilterCategory icon={<CheckSquare className="h-4 w-4" />} label="Tasks">
        <ToggleFilterButton
          className="w-full justify-between"
          label={"With pending tasks"}
          value={{ "nb_tasks@gt": 0 }}
        />
      </FilterCategory>

      <FilterCategory icon={<TrendingUp />} label="Role">
        <ToggleFilterButton
          className="w-full justify-between"
          label="Decision Maker"
          value={{ role: "decision_maker" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Influencer"
          value={{ role: "influencer" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Champion"
          value={{ role: "champion" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Executive"
          value={{ role: "executive" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Primary Contact"
          value={{ is_primary_contact: true }}
        />
      </FilterCategory>

      <FilterCategory icon={<Building2 className="h-4 w-4" />} label="Influence">
        <ToggleFilterButton
          className="w-full justify-between"
          label="High Influence"
          value={{ purchase_influence: "High" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Medium Influence"
          value={{ purchase_influence: "Medium" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Low Influence"
          value={{ purchase_influence: "Low" }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Multiple Organizations"
          value={{ "total_organizations@gt": 1 }}
        />
      </FilterCategory>

      <FilterCategory
        icon={<Users className="h-4 w-4" />}
        label="Account Manager"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label={"Me"}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </div>
  );
};
