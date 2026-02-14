/**
 * useFilterChipBar Hook
 *
 * Core hook that transforms React Admin filter state into displayable chips.
 * Handles reference resolution, date formatting, and grouped filter removal.
 *
 * @module filters/useFilterChipBar
 */

import { useCallback, useMemo } from "react";
import { useListContext } from "react-admin";
import type { ChipFilterConfig, FilterChoice } from "./filterConfigSchema";
import { detectDatePresetLabel, formatDateValue } from "./dateFilterLabels";
import { useOrganizationNames } from "./useOrganizationNames";
import { useSalesNames } from "./useSalesNames";
import { useTagNames } from "./useTagNames";
import { useSegmentNames } from "./useSegmentNames";
import { useCategoryNames } from "./useCategoryNames";
import { useTaskNames } from "./useTaskNames";

/**
 * Data structure for a single filter chip
 */
export interface ChipData {
  /** Filter key (e.g., "status", "organization_id", or removalGroup for combined chips) */
  key: string;
  /** Filter value or removalGroup name for combined chips */
  value: string | number;
  /** Human-readable label for the chip */
  label: string;
  /** Category name for grouping (e.g., "Status", "Organization") */
  category: string;
}

/**
 * Return type for useFilterChipBar hook
 */
export interface UseFilterChipBarReturn {
  /** Array of chip data to render */
  chips: ChipData[];
  /** Remove a specific filter (handles grouped filters via removalGroup) */
  removeFilter: (key: string, value?: string | number) => void;
  /** Clear all user-applied filters (preserves system filters) */
  clearAllFilters: () => void;
  /** Whether any user-applied filters are active */
  hasActiveFilters: boolean;
  /** Count of active filter chips */
  activeCount: number;
}

/**
 * System filters that should never show as chips.
 * Includes soft-delete variants used by various lists.
 *
 * NOTE: 'q' (search) is NOT excluded - we show search chips for user clarity
 */
const SYSTEM_FILTERS = new Set(["deleted_at", "deleted_at@is", "$or"]);

/**
 * Transform React Admin filter state into displayable chips.
 *
 * DESIGN DECISIONS:
 * 1. Search chips: Shown with format `Search: "term"` for clarity
 * 2. Identity labels: Show full name (not "Me") - consistent UX, simpler code
 * 3. Date ranges: Combined into single chip using removalGroup
 *
 * @param filterConfig - Array of filter configurations defining how to display each filter
 * @param context - Optional context for dynamic choices (e.g., ConfigurationContext)
 * @returns UseFilterChipBarReturn with chips array and filter management functions
 *
 * @example
 * ```tsx
 * const { chips, removeFilter, clearAllFilters } = useFilterChipBar(
 *   ORGANIZATION_FILTER_CONFIG
 * );
 * ```
 */
