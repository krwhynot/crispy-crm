/**
 * DateRangePopoverFilter -- Popover-based date range picker for horizontal parameter bars.
 *
 * Used by OpportunitiesParameterBar (estimated close date range).
 * Collapses two date inputs into a single trigger showing the formatted range.
 *
 * Trigger shows "All time" when both dates are null, or "Mar 01 - Mar 31" formatted range.
 */
import { useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePopoverFilterProps {
  label: string;
  startDate: string | null;
  endDate: string | null;
  onStartChange: (date: string | null) => void;
  onEndChange: (date: string | null) => void;
  triggerWidth?: string;
  startId?: string;
  endId?: string;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DateRangePopoverFilter({
  label,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  triggerWidth = "w-[200px]",
  startId,
  endId,
}: DateRangePopoverFilterProps) {
  const hasRange = startDate || endDate;

  const triggerText = useMemo(() => {
    if (!startDate && !endDate) return "All time";
    if (startDate && endDate)
      return `${formatDateShort(startDate)} \u2013 ${formatDateShort(endDate)}`;
    if (startDate) return `From ${formatDateShort(startDate)}`;
    return `Until ${formatDateShort(endDate!)}`;
  }, [startDate, endDate]);

  const startFieldId = startId ?? `${label.replace(/\s+/g, "-").toLowerCase()}-start`;
  const endFieldId = endId ?? `${label.replace(/\s+/g, "-").toLowerCase()}-end`;

  return (
    <div className="flex flex-col gap-1">
      <span className="paper-micro-label">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`report-filter-trigger h-11 ${triggerWidth} flex items-center justify-between gap-2 px-3 rounded-md text-sm`}
            aria-label={label}
          >
            <Calendar className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            <span
              className={`truncate flex-1 text-left ${hasRange ? "" : "text-muted-foreground"}`}
            >
              {triggerText}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="report-filter-content w-[240px] p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor={startFieldId}>
                Start
              </label>
              <input
                id={startFieldId}
                type="date"
                value={startDate ?? ""}
                onChange={(e) => onStartChange(e.target.value || null)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label="Start date"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor={endFieldId}>
                End
              </label>
              <input
                id={endFieldId}
                type="date"
                value={endDate ?? ""}
                onChange={(e) => onEndChange(e.target.value || null)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label="End date"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
