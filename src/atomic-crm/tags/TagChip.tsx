import { X } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Tag } from "../types";
import { TagEditModal } from "./TagEditModal";
import { getTagColorClass } from "./tag-colors";

interface TagChipProps {
  tag: Tag;

  onUnlink: () => Promise<void>;
}

export const TagChip = memo(function TagChip({ tag, onUnlink }: TagChipProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer",
          "border border-black/20",
          "transition-all duration-200",
          "hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          getTagColorClass(tag.color)
        )}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {tag.name}
        {/* Remove button with 44px touch target (WCAG 2.5.5) - uses negative margin to maintain visual density */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnlink();
          }}
          className="relative -my-2 -mr-1 ml-0.5 h-11 w-11 flex items-center justify-center transition-colors cursor-pointer hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <TagEditModal tag={tag} open={open} onClose={handleClose} />
    </>
  );
});