export function useFilterChipBar<TContext = unknown>(
  filterConfig: ChipFilterConfig[],
  context?: TContext
): UseFilterChipBarReturn {
  const { filterValues, setFilters, displayedFilters } = useListContext();

  // Fail-fast: context must exist
  if (!filterValues || !setFilters) {
    throw new Error(
      "useFilterChipBar must be used within a React Admin List context. " +
        "Ensure FilterChipBar is rendered inside a <List> component."
    );
  }

  // Extract reference IDs for lazy loading names
  const referenceIds = useMemo(() => {
    const ids: {
      organizations: string[];
      sales: string[];
      tags: string[];
      segments: string[];
      categories: string[];
      tasks: string[];
    } = {
      organizations: [],
      sales: [],
      tags: [],
      segments: [],
      categories: [],
      tasks: [],
    };

    filterConfig.forEach((config) => {
      const value = filterValues[config.key];
      if (!value) return;

      const values = Array.isArray(value) ? value : [value];

      if (config.reference === "organizations" || config.key === "organization_id") {
        ids.organizations.push(...values.map(String));
      } else if (
        config.reference === "sales" ||
        config.key === "sales_id" ||
        config.key === "secondary_sales_id"
      ) {
        ids.sales.push(...values.map(String));
      } else if (config.reference === "tags" || config.key === "tags") {
        ids.tags.push(...values.map(String));
      } else if (config.reference === "segments" || config.key === "segment_id") {
        ids.segments.push(...values.map(String));
      } else if (config.reference === "categories" || config.key === "category") {
        ids.categories.push(...values.map(String));
      } else if (config.reference === "tasks" || config.key === "task_id") {
        ids.tasks.push(...values.map(String));
      }
    });

    return ids;
  }, [filterValues, filterConfig]);

  // Lazy-load reference names
  const { getOrganizationName } = useOrganizationNames(referenceIds.organizations);
  const { getSalesName } = useSalesNames(referenceIds.sales);
  const { getTagName } = useTagNames(referenceIds.tags);
  const { getSegmentName } = useSegmentNames(referenceIds.segments);
  const { getCategoryName } = useCategoryNames(referenceIds.categories);
  const { getTaskName } = useTaskNames(referenceIds.tasks);

  // Build removal groups map from config
  const removalGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    filterConfig.forEach((config) => {
      if (config.removalGroup) {
        const existing = groups.get(config.removalGroup) || [];
        groups.set(config.removalGroup, [...existing, config.key]);
      }
    });
    return groups;
  }, [filterConfig]);

  // Helper: resolve choices (supports both static arrays and callbacks)
  const resolveChoices = useCallback(
    (config: ChipFilterConfig): FilterChoice[] | undefined => {
      if (!config.choices) return undefined;
      // If choices is a function, call it with context (e.g., ConfigurationContext)
      if (typeof config.choices === "function") {
        return config.choices(context);
      }
      return config.choices;
    },
    [context]
  );

  // Step 1: Create base chip data from filters (no name resolution yet)
  // Only recalculates when filter values or config change
  const baseChips = useMemo(() => {
    const result: ChipData[] = [];
    const processedGroups = new Set<string>(); // Track rendered removalGroups

    Object.entries(filterValues).forEach(([key, value]) => {
      // Skip system filters (but NOT 'q' - we want search chips)
      if (SYSTEM_FILTERS.has(key) || value === undefined || value === null) {
        return;
      }

      // DYNAMIC @ilike HANDLING: TextColumnFilter generates ${source}@ilike keys
      // Handle these dynamically without requiring explicit config entries
      if (key.endsWith("@ilike")) {
        const source = key.replace("@ilike", "");
        // Humanize: first_name -> "First name", name -> "Name"
        const humanizedSource = source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, " ");
        // Strip wildcards from value: %John% -> John
        const displayValue = String(value).replace(/^%|%$/g, "");

        result.push({
          key,
          value: value as string,
          label: displayValue,
          category: `${humanizedSource} contains`,
        });
        return; // Skip normal processing
      }

      const config = filterConfig.find((c) => c.key === key);
      const category = config?.label ?? key;

      // COMBINED DATE RANGE CHIPS: If this filter has a removalGroup, combine with others
      if (config?.removalGroup) {
        // Skip if we already rendered this group
        if (processedGroups.has(config.removalGroup)) return;
        processedGroups.add(config.removalGroup);

        // Find all configs in this removalGroup
        const groupConfigs = filterConfig.filter((c) => c.removalGroup === config.removalGroup);

        // Extract @gte and @lte values for date range detection
        const gteConfig = groupConfigs.find(
          (c) => c.key.includes("@gte") || c.key.includes("_gte")
        );
        const lteConfig = groupConfigs.find(
          (c) => c.key.includes("@lte") || c.key.includes("_lte")
        );
        const gteValue = gteConfig
          ? (filterValues[gteConfig.key] as string | undefined)
          : undefined;
        const lteValue = lteConfig
          ? (filterValues[lteConfig.key] as string | undefined)
          : undefined;

        // Try to detect a known sidebar preset (e.g., "This week", "Before this month")
        const presetLabel = detectDatePresetLabel(gteValue, lteValue);

        let combinedLabel: string;
        if (presetLabel) {
          // Use the semantic preset label
          combinedLabel = presetLabel;
        } else {
          // Fall back to formatted date range for custom ranges
          const labels: string[] = [];
          if (gteValue) labels.push(formatDateValue(gteValue));
          if (lteValue) labels.push(formatDateValue(lteValue));
          combinedLabel = labels.join(" – ");
        }

        if (combinedLabel) {
          // Use removalGroup as key so removal clears all
          result.push({
            key: config.removalGroup,
            value: config.removalGroup, // Special value for grouped removal
            label: combinedLabel,
            // Clean up category label (remove After/Before/etc.)
            category: config.label.replace(/(After|Before|@gte|@lte)/gi, "").trim() || "Date",
          });
        }
        return; // Don't process individual filter
      }

      const values = Array.isArray(value) ? value : [value];

      values.forEach((v) => {
        let label: string;
        let needsNameResolution = false;
        let referenceType: string | undefined;

        // Special handling for search filter (q)
        // Include "Search: " prefix since FilterChip only renders label, not category
        if (key === "q") {
          label = `Search: "${String(v)}"`;
          result.push({ key, value: v as string | number, label, category: "Search" });
          return; // Skip other label logic
        }

        if (config?.formatLabel) {
          label = config.formatLabel(v);
        } else if (config?.type === "boolean" && config?.choices) {
          // Boolean filters with choices: map boolean value to corresponding choice
          // e.g., disabled: false → { id: "active", name: "Active" }
          //       disabled: true  → { id: "disabled", name: "Disabled" }
          const resolvedChoices = resolveChoices(config);
          // Convention: first choice is for false, second is for true
          const choiceIndex = v === true ? 1 : 0;
          label = resolvedChoices?.[choiceIndex]?.name ?? (v ? "Yes" : "No");
        } else if (config?.type === "boolean" || config?.type === "toggle") {
          // Boolean/toggle filters without choices: use default labels
          label = v === true ? "Yes" : "No";
        } else if (config?.choices) {
          // Resolve callback choices before calling .find()
          const resolvedChoices = resolveChoices(config);
          const choice = resolvedChoices?.find((c) => c.id === v);
          label = choice?.name ?? String(v);
        } else if (config?.reference === "organizations" || key === "organization_id") {
          // Store ID for later resolution
          label = String(v);
          needsNameResolution = true;
          referenceType = "organizations";
        } else if (config?.reference === "sales" || key === "sales_id") {
          label = String(v);
          needsNameResolution = true;
          referenceType = "sales";
        } else if (config?.reference === "tags") {
          // Only resolve tags when explicitly configured as reference
          // (Opportunity tags are text[], not IDs - use multiselect config instead)
          label = String(v);
          needsNameResolution = true;
          referenceType = "tags";
        } else if (config?.reference === "segments" || key === "segment_id") {
          label = String(v);
          needsNameResolution = true;
          referenceType = "segments";
        } else if (config?.reference === "categories" || key === "category") {
          label = String(v);
          needsNameResolution = true;
          referenceType = "categories";
        } else if (config?.reference === "tasks" || key === "task_id") {
          label = String(v);
          needsNameResolution = true;
          referenceType = "tasks";
        } else {
          label = String(v);
        }

        result.push({
          key,
          value: v as string | number,
          label,
          category,
          // Store metadata for name resolution in next memo
          ...(needsNameResolution && { referenceType }),
        });
      });
    });

    return result;
  }, [filterValues, filterConfig, resolveChoices]);

  // Step 2: Resolve reference names (separate memo)
  // Only recalculates when name hooks change, not on every filter change
  const chips = useMemo(() => {
    return baseChips.map((chip) => {
      // @ts-expect-error - referenceType is metadata for name resolution
      const referenceType = chip.referenceType as string | undefined;

      if (!referenceType) {
        return chip;
      }

      // Resolve name based on reference type
      let resolvedLabel: string;
      switch (referenceType) {
        case "organizations":
          resolvedLabel = getOrganizationName(chip.label);
          break;
        case "sales":
          resolvedLabel = getSalesName(chip.label);
          break;
        case "tags":
          resolvedLabel = getTagName(chip.label);
          break;
        case "segments":
          resolvedLabel = getSegmentName(chip.label);
          break;
        case "categories":
          resolvedLabel = getCategoryName(chip.label);
          break;
        case "tasks":
          resolvedLabel = getTaskName(chip.label);
          break;
        default:
          resolvedLabel = chip.label;
      }

      // Return chip without metadata
      const { referenceType: _, ...cleanChip } = chip as ChipData & { referenceType?: string };
      return { ...cleanChip, label: resolvedLabel };
    });
  }, [
    baseChips,
    getOrganizationName,
    getSalesName,
    getTagName,
    getSegmentName,
    getCategoryName,
    getTaskName,
  ]);

  const removeFilter = useCallback(
    (key: string, value?: string | number) => {
      // Find the config for this key to check for removal groups
      const config = filterConfig.find((c) => c.key === key);

      // Check if key IS a removalGroup name (for combined chips)
      // Combined date range chips use removalGroup as their key
      let keysToRemove: string[];
      if (removalGroups.has(key)) {
        // Key is a removalGroup - remove all filters in that group
        keysToRemove = removalGroups.get(key) || [key];
      } else if (config?.removalGroup) {
        // Key is an individual filter with a removalGroup
        keysToRemove = removalGroups.get(config.removalGroup) || [key];
      } else {
        // Regular filter, just remove this key
        keysToRemove = [key];
      }

      const currentValue = filterValues[key];

      if (Array.isArray(currentValue) && value !== undefined && keysToRemove.length === 1) {
        // Single key, array value - remove just that value
        const newArray = currentValue.filter((v) => v !== value);
        setFilters(
          { ...filterValues, [key]: newArray.length ? newArray : undefined },
          displayedFilters
        );
      } else {
        // Remove all keys in the group
        const newFilters = { ...filterValues };
        keysToRemove.forEach((k) => {
          delete newFilters[k];
        });
        setFilters(newFilters, displayedFilters);
      }
    },
    [filterValues, setFilters, displayedFilters, filterConfig, removalGroups]
  );

  const clearAllFilters = useCallback(() => {
    // Preserve system filters when clearing
    const preserved = Object.fromEntries(
      Object.entries(filterValues).filter(([key]) => SYSTEM_FILTERS.has(key))
    );
    setFilters(preserved, displayedFilters);
  }, [filterValues, setFilters, displayedFilters]);

  const activeCount = chips.length;
  const hasActiveFilters = activeCount > 0;

  return { chips, removeFilter, clearAllFilters, hasActiveFilters, activeCount };
}
