import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useListContext, useTranslate } from "ra-core";
// es-toolkit: Partial object matching (note: isMatch, not matches)
import { isMatch, pickBy } from "es-toolkit/compat";
import { CircleX, Check } from "lucide-react";

export const ToggleFilterButton = ({
  label,
  size = "sm",
  value,
  className,
  multiselect = false,
}: {
  label: React.ReactElement | string;
  value: any;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  /** When true, allows multiple values to be selected (accumulates into array) */
  multiselect?: boolean;
}) => {
  const { filterValues, setFilters } = useListContext();
  const translate = useTranslate();

  // Handle null/undefined filterValues
  const currentFilters = filterValues || {};

  const isSelected = multiselect
    ? getIsSelectedMulti(value, currentFilters)
    : getIsSelected(value, currentFilters);

  const handleClick = () =>
    setFilters(
      multiselect ? toggleFilterMulti(value, currentFilters) : toggleFilter(value, currentFilters)
    );

  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      onClick={handleClick}
      className={cn(
        "cursor-pointer",
        "flex flex-row items-center gap-2 px-2.5",
        "min-w-0", // Allow text truncation
        className
      )}
      size={size}
    >
      <span className="truncate">
        {typeof label === "string" ? translate(label, { _: label }) : label}
      </span>
      {isSelected &&
        (multiselect ? (
          <Check className="h-4 w-4 opacity-50" />
        ) : (
          <CircleX className="opacity-50" />
        ))}
    </Button>
  );
};

const toggleFilter = (value: any, filters: any) => {
  // Ensure filters is an object
  const safeFilters = filters || {};

  // es-toolkit isMatch takes (object, source) directly - arguments swapped from lodash matches
  const isSelected = isMatch(safeFilters, pickBy(value, (val) => typeof val !== "undefined"));

  if (isSelected) {
    const keysToRemove = Object.keys(value);
    return Object.keys(safeFilters).reduce(
      (acc, key) => (keysToRemove.includes(key) ? acc : { ...acc, [key]: safeFilters[key] }),
      {}
    );
  }

  return { ...safeFilters, ...value };
};

const getIsSelected = (value: any, filters: any) => {
  const safeFilters = filters || {};
  return isMatch(safeFilters, pickBy(value, (val) => typeof val !== "undefined"));
};

/**
 * Multi-select toggle: adds/removes values from array filters
 * Example: value = { tags: 5 }, filters = { tags: [1, 2] } → { tags: [1, 2, 5] }
 */
const toggleFilterMulti = (value: any, filters: any) => {
  // Ensure filters is an object
  const safeFilters = filters || {};

  // Extract the filter key and value from the value object
  // e.g., { tags: 5 } → key="tags", val=5
  const [key, val] = Object.entries(value)[0];

  if (!key || val === undefined) {
    return safeFilters;
  }

  const currentValue = safeFilters[key];

  // If current value is an array
  if (Array.isArray(currentValue)) {
    if (currentValue.includes(val)) {
      // Remove value from array
      const newValue = currentValue.filter((v: any) => v !== val);
      if (newValue.length === 0) {
        // Remove filter entirely if array becomes empty
        const { [key]: _, ...rest } = safeFilters;
        return rest;
      }
      return { ...safeFilters, [key]: newValue };
    } else {
      // Add value to array
      return { ...safeFilters, [key]: [...currentValue, val] };
    }
  }

  // If current value matches the new value, remove it
  if (currentValue === val) {
    const { [key]: _, ...rest } = safeFilters;
    return rest;
  }

  // If current value exists but is different, convert to array
  if (currentValue !== undefined && currentValue !== null) {
    return { ...safeFilters, [key]: [currentValue, val] };
  }

  // No existing value, set as single value (not array yet)
  return { ...safeFilters, [key]: val };
};

/**
 * Check if a specific value is selected in multi-select mode
 * Handles both array and single values
 */
const getIsSelectedMulti = (value: any, filters: any): boolean => {
  // Ensure filters is an object
  const safeFilters = filters || {};

  const [key, val] = Object.entries(value)[0];

  if (!key || val === undefined) {
    return false;
  }

  const currentValue = safeFilters[key];

  if (Array.isArray(currentValue)) {
    return currentValue.includes(val);
  }

  return currentValue === val;
};
