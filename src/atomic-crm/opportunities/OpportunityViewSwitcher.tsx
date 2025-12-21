import { LayoutGrid, List, FolderOpen, Factory } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type OpportunityView = "kanban" | "list" | "campaign" | "principal";

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
              className="h-11 w-11 sm:h-11 sm:w-11 touch-manipulation"
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
              className="h-11 w-11 sm:h-11 sm:w-11 touch-manipulation"
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
              className="h-11 w-11 sm:h-11 sm:w-11 touch-manipulation"
            >
              <FolderOpen className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Campaign View</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="principal"
              aria-label="Principal grouped view"
              className="h-11 w-11 sm:h-11 sm:w-11 touch-manipulation"
            >
              <Factory className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Principal View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
};
