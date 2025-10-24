import { useListContext } from "ra-core";
import { useGetList } from "ra-core";
import { formatName } from "../utils/formatName";

interface FilterChip {
  key: string;
  value: any;
  label: string;
  category: string;
}

const organizationTypeMap = {
  customer: "Customer",
  prospect: "Prospect",
  principal: "Principal",
  distributor: "Distributor",
  unknown: "Unknown",
};

const priorityMap = {
  A: "A - High",
  B: "B - Medium-High",
  C: "C - Medium",
  D: "D - Low",
};

export const useOrganizationFilterChips = () => {
  const { filterValues, setFilters } = useListContext();

  // Fetch segment names for active segment filters
  const segmentIds = filterValues?.segment_id
    ? Array.isArray(filterValues.segment_id)
      ? filterValues.segment_id.map(String)
      : [String(filterValues.segment_id)]
    : [];

  const { data: segmentsData } = useGetList(
    "segments",
    {
      pagination: { page: 1, perPage: 100 },
      filter: segmentIds.length > 0 ? { id: segmentIds } : {},
    },
    { enabled: segmentIds.length > 0 }
  );

  // Fetch sales person name for account manager filter
  const salesId = filterValues?.sales_id;
  const { data: salesData } = useGetList(
    "sales",
    {
      pagination: { page: 1, perPage: 1 },
      filter: salesId ? { id: salesId } : {},
    },
    { enabled: !!salesId }
  );

  const getSegmentName = (segmentId: string): string => {
    const segment = segmentsData?.find((s) => String(s.id) === String(segmentId));
    return segment?.name || `Segment #${segmentId}`;
  };

  const getSalesName = (salesId: string): string => {
    const sales = salesData?.[0];
    return sales ? formatName(sales.first_name, sales.last_name) : "Unknown";
  };

  // Build filter chips array
  const chips: FilterChip[] = [];

  // Search query
  if (filterValues?.q) {
    chips.push({
      key: "q",
      value: filterValues.q,
      label: `"${filterValues.q}"`,
      category: "Search",
    });
  }

  // Organization Type
  if (filterValues?.organization_type) {
    const typeArray = Array.isArray(filterValues.organization_type)
      ? filterValues.organization_type
      : [filterValues.organization_type];
    typeArray.forEach((typeId) => {
      const label = organizationTypeMap[typeId as keyof typeof organizationTypeMap] || typeId;
      chips.push({
        key: "organization_type",
        value: typeId,
        label,
        category: "Type",
      });
    });
  }

  // Priority
  if (filterValues?.priority) {
    const priorityArray = Array.isArray(filterValues.priority)
      ? filterValues.priority
      : [filterValues.priority];
    priorityArray.forEach((priorityId) => {
      const label = priorityMap[priorityId as keyof typeof priorityMap] || priorityId;
      chips.push({
        key: "priority",
        value: priorityId,
        label,
        category: "Priority",
      });
    });
  }

  // Segment
  if (filterValues?.segment_id) {
    const segmentArray = Array.isArray(filterValues.segment_id)
      ? filterValues.segment_id
      : [filterValues.segment_id];
    segmentArray.forEach((segmentId) => {
      chips.push({
        key: "segment_id",
        value: segmentId,
        label: getSegmentName(String(segmentId)),
        category: "Segment",
      });
    });
  }

  // Account Manager
  if (filterValues?.sales_id) {
    chips.push({
      key: "sales_id",
      value: filterValues.sales_id,
      label: getSalesName(String(filterValues.sales_id)),
      category: "Manager",
    });
  }

  // Remove individual filter value
  const removeFilterValue = (key: string, value: any) => {
    const newFilters = { ...filterValues };

    if (
      key === "organization_type" &&
      Array.isArray(newFilters.organization_type)
    ) {
      newFilters.organization_type = newFilters.organization_type.filter(
        (id: any) => String(id) !== String(value)
      );
      if (newFilters.organization_type.length === 0) {
        delete newFilters.organization_type;
      }
    } else if (key === "priority" && Array.isArray(newFilters.priority)) {
      newFilters.priority = newFilters.priority.filter(
        (id: any) => String(id) !== String(value)
      );
      if (newFilters.priority.length === 0) {
        delete newFilters.priority;
      }
    } else if (key === "segment_id" && Array.isArray(newFilters.segment_id)) {
      newFilters.segment_id = newFilters.segment_id.filter(
        (id: any) => String(id) !== String(value)
      );
      if (newFilters.segment_id.length === 0) {
        delete newFilters.segment_id;
      }
    } else {
      delete newFilters[key];
    }

    setFilters(newFilters, {});
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({}, {});
  };

  return {
    chips,
    removeFilterValue,
    clearAllFilters,
    hasActiveFilters: chips.length > 0,
  };
};
