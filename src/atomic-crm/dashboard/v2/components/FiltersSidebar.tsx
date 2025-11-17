import { ChevronRightIcon, ChevronLeft } from "lucide-react";
import { useCallback } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterState } from "../types";
import { useConfigurationContext } from "@/atomic-crm/root/ConfigurationContext";
import { usePrefs } from "../hooks/usePrefs";
import { useGetList } from 'react-admin';

interface FiltersSidebarProps {
  filters: FilterState;  // From shared types
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
  onToggle: () => void;
  autoFocus?: boolean;  // Focus first input when component mounts
}

export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeCount,
  onToggle,
  autoFocus = false,
}: FiltersSidebarProps) {
  const { opportunityStages } = useConfigurationContext();
  const [filtersOpen, setFiltersOpen] = usePrefs<boolean>("filtersOpen", true);

  // Fetch sales reps for assignee dropdown
  const { data: salesReps } = useGetList('sales', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'first_name', order: 'ASC' },
  });

  // Ref callback to auto-focus first checkbox when it mounts (if autoFocus is true)
  const firstCheckboxRef = useCallback((node: HTMLInputElement | null) => {
    if (node && autoFocus && filtersOpen) {
      // Use RAF to ensure element is fully rendered and focusable
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.focus();
        });
      });
    }
  }, [autoFocus, filtersOpen]);

  const toggleHealth = (value: "active" | "cooling" | "at_risk") => {
    const newHealth = filters.health.includes(value)
      ? filters.health.filter((h) => h !== value)
      : [...filters.health, value];
    onFiltersChange({ ...filters, health: newHealth });
  };

  const toggleStage = (value: string) => {
    const newStages = filters.stages.includes(value)
      ? filters.stages.filter((s) => s !== value)
      : [...filters.stages, value];
    onFiltersChange({ ...filters, stages: newStages });
  };

  return (
    <aside
      className="h-full flex flex-col bg-card border border-border rounded-lg shadow-sm"
      aria-label="Filters"
    >
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        {/* Collapsible header */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between h-11 px-3">
            <CollapsibleTrigger
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors -ml-3 pl-3 pr-2 h-11"
              aria-controls="filters-content"
              aria-expanded={filtersOpen}
            >
              <h3 className="font-semibold text-sm text-foreground">Filters</h3>
              <ChevronRightIcon
                className="h-4 w-4 text-muted-foreground transition-transform"
                style={{
                  transform: filtersOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              />
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Clear ${activeCount} active filters`}
                >
                  Clear ({activeCount})
                </button>
              )}
              <button
                onClick={onToggle}
                className="h-11 w-11 rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary transition-colors flex items-center justify-center"
                aria-label="Collapse filters sidebar"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible filter content */}
        <CollapsibleContent id="filters-content" className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
        {/* Health Status - compact */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Health Status</h3>
          <div className="space-y-1">
            <div className="flex items-center min-h-8">
              <Checkbox
                ref={firstCheckboxRef}
                id="health-active"
                checked={filters.health.includes("active")}
                onCheckedChange={() => toggleHealth("active")}
                className="h-4 w-4"
              />
              <Label htmlFor="health-active" className="ml-3 cursor-pointer flex-1 text-xs text-success">
                <span className="mr-2">🟢</span>
                Active <span className="sr-only">health status</span>
              </Label>
            </div>
            <div className="flex items-center min-h-8">
              <Checkbox
                id="health-cooling"
                checked={filters.health.includes("cooling")}
                onCheckedChange={() => toggleHealth("cooling")}
                className="h-4 w-4"
              />
              <Label htmlFor="health-cooling" className="ml-3 cursor-pointer flex-1 text-xs text-warning">
                <span className="mr-2">🟡</span>
                Cooling <span className="sr-only">health status</span>
              </Label>
            </div>
            <div className="flex items-center min-h-8">
              <Checkbox
                id="health-at-risk"
                checked={filters.health.includes("at_risk")}
                onCheckedChange={() => toggleHealth("at_risk")}
                className="h-4 w-4"
              />
              <Label htmlFor="health-at-risk" className="ml-3 cursor-pointer flex-1 text-xs text-destructive">
                <span className="mr-2">🔴</span>
                At Risk <span className="sr-only">health status</span>
              </Label>
            </div>
          </div>
        </div>

        {/* Stage - TWO-COLUMN LAYOUT */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Stage</h3>
          <div className="grid grid-cols-2 gap-2">
            {opportunityStages.map((stage) => (
              <div key={stage.value} className="flex items-center min-h-8">
                <Checkbox
                  id={`stage-${stage.value}`}
                  checked={filters.stages.includes(stage.value)}
                  onCheckedChange={() => toggleStage(stage.value)}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`stage-${stage.value}`}
                  className="ml-2 cursor-pointer flex-1 text-xs leading-tight"
                >
                  {stage.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Assignee Filter */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Assignee</h3>
          <Select
            value={filters.assignee?.toString() || 'team'}
            onValueChange={(value) => {
              const newAssignee = value === 'team' ? null : value; // Keep as string (React Admin IDs are strings)
              onFiltersChange({ ...filters, assignee: newAssignee });
            }}
          >
            <SelectTrigger className="w-full h-11 border-border/50 font-normal" aria-label="Filter by assignee">
              <SelectValue placeholder="All Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">All Team</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              {salesReps?.map(rep => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.first_name} {rep.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Last Touch - compact */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Last Touch</h3>
          <Select
            value={filters.lastTouch}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                lastTouch: value as "7d" | "14d" | "any",
              })
            }
          >
            <SelectTrigger className="w-full h-11 border-border/50 font-normal" aria-label="Filter by last touch date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Saved Views (Empty State) - compact */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Saved Views</h3>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-muted-foreground text-xs">No saved views yet</p>
          </div>
        </div>

        {/* Utilities - compact */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Utilities</h3>
          <div className="space-y-1">
            <div className="flex items-center min-h-8">
              <Checkbox
                id="show-closed"
                checked={filters.showClosed}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showClosed: !!checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="show-closed" className="ml-2 cursor-pointer flex-1 text-xs">
                Show closed opportunities
              </Label>
            </div>
          </div>
        </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}
