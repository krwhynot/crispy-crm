import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type OpportunityView = "kanban" | "list";

interface OpportunityViewSwitcherProps {
  view: OpportunityView;
  onViewChange: (view: OpportunityView) => void;
}

export const OpportunityViewSwitcher = ({ view, onViewChange }: OpportunityViewSwitcherProps) => {
  return (
    <TooltipProvider>
      <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as OpportunityView)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kanban View</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>List View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
};