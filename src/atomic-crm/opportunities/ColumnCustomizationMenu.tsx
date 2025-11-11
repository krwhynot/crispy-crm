import { useState, useRef, useEffect } from "react";
import { OPPORTUNITY_STAGES } from "./stageConstants";
import type { OpportunityStageValue } from "../types";

interface ColumnCustomizationMenuProps {
  visibleStages: OpportunityStageValue[];
  toggleVisibility: (stage: OpportunityStageValue) => void;
  collapseAll: () => void;
  expandAll: () => void;
}

export function ColumnCustomizationMenu({
  visibleStages,
  toggleVisibility,
  collapseAll,
  expandAll,
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Customize columns"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
      >
        Customize Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-border">
              <button
                onClick={() => {
                  collapseAll();
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline mr-3"
              >
                Collapse All
              </button>
              <button
                onClick={() => {
                  expandAll();
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Expand All
              </button>
            </div>

            <div className="px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Visible Stages</p>
              {OPPORTUNITY_STAGES.map((stage) => (
                <label key={stage.value} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleStages.includes(stage.value)}
                    onChange={() => toggleVisibility(stage.value)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{stage.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
