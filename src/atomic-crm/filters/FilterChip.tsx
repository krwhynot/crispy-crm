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
    <div className="inline-flex items-center gap-1 pl-3 text-xs rounded-full bg-muted hover:bg-muted/90 transition-colors">
      <span className="truncate max-w-[200px]">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-accent/50"
        onClick={handleRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
};
