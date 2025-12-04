/**
 * Activity Timeline Filters Component
 *
 * Provides filtering controls for the activity timeline:
 * - Activity type (multi-select)
 * - Date range picker
 * - Filter by user (multi-select)
 * - "Show stage changes only" toggle
 *
 * Filters apply without page reload via controlled state.
 */

import * as React from "react";
import { useState, useRef, useMemo } from "react";
import { useGetList } from "ra-core";
// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";
import type { Sale } from "../types";

interface ActivityTimelineFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
}

export const ActivityTimelineFilters: React.FC<ActivityTimelineFiltersProps> = ({
  onFiltersChange,
}) => {
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showStageChangesOnly, setShowStageChangesOnly] = useState(false);

  // Memoize pagination to prevent unnecessary re-fetches
  const paginationOptions = useMemo(() => ({ pagination: { page: 1, perPage: 100 } }), []);

  // Fetch users for filter
  const { data: users } = useGetList<Sale>("sales", paginationOptions);

  // Track previous filters to avoid infinite loops from object reference changes
  const previousFiltersRef = useRef<Record<string, any>>({});

  // Build filter object whenever state changes
  // Only call onFiltersChange when filters actually change (deep comparison)
  React.useEffect(() => {
    const filters: Record<string, any> = {};

    // Activity type filter
    if (selectedTypes.length > 0) {
      filters.type = selectedTypes;
    }

    // Date range filter
    if (dateFrom) {
      filters.activity_date_gte = dateFrom;
    }
    if (dateTo) {
      filters.activity_date_lte = dateTo;
    }

    // User filter (created_by)
    if (selectedUsers.length > 0) {
      filters.created_by = selectedUsers.map(Number);
    }

    // Stage changes only toggle
    // Note: This would require a specific activity type or flag in the database
    // For now, we'll document this as a limitation
    if (showStageChangesOnly) {
      // This would need backend support to filter for stage change events
      // Leaving as placeholder for future implementation
      filters.is_stage_change = true;
    }

    // Only update parent if filters actually changed (prevents infinite loop)
    if (!isEqual(filters, previousFiltersRef.current)) {
      previousFiltersRef.current = filters;
      onFiltersChange(filters);
    }
  }, [selectedTypes, dateFrom, dateTo, selectedUsers, showStageChangesOnly, onFiltersChange]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId]
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setDateFrom("");
    setDateTo("");
    setSelectedUsers([]);
    setShowStageChangesOnly(false);
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    dateFrom ||
    dateTo ||
    selectedUsers.length > 0 ||
    showStageChangesOnly;

  const activeFilterCount =
    selectedTypes.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    selectedUsers.length +
    (showStageChangesOnly ? 1 : 0);

  return (
    <div className="flex items-center gap-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-11 gap-2 touch-manipulation">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filter Activities</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="h-11 px-3 text-xs touch-manipulation"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Activity Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Activity Type</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {INTERACTION_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={selectedTypes.includes(option.value)}
                      onCheckedChange={() => handleTypeToggle(option.value)}
                    />
                    <label htmlFor={`type-${option.value}`} className="text-sm cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Created By</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id.toString())}
                      onCheckedChange={() => handleUserToggle(user.id.toString())}
                    />
                    <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                      {user.first_name} {user.last_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Changes Only Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="stage-changes" className="text-sm">
                Stage changes only
              </Label>
              <Switch
                id="stage-changes"
                checked={showStageChangesOnly}
                onCheckedChange={setShowStageChangesOnly}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === type)?.label}
              <button
                onClick={() => handleTypeToggle(type)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {dateFrom}
              <button onClick={() => setDateFrom("")} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {dateTo}
              <button onClick={() => setDateTo("")} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {showStageChangesOnly && (
            <Badge variant="secondary" className="gap-1">
              Stage changes only
              <button
                onClick={() => setShowStageChangesOnly(false)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
