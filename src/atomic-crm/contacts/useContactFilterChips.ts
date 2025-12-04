import { useListContext } from "ra-core";
import { useGetList } from "ra-core";
import { format } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";

interface FilterChip {
  key: string;
  value: any;
  label: string;
  category: string;
}

export const useContactFilterChips = () => {
  const { filterValues, setFilters } = useListContext();

  // Fetch tag names for active tag filters
  const tagIds = filterValues?.tags
    ? Array.isArray(filterValues.tags)
      ? filterValues.tags.map(String)
      : [String(filterValues.tags)]
    : [];

  const { data: tagsData } = useGetList(
    "tags",
    {
      pagination: { page: 1, perPage: 100 },
      filter: tagIds.length > 0 ? { id: tagIds } : {},
    },
    { enabled: tagIds.length > 0 }
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

  // Fetch organization name for organization filter
  const organizationId = filterValues?.organization_id;
  const { data: organizationData } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 1 },
      filter: organizationId ? { id: organizationId } : {},
    },
    { enabled: !!organizationId }
  );

  const getTagName = (tagId: string): string => {
    const tag = tagsData?.find((t) => String(t.id) === String(tagId));
    return tag?.name || `Tag #${tagId}`;
  };

  const getSalesName = (): string => {
    const sales = salesData?.[0];
    return sales ? `${sales.first_name} ${sales.last_name}` : "Unknown";
  };

  const getOrganizationName = (): string => {
    const org = organizationData?.[0];
    return org?.name || "Unknown Organization";
  };

  const formatDateRange = (gte?: string, lte?: string): string => {
    if (gte && !lte) {
      const date = parseDateSafely(gte);
      return date ? `After ${format(date, "MMM d, yyyy")}` : "Recent activity";
    }
    if (lte && !gte) {
      const date = parseDateSafely(lte);
      return date ? `Before ${format(date, "MMM d, yyyy")}` : "Older activity";
    }
    if (gte && lte) {
      const startDate = parseDateSafely(gte);
      const endDate = parseDateSafely(lte);
      return startDate && endDate
        ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
        : "Date range";
    }
    return "Unknown date";
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

  // Last activity
  if (filterValues?.["last_seen@gte"] || filterValues?.["last_seen@lte"]) {
    const label = formatDateRange(filterValues["last_seen@gte"], filterValues["last_seen@lte"]);
    chips.push({
      key: "last_seen",
      value: { gte: filterValues["last_seen@gte"], lte: filterValues["last_seen@lte"] },
      label,
      category: "Activity",
    });
  }

  // Tags
  if (filterValues?.tags) {
    const tagArray = Array.isArray(filterValues.tags) ? filterValues.tags : [filterValues.tags];
    tagArray.forEach((tagId) => {
      chips.push({
        key: "tags",
        value: tagId,
        label: getTagName(String(tagId)),
        category: "Tag",
      });
    });
  }

  // Account Manager
  if (filterValues?.sales_id) {
    chips.push({
      key: "sales_id",
      value: filterValues.sales_id,
      label: getSalesName(),
      category: "Manager",
    });
  }

  // Organization
  if (filterValues?.organization_id) {
    chips.push({
      key: "organization_id",
      value: filterValues.organization_id,
      label: getOrganizationName(),
      category: "Organization",
    });
  }

  // Remove individual filter value
  const removeFilterValue = (key: string, value: any) => {
    const newFilters = { ...filterValues };

    if (key === "last_seen") {
      // Remove both date range fields
      delete newFilters["last_seen@gte"];
      delete newFilters["last_seen@lte"];
    } else if (key === "tags" && Array.isArray(newFilters.tags)) {
      // Remove specific tag from array
      newFilters.tags = newFilters.tags.filter((id: any) => String(id) !== String(value));
      if (newFilters.tags.length === 0) {
        delete newFilters.tags;
      }
    } else {
      // Remove simple key
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
