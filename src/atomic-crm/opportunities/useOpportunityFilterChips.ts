import { useListContext } from "ra-core";
import { useGetList, useGetIdentity } from "ra-core";
import { formatName } from "../utils/formatName";
import { OPPORTUNITY_STAGE_CHOICES } from "./constants/stageConstants";
import { priorityChoices } from "./constants/priorityChoices";

export interface FilterChip {
  key: string;
  label: string;
  value: any;
  displayValue: string;
}

export interface UseOpportunityFilterChipsResult {
  chips: FilterChip[];
  removeFilterValue: (key: string, value: any) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

interface FilterChipInternal {
  key: string;
  value: any;
  label: string;
  category: string;
}

const stageMap = OPPORTUNITY_STAGE_CHOICES.reduce(
  (acc, stage) => {
    acc[stage.id] = stage.name;
    return acc;
  },
  {} as Record<string, string>
);

const priorityMap = priorityChoices.reduce(
  (acc, priority) => {
    acc[priority.id] = priority.name;
    return acc;
  },
  {} as Record<string, string>
);

export function useOpportunityFilterChips(): UseOpportunityFilterChipsResult {
  const { filterValues, setFilters } = useListContext();
  const { data: identity } = useGetIdentity();

  const principalOrgId = filterValues?.principal_organization_id;
  const { data: principalOrgData } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 1 },
      filter: principalOrgId ? { id: principalOrgId } : {},
    },
    { enabled: !!principalOrgId }
  );

  const customerOrgId = filterValues?.customer_organization_id;
  const { data: customerOrgData } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 1 },
      filter: customerOrgId ? { id: customerOrgId } : {},
    },
    { enabled: !!customerOrgId }
  );

  const ownerId = filterValues?.opportunity_owner_id;
  const { data: ownerData } = useGetList(
    "sales",
    {
      pagination: { page: 1, perPage: 1 },
      filter: ownerId ? { id: ownerId } : {},
    },
    { enabled: !!ownerId }
  );

  const getPrincipalOrgName = (): string => {
    const org = principalOrgData?.[0];
    return org?.name || `Org #${principalOrgId}`;
  };

  const getCustomerOrgName = (): string => {
    const org = customerOrgData?.[0];
    return org?.name || `Org #${customerOrgId}`;
  };

  const getOwnerName = (): string => {
    if (ownerId === identity?.id) {
      return "Me";
    }
    const owner = ownerData?.[0];
    return owner ? formatName(owner.first_name, owner.last_name) : "Unknown";
  };

  const chips: FilterChipInternal[] = [];

  if (filterValues?.q) {
    chips.push({
      key: "q",
      value: filterValues.q,
      label: `"${filterValues.q}"`,
      category: "Search",
    });
  }

  if (filterValues?.stage) {
    const stageArray = Array.isArray(filterValues.stage)
      ? filterValues.stage
      : [filterValues.stage];
    stageArray.forEach((stageId) => {
      const label = stageMap[stageId] || stageId;
      chips.push({
        key: "stage",
        value: stageId,
        label,
        category: "Stage",
      });
    });
  }

  if (filterValues?.priority) {
    const priorityArray = Array.isArray(filterValues.priority)
      ? filterValues.priority
      : [filterValues.priority];
    priorityArray.forEach((priorityId) => {
      const label = priorityMap[priorityId] || priorityId;
      chips.push({
        key: "priority",
        value: priorityId,
        label,
        category: "Priority",
      });
    });
  }

  if (filterValues?.principal_organization_id) {
    chips.push({
      key: "principal_organization_id",
      value: filterValues.principal_organization_id,
      label: getPrincipalOrgName(),
      category: "Principal",
    });
  }

  if (filterValues?.customer_organization_id) {
    chips.push({
      key: "customer_organization_id",
      value: filterValues.customer_organization_id,
      label: getCustomerOrgName(),
      category: "Customer",
    });
  }

  if (filterValues?.campaign) {
    chips.push({
      key: "campaign",
      value: filterValues.campaign,
      label: filterValues.campaign,
      category: "Campaign",
    });
  }

  if (filterValues?.opportunity_owner_id) {
    chips.push({
      key: "opportunity_owner_id",
      value: filterValues.opportunity_owner_id,
      label: getOwnerName(),
      category: "Owner",
    });
  }

  const removeFilterValue = (key: string, value: any) => {
    const newFilters = { ...filterValues };

    if (key === "stage" && Array.isArray(newFilters.stage)) {
      newFilters.stage = newFilters.stage.filter((id: any) => String(id) !== String(value));
      if (newFilters.stage.length === 0) {
        delete newFilters.stage;
      }
    } else if (key === "priority" && Array.isArray(newFilters.priority)) {
      newFilters.priority = newFilters.priority.filter((id: any) => String(id) !== String(value));
      if (newFilters.priority.length === 0) {
        delete newFilters.priority;
      }
    } else {
      delete newFilters[key];
    }

    setFilters(newFilters, {});
  };

  const clearAllFilters = () => {
    setFilters({}, {});
  };

  return {
    chips: chips.map((chip) => ({
      key: chip.key,
      label: chip.label,
      value: chip.value,
      displayValue: `${chip.category}: ${chip.label}`,
    })),
    removeFilterValue,
    clearAllFilters,
    hasActiveFilters: chips.length > 0,
  };
}
