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
import { usePrefs } from "../hooks/usePrefs";
import { OPPORTUNITY_STAGES_LEGACY } from "@/atomic-crm/opportunities/stageConstants";

interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = usePrefs<boolean>("sidebarOpen", true);

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
      className="w-64 bg-card border-r border-border shadow-sm h-full flex flex-col"
      aria-label="Filters sidebar"
    >
      <Collapsible open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="border-b border-border">
          <CollapsibleTrigger className="flex items-center justify-between w-full h-11 px-4 hover:bg-muted/50 transition-colors">
            <span className="text-foreground font-semibold text-sm">Filters</span>
            <ChevronRightIcon
              className="size-4 text-muted-foreground transition-transform"
              style={{
                transform: sidebarOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Health Status */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Health Status</h3>
              <div className="space-y-2">
                <div className="flex items-center h-11">
                  <Checkbox
                    id="health-active"
                    checked={filters.health.includes("active")}
                    onCheckedChange={() => toggleHealth("active")}
                  />
                  <Label htmlFor="health-active" className="ml-3 cursor-pointer flex-1">
                    <span className="mr-2">🟢</span>
                    Active
                  </Label>
                </div>
                <div className="flex items-center h-11">
                  <Checkbox
                    id="health-cooling"
                    checked={filters.health.includes("cooling")}
                    onCheckedChange={() => toggleHealth("cooling")}
                  />
                  <Label htmlFor="health-cooling" className="ml-3 cursor-pointer flex-1">
                    <span className="mr-2">🟡</span>
                    Cooling
                  </Label>
                </div>
                <div className="flex items-center h-11">
                  <Checkbox
                    id="health-at-risk"
                    checked={filters.health.includes("at_risk")}
                    onCheckedChange={() => toggleHealth("at_risk")}
                  />
                  <Label htmlFor="health-at-risk" className="ml-3 cursor-pointer flex-1">
                    <span className="mr-2">🔴</span>
                    At Risk
                  </Label>
                </div>
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Stage</h3>
              <div className="space-y-2">
                {OPPORTUNITY_STAGES_LEGACY.map((stage) => (
                  <div key={stage.value} className="flex items-center h-11">
                    <Checkbox
                      id={`stage-${stage.value}`}
                      checked={filters.stages.includes(stage.value)}
                      onCheckedChange={() => toggleStage(stage.value)}
                    />
                    <Label
                      htmlFor={`stage-${stage.value}`}
                      className="ml-3 cursor-pointer flex-1"
                    >
                      {stage.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Assignee</h3>
              <RadioGroup
                value={filters.assignee || ""}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    assignee: value === "" ? null : (value as "me" | "team"),
                  })
                }
              >
                <div className="flex items-center h-11">
                  <RadioGroupItem value="me" id="assignee-me" />
                  <Label htmlFor="assignee-me" className="ml-3 cursor-pointer flex-1">
                    Me
                  </Label>
                </div>
                <div className="flex items-center h-11">
                  <RadioGroupItem value="team" id="assignee-team" />
                  <Label htmlFor="assignee-team" className="ml-3 cursor-pointer flex-1">
                    Team
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Last Touch */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Last Touch</h3>
              <Select
                value={filters.lastTouch}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    lastTouch: value as "7d" | "14d" | "any",
                  })
                }
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Saved Views (Empty State) */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Saved Views</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-muted-foreground text-sm">No saved views yet</p>
              </div>
            </div>

            {/* Utilities */}
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold text-sm">Utilities</h3>
              <div className="space-y-2">
                <div className="flex items-center h-11">
                  <Checkbox
                    id="show-closed"
                    checked={filters.showClosed}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, showClosed: !!checked })
                    }
                  />
                  <Label htmlFor="show-closed" className="ml-3 cursor-pointer flex-1">
                    Show closed opportunities
                  </Label>
                </div>
                <div className="flex items-center h-11">
                  <Checkbox
                    id="group-by-customer"
                    checked={filters.groupByCustomer}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, groupByCustomer: !!checked })
                    }
                  />
                  <Label htmlFor="group-by-customer" className="ml-3 cursor-pointer flex-1">
                    Group opportunities by customer
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
