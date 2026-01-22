import { Badge } from "@/components/ui/badge";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Plus } from "lucide-react";
import type { Identifier } from "ra-core";
import { useGetList, useGetMany, useRecordContext, useUpdate } from "ra-core";
import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { TagChip } from "../tags/TagChip";
import { TagCreateModal } from "../tags/TagCreateModal";
import { getTagColorClass } from "../tags/tag-colors";
import type { Contact, Tag } from "../types";

export const TagsListEdit = () => {
  const record = useRecordContext<Contact>();
  const [open, setOpen] = useState(false);

  const { data: allTags, isPending: isPendingAllTags } = useGetList<Tag>("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: tags, isPending: isPendingRecordTags } = useGetMany<Tag>(
    "tags",
    { ids: record?.tags },
    { enabled: record && record.tags && record.tags.length > 0 }
  );
  const [update] = useUpdate<Contact>();

  const unselectedTags =
    allTags && record && allTags.filter((tag) => !record.tags.includes(tag.id));

  const handleTagAdd = (id: Identifier) => {
    if (!record) {
      throw new Error("No contact record found");
    }
    const tags = [...record.tags, id];
    update("contacts", {
      id: record.id,
      data: { tags }, // Only send the tags field
      previousData: record,
    });
  };

  const handleTagDelete = async (id: Identifier) => {
    if (!record) {
      throw new Error("No contact record found");
    }
    const tags = record.tags.filter((tagId) => tagId !== id);
    await update("contacts", {
      id: record.id,
      data: { tags }, // Only send the tags field
      previousData: record,
    });
  };

  const openTagCreateDialog = () => {
    setOpen(true);
  };

  const handleTagCreateClose = () => {
    setOpen(false);
  };

  const handleTagCreated = React.useCallback(
    async (tag: Tag) => {
      if (!record) {
        throw new Error("No contact record found");
      }

      await update(
        "contacts",
        {
          id: record.id,
          data: { tags: [...record.tags, tag.id] }, // Only send the tags field
          previousData: record,
        },
        {
          onSuccess: () => {
            setOpen(false);
          },
        }
      );
    },
    [update, record]
  );

  if (isPendingRecordTags || isPendingAllTags) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => (
        <div key={tag.id}>
          <TagChip tag={tag} onUnlink={() => handleTagDelete(tag.id)} />
        </div>
      ))}

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AdminButton variant="outline" size="sm" className="h-11 px-3 cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              Add tag
            </AdminButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {unselectedTags?.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => handleTagAdd(tag.id)}>
                <Badge
                  variant="secondary"
                  className={cn("text-xs font-normal", getTagColorClass(tag.color))}
                >
                  {tag.name}
                </Badge>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={openTagCreateDialog}>
              <AdminButton
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 cursor-pointer"
              >
                <Edit className="h-3 w-3 mr-2" />
                Create new tag
              </AdminButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TagCreateModal open={open} onClose={handleTagCreateClose} onSuccess={handleTagCreated} />
    </div>
  );
};
