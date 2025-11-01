import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Tag } from "../types";
import { TagEditModal } from "./TagEditModal";
import { getTagColorClass } from "./tag-colors";

type TagChipProps = {
  tag: Tag;

  onUnlink: () => Promise<void>;
};

export function TagChip({ tag, onUnlink }: TagChipProps) {
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
          "border border-[var(--tag-border)]",
          "transition-all duration-200",
          "hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          getTagColorClass(tag.color),
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnlink();
          }}
          className="transition-colors p-0 ml-1 cursor-pointer hover:opacity-70"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <TagEditModal tag={tag} open={open} onClose={handleClose} />
    </>
  );
}
