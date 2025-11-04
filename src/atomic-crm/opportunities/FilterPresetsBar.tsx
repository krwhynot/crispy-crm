/**
 * Filter Presets Bar Component
 *
 * Displays quick-access filter preset buttons in the opportunities list.
 * Shows count badges for active presets and allows one-click filter application.
 */

import * as React from "react";
import { useListContext, useListFilterContext, useGetIdentity } from "ra-core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  AlertCircle,
  Flag,
  Trophy,
  LucideIcon,
} from "lucide-react";
import { getFilterPresets, type FilterPreset } from "./filterPresets";
import type { Opportunity } from "../types";

// Map icon names to lucide-react components
const iconMap: Record<string, LucideIcon> = {
  User,
  Calendar,
  AlertCircle,
  Flag,
  Trophy,
};

export const FilterPresetsBar: React.FC = () => {
  const { identity } = useGetIdentity();
  const { data: opportunities } = useListContext<Opportunity>();
  const { filterValues, setFilters, displayedFilters } = useListFilterContext();

  const presets = React.useMemo(
    () => getFilterPresets(identity?.id),
    [identity?.id]
  );

  // Calculate count for each preset
  const getPresetCount = (preset: FilterPreset): number => {
    if (!opportunities) return 0;

    return opportunities.filter((opp) => {
      // Check each filter condition
      return Object.entries(preset.filters).every(([key, value]) => {
        if (key === "opportunity_owner_id") {
          return opp.opportunity_owner_id === value;
        }
        if (key === "priority" && Array.isArray(value)) {
          return value.includes(opp.priority);
        }
        if (key === "stage") {
          return opp.stage === value;
        }
        if (key === "estimated_close_date_gte") {
          return opp.estimated_close_date && opp.estimated_close_date >= value;
        }
        if (key === "estimated_close_date_lte") {
          return opp.estimated_close_date && opp.estimated_close_date <= value;
        }
        if (key === "next_action_date_lte") {
          return opp.next_action_date && opp.next_action_date <= value;
        }
        if (key === "updated_at_gte") {
          return opp.updated_at && opp.updated_at >= value;
        }
        return true;
      });
    }).length;
  };

  const handlePresetClick = (preset: FilterPreset) => {
    // Apply preset filters (merges with existing filters)
    setFilters({ ...filterValues, ...preset.filters }, displayedFilters);
  };

  const isPresetActive = (preset: FilterPreset): boolean => {
    return Object.entries(preset.filters).every(([key, value]) => {
      const currentValue = filterValues[key];
      if (Array.isArray(value) && Array.isArray(currentValue)) {
        return value.every((v) => currentValue.includes(v));
      }
      return currentValue === value;
    });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="text-xs text-muted-foreground font-medium flex items-center mr-2">
        Quick Filters:
      </div>
      {presets.map((preset) => {
        const Icon = preset.icon ? iconMap[preset.icon] : null;
        const count = getPresetCount(preset);
        const isActive = isPresetActive(preset);

        return (
          <Button
            key={preset.id}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="flex items-center gap-2"
            title={preset.description}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{preset.label}</span>
            {count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "default"}
                className="ml-1 px-1.5 py-0 text-xs"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};
