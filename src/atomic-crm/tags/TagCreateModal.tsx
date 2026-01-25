import { useCreate } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";
import { tagKeys } from "@/atomic-crm/queryKeys";

interface TagCreateModalProps {
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagCreateModal({ open, onClose, onSuccess }: TagCreateModalProps) {
  const [create] = useCreate<Tag>();
  const queryClient = useQueryClient();

  const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
    await create(
      "tags",
      { data },
      {
        onSuccess: async (tag) => {
          // SS-05 FIX: Invalidate tag caches to refresh lists
          await queryClient.invalidateQueries({ queryKey: tagKeys.all });
          await onSuccess?.(tag);
        },
      }
    );
  };

  return (
    <TagDialog open={open} title="Create a new tag" onClose={onClose} onSubmit={handleCreateTag} />
  );
}
