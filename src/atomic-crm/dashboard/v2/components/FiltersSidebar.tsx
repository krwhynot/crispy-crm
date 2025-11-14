import { ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterState } from "../types";
import { OPPORTUNITY_STAGES_LEGACY } from "@/atomic-crm/opportunities/stageConstants";
import { usePrefs } from "../hooks/usePrefs";

interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [filtersOpen, setFiltersOpen] = usePrefs<boolean>("pd.filtersOpen", true);

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
      {/* Sticky header with close button */}
      <div className="sticky top-0 z-10 bg-card pb-2 px-3 pt-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="h-11 w-11 p-0 hover:bg-muted"
          aria-label="Close filters sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter groups with compact spacing */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Health Status - compact */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Health Status</h3>
          <div className="space-y-1">
            <div className="flex items-center min-h-8">
              <Checkbox
                id="health-active"
                checked={filters.health.includes("active")}
                onCheckedChange={() => toggleHealth("active")}
                className="h-4 w-4"
              />
              <Label htmlFor="health-active" className="ml-3 cursor-pointer flex-1 text-xs text-success">
                <span className="mr-2">🟢</span>
                Active
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
                Cooling
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
                At Risk
              </Label>
            </div>
          </div>
        </div>

        {/* Stage - TWO-COLUMN LAYOUT */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Stage</h3>
          <div className="grid grid-cols-2 gap-2">
            {OPPORTUNITY_STAGES_LEGACY.map((stage) => (
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

        {/* Assignee - horizontal radio layout */}
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Assignee</h3>
          <RadioGroup
            value={filters.assignee || ""}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                assignee: value === "" ? null : (value as "me" | "team"),
              })
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center min-h-8">
                <RadioGroupItem value="me" id="assignee-me" />
                <Label htmlFor="assignee-me" className="ml-2 cursor-pointer text-xs">
                  Me
                </Label>
              </div>
              <div className="flex items-center min-h-8">
                <RadioGroupItem value="team" id="assignee-team" />
                <Label htmlFor="assignee-team" className="ml-2 cursor-pointer text-xs">
                  Team
                </Label>
              </div>
            </div>
          </RadioGroup>
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
            <SelectTrigger className="w-full h-9">
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
            <div className="flex items-center min-h-8">
              <Checkbox
                id="group-by-customer"
                checked={filters.groupByCustomer}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, groupByCustomer: !!checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="group-by-customer" className="ml-2 cursor-pointer flex-1 text-xs">
                Group opportunities by customer
              </Label>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
