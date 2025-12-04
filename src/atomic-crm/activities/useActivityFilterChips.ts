import { useListContext } from "ra-core";
import { format } from "date-fns";
import { INTERACTION_TYPE_OPTIONS, SAMPLE_STATUS_OPTIONS } from "../validation/activities";
import { parseDateSafely } from "@/lib/date-utils";

interface FilterChip {
  key: string;
  value: any;
  label: string;
  category: string;
}

/**
 * Hook for managing activity filter chips in the sidebar
 *
 * Handles:
 * - Activity type filters (13 interaction types)
 * - Sample status filters (sent, received, feedback_pending, feedback_received)
 * - Date range filters (activity_date)
 * - Sentiment filters
 * - Created by filter
 */
export const useActivityFilterChips = () => {
  const { filterValues, setFilters } = useListContext();

  const formatDateRange = (gte?: string, lte?: string): string => {
    if (gte && !lte) {
      const date = parseDateSafely(gte);
      return date ? `After ${format(date, "MMM d, yyyy")}` : "Recent";
    }
    if (lte && !gte) {
      const date = parseDateSafely(lte);
      return date ? `Before ${format(date, "MMM d, yyyy")}` : "Older";
    }
    if (gte && lte) {
      const startDate = parseDateSafely(gte);
      const endDate = parseDateSafely(lte);
      if (startDate && endDate) {
        return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
      }
      return "Date range";
    }
    return "Unknown date";
  };

  const getActivityTypeLabel = (value: string): string => {
    const option = INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value;
  };

  const getSampleStatusLabel = (value: string): string => {
    const option = SAMPLE_STATUS_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value;
  };

  const getSentimentLabel = (value: string): string => {
    const labels: Record<string, string> = {
      positive: "Positive",
      neutral: "Neutral",
      negative: "Negative",
    };
    return labels[value] || value;
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

  // Activity Type (supports multiselect)
  if (filterValues?.type) {
    const typeArray = Array.isArray(filterValues.type) ? filterValues.type : [filterValues.type];
    typeArray.forEach((type) => {
      chips.push({
        key: "type",
        value: type,
        label: getActivityTypeLabel(type),
        category: "Type",
      });
    });
  }

  // Sample Status (supports multiselect)
  if (filterValues?.sample_status) {
    const statusArray = Array.isArray(filterValues.sample_status)
      ? filterValues.sample_status
      : [filterValues.sample_status];
    statusArray.forEach((status) => {
      chips.push({
        key: "sample_status",
        value: status,
        label: getSampleStatusLabel(status),
        category: "Sample Status",
      });
    });
  }

  // Activity Date Range
  if (filterValues?.["activity_date@gte"] || filterValues?.["activity_date@lte"]) {
    const label = formatDateRange(
      filterValues["activity_date@gte"],
      filterValues["activity_date@lte"]
    );
    chips.push({
      key: "activity_date",
      value: {
        gte: filterValues["activity_date@gte"],
        lte: filterValues["activity_date@lte"],
      },
      label,
      category: "Date",
    });
  }

  // Sentiment (supports multiselect)
  if (filterValues?.sentiment) {
    const sentimentArray = Array.isArray(filterValues.sentiment)
      ? filterValues.sentiment
      : [filterValues.sentiment];
    sentimentArray.forEach((sentiment) => {
      chips.push({
        key: "sentiment",
        value: sentiment,
        label: getSentimentLabel(sentiment),
        category: "Sentiment",
      });
    });
  }

  // Created By
  if (filterValues?.created_by) {
    chips.push({
      key: "created_by",
      value: filterValues.created_by,
      label: "Me",
      category: "Created By",
    });
  }

  // Remove individual filter value
  const removeFilterValue = (key: string, value: any) => {
    const newFilters = { ...filterValues };

    if (key === "activity_date") {
      // Remove both date range fields
      delete newFilters["activity_date@gte"];
      delete newFilters["activity_date@lte"];
    } else if (key === "type" && Array.isArray(newFilters.type)) {
      // Remove specific type from array
      newFilters.type = newFilters.type.filter((t: any) => String(t) !== String(value));
      if (newFilters.type.length === 0) {
        delete newFilters.type;
      }
    } else if (key === "sample_status" && Array.isArray(newFilters.sample_status)) {
      // Remove specific sample_status from array
      newFilters.sample_status = newFilters.sample_status.filter(
        (s: any) => String(s) !== String(value)
      );
      if (newFilters.sample_status.length === 0) {
        delete newFilters.sample_status;
      }
    } else if (key === "sentiment" && Array.isArray(newFilters.sentiment)) {
      // Remove specific sentiment from array
      newFilters.sentiment = newFilters.sentiment.filter((s: any) => String(s) !== String(value));
      if (newFilters.sentiment.length === 0) {
        delete newFilters.sentiment;
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
