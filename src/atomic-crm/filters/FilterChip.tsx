import React from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * Individual filter chip component with remove functionality
 * Follows the TagChip pattern but specialized for filters
 */
export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/90 transition-colors">
      <span className="truncate max-w-[200px]">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-3 w-3 p-0 hover:bg-transparent"
        onClick={handleRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
};
