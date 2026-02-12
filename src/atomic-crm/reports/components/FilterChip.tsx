import React from "react";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export const FilterChip = React.memo(({ label, value, onRemove }: FilterChipProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <div
      role="listitem"
      className="inline-flex items-center gap-compact rounded-md bg-muted px-3 py-2 text-sm text-foreground min-h-[44px]"
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        onKeyDown={handleKeyDown}
        className="ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});
