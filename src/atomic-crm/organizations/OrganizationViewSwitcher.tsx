import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type OrganizationView = "grid" | "table";

interface OrganizationViewSwitcherProps {
  view: OrganizationView;
  onViewChange: (view: OrganizationView) => void;
}

export const OrganizationViewSwitcher = ({ view, onViewChange }: OrganizationViewSwitcherProps) => {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => value && onViewChange(value as OrganizationView)}
        className="gap-0.5"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="grid"
              aria-label="Grid view"
              className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Grid View</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="table"
              aria-label="Table view"
              className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Table View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
};
