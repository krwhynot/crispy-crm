import { Translate } from "ra-core";
import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilterLayoutMode } from "./FilterLayoutModeContext";

interface FilterCategoryProps {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  defaultExpanded?: boolean;
  hasActiveFilters?: boolean;
}

export const FilterCategory = ({
  icon,
  label,
  children,
  defaultExpanded = false,
  hasActiveFilters = false,
}: FilterCategoryProps) => {
  const mode = useFilterLayoutMode();

  // Sheet mode: always expand categories for discoverability
  const forceExpanded = mode === "sheet";

  return (
    <ExpandedCategory
      icon={icon}
      label={label}
      defaultExpanded={forceExpanded || defaultExpanded}
      hasActiveFilters={hasActiveFilters}
    >
      {children}
    </ExpandedCategory>
  );
};

/**
 * Full/sheet mode: collapsible category with icon + label + chevron.
 * In sheet mode, categories default to expanded for discoverability.
 */
function ExpandedCategory({
  icon,
  label,
  defaultExpanded,
  hasActiveFilters,
  children,
}: {
  icon: ReactNode;
  label: string;
  defaultExpanded: boolean;
  hasActiveFilters: boolean;
  children?: ReactNode;
}) {
  // Auto-expand if there are active filters, otherwise use defaultExpanded
  const [isExpanded, setIsExpanded] = useState(hasActiveFilters || defaultExpanded);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex flex-row items-center justify-between w-full text-left min-h-12 px-2 hover:bg-muted rounded-md transition-colors group cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex flex-row items-center gap-2">
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {icon}
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            <Translate i18nKey={label} />
          </h3>
          {hasActiveFilters && <div className="h-2 w-2 rounded-full bg-accent" />}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )}
        />
      </button>
      {isExpanded && (
        <div className="flex flex-col items-start gap-2 pl-7 mt-2 mb-2">{children}</div>
      )}
    </div>
  );
}
