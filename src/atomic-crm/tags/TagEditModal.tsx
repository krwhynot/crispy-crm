import { useUpdate } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";
import { tagKeys } from "@/atomic-crm/queryKeys";

interface TagEditModalProps {
  tag: Tag;
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagEditModal({ tag, open, onClose, onSuccess }: TagEditModalProps) {
  const [update] = useUpdate<Tag>();
  const queryClient = useQueryClient();

  const handleEditTag = async (data: Pick<Tag, "name" | "color">) => {
    await update(
      "tags",
      { id: tag.id, data, previousData: tag },
      {
        onSuccess: async (updatedTag) => {
          // STATE-1 FIX: Invalidate tag caches to refresh lists
          await queryClient.invalidateQueries({ queryKey: tagKeys.all });
          await onSuccess?.(updatedTag);
        },
      }
    );
  };

  return (
    <TagDialog open={open} title="Edit tag" onClose={onClose} onSubmit={handleEditTag} tag={tag} />
  );
}
