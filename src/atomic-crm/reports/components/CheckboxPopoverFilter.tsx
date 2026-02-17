/**
 * CheckboxPopoverFilter -- Popover-based multi-select for horizontal parameter bars.
 *
 * Used by:
 *  - OpportunitiesParameterBar (Stage filter, 7 items)
 *  - CampaignParameterBar (Activity Types filter, 15 items)
 *
 * Trigger shows "N selected" / "All" / single item label.
 * Popover renders a scrollable checkbox list with optional Select All toggle.
 */
import { useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxOption {
  value: string;
  label: string;
  count?: number;
}

interface CheckboxPopoverFilterProps {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  showSelectAll?: boolean;
  triggerWidth?: string;
  ariaLabel?: string;
}

export function CheckboxPopoverFilter({
  label,
  options,
  selected,
  onChange,
  showSelectAll = false,
  triggerWidth = "w-[180px]",
  ariaLabel,
}: CheckboxPopoverFilterProps) {
  const allValues = useMemo(() => options.map((o) => o.value), [options]);
  const allSelected = selected.length === allValues.length;
  const noneSelected = selected.length === 0;

  const toggleItem = useCallback(
    (value: string, checked: boolean) => {
      const next = checked ? [...selected, value] : selected.filter((v) => v !== value);
      onChange(next);
    },
    [selected, onChange]
  );

  const handleSelectAll = useCallback(() => {
    onChange(allSelected ? [] : [...allValues]);
  }, [allSelected, allValues, onChange]);

  // Compute trigger display text
  const triggerText = useMemo(() => {
    if (noneSelected) return "None";
    if (allSelected) return "All";
    if (selected.length === 1) {
      const match = options.find((o) => o.value === selected[0]);
      return match?.label ?? "1 selected";
    }
    return `${selected.length} selected`;
  }, [selected, options, allSelected, noneSelected]);

  return (
    <div className="flex flex-col gap-1">
      <span className="paper-micro-label">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`report-filter-trigger h-11 ${triggerWidth} flex items-center justify-between px-3 rounded-md text-sm`}
            aria-label={ariaLabel ?? label}
          >
            <span className="truncate">{triggerText}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="report-filter-content w-[240px] p-3">
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
            {showSelectAll && (
              <div className="flex items-center pb-1 border-b border-border mb-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-primary underline-offset-2 hover:underline h-8 flex items-center"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}
            {options.map((opt) => {
              const checkboxId = `${label.replace(/\s+/g, "-").toLowerCase()}-${opt.value}`;
              const isChecked = selected.includes(opt.value);
              return (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => toggleItem(opt.value, checked === true)}
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer flex-1 text-sm">
                    {opt.label}
                  </Label>
                  {opt.count !== undefined && (
                    <span className="text-xs text-muted-foreground tabular-nums">{opt.count}</span>
                  )}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
