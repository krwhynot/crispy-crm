import { useState, useMemo } from "react";
import { useGetList } from "ra-core";
import { Calendar, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalFilters } from "../contexts/GlobalFilterContext";
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

interface Sale {
  id: number;
  first_name: string;
  last_name: string;
}

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

/**
 * Global Filter Bar
 *
 * Provides date range and sales rep filters that apply across all report tabs.
 * Filter state is managed by GlobalFilterContext and persisted to localStorage.
 */
export function GlobalFilterBar() {
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const [datePreset, setDatePreset] = useState("last30");

  // Fetch sales reps for the dropdown
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "first_name", order: "ASC" },
  });

  const salesRepOptions = useMemo(
    () =>
      salesReps.map((rep) => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`,
      })),
    [salesReps]
  );

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    const now = new Date();

    let start: Date;
    let end: Date;

    switch (value) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "yesterday":
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case "last7":
        start = startOfDay(subDays(now, 6));
        end = endOfDay(now);
        break;
      case "last30":
        start = startOfDay(subDays(now, 29));
        end = endOfDay(now);
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfDay(now);
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        start = startOfDay(subDays(now, 29));
        end = endOfDay(now);
    }

    setFilters({
      ...filters,
      dateRange: { start, end },
    });
  };

  const handleSalesRepChange = (value: string) => {
    setFilters({
      ...filters,
      salesRepId: value === "all" ? null : parseInt(value, 10),
    });
  };

  const handleReset = () => {
    setDatePreset("last30");
    resetFilters();
  };

  // Determine if filters are active (not default values)
  const hasActiveFilters = filters.salesRepId !== null || datePreset !== "last30";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-secondary/50 rounded-lg mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select value={datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-[160px] h-11" aria-label="Date Range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sales Rep Filter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select
            value={filters.salesRepId?.toString() || "all"}
            onValueChange={handleSalesRepChange}
          >
            <SelectTrigger className="w-[180px] h-11" aria-label="Sales Rep">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {salesRepOptions.map((rep) => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset Filters - only show when filters are active */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-11"
        >
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
