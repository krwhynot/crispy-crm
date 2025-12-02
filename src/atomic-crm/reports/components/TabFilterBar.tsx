import { useMemo } from "react";
import { useGetList } from "ra-core";
import { Calendar, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sale } from "../../types";

interface DateRange {
  preset: string;
  start: string | null;
  end: string | null;
}

interface TabFilterBarProps {
  // Date range filter
  showDateRange?: boolean;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;

  // Sales rep filter
  showSalesRep?: boolean;
  salesRepId?: number | null;
  onSalesRepChange?: (id: number | null) => void;

  // Reset
  hasActiveFilters?: boolean;
  onReset?: () => void;

  // Custom filters slot
  children?: React.ReactNode;
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
 * TabFilterBar
 *
 * Reusable filter bar for report tabs. Composable design:
 * - Toggle date range, sales rep filters via props
 * - Children slot for tab-specific filters
 * - Consistent 44px touch targets
 * - Semantic styling
 */
export function TabFilterBar({
  showDateRange,
  dateRange,
  onDateRangeChange,
  showSalesRep,
  salesRepId,
  onSalesRepChange,
  hasActiveFilters,
  onReset,
  children,
}: TabFilterBarProps) {
  // Fetch sales reps for dropdown
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
    onDateRangeChange?.({
      preset: value,
      start: null, // Preset handles date calculation
      end: null,
    });
  };

  const handleSalesRepChange = (value: string) => {
    onSalesRepChange?.(value === "all" ? null : parseInt(value, 10));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-content p-content bg-muted/50 rounded-lg">
      <div className="flex flex-wrap items-center gap-content">
        {/* Date Range */}
        {showDateRange && dateRange && (
          <div className="flex items-center gap-compact">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select value={dateRange.preset} onValueChange={handleDatePresetChange}>
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
        )}

        {/* Sales Rep */}
        {showSalesRep && (
          <div className="flex items-center gap-compact">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              value={salesRepId?.toString() || "all"}
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
        )}

        {/* Custom filters */}
        {children}
      </div>

      {/* Reset */}
      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-11">
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
