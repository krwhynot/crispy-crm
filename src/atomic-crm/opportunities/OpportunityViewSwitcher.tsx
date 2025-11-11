import { LayoutGrid, List, FolderOpen } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type OpportunityView = "kanban" | "list" | "campaign";

interface OpportunityViewSwitcherProps {
  view: OpportunityView;
  onViewChange: (view: OpportunityView) => void;
}

export const OpportunityViewSwitcher = ({ view, onViewChange }: OpportunityViewSwitcherProps) => {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => value && onViewChange(value as OpportunityView)}
        className="gap-0.5"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="kanban"
              aria-label="Kanban view"
              className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kanban View</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>List View</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="campaign"
              aria-label="Campaign grouped view"
              className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <FolderOpen className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Campaign View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
};
