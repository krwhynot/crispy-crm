import { useState, useRef, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { OPPORTUNITY_STAGES } from "../constants/stageConstants";
import type { OpportunityStageValue } from "../../types";
import { Checkbox } from "@/components/ui/checkbox";

interface ColumnCustomizationMenuProps {
  visibleStages: OpportunityStageValue[];
  toggleVisibility: (stage: OpportunityStageValue) => void;
  collapseAll: () => void;
  expandAll: () => void;
  resetPreferences?: () => void;
}

export function ColumnCustomizationMenu({
  visibleStages,
  toggleVisibility,
  collapseAll,
  expandAll,
  resetPreferences,
}: ColumnCustomizationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Always cleanup, even if component unmounts while closed
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Customize columns"
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-sm border border-border rounded-md hover:bg-accent transition-colors shadow-sm"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-border flex gap-2">
              <button
                onClick={() => {
                  collapseAll();
                  setIsOpen(false);
                }}
                className="min-h-[44px] px-3 text-sm text-primary hover:bg-accent rounded transition-colors touch-manipulation"
              >
                Collapse All
              </button>
              <button
                onClick={() => {
                  expandAll();
                  setIsOpen(false);
                }}
                className="min-h-[44px] px-3 text-sm text-primary hover:bg-accent rounded transition-colors touch-manipulation"
              >
                Expand All
              </button>
            </div>

            <div className="px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Visible Stages</p>
              {OPPORTUNITY_STAGES.map((stage) => (
                <label
                  key={stage.value}
                  className="flex items-center gap-3 min-h-[44px] cursor-pointer hover:bg-accent rounded px-1 -mx-1 transition-colors"
                >
                  <Checkbox
                    id={`stage-${stage.value}`}
                    checked={visibleStages.includes(stage.value)}
                    onCheckedChange={() => toggleVisibility(stage.value)}
                  />
                  <span className="text-sm select-none">{stage.label}</span>
                </label>
              ))}
            </div>

            {/* Reset All - fixes corrupted localStorage state */}
            {resetPreferences && (
              <div className="px-4 py-2 border-t border-border">
                <button
                  onClick={() => {
                    resetPreferences();
                    setIsOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors touch-manipulation text-left"
                >
                  🔄 Reset All Columns
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
