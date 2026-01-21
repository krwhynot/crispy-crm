import { useState } from "react";
import { ReferenceInput, useCreate, useRefresh } from "react-admin";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { TagDialog } from "./TagDialog";
import type { Tag } from "../types";

interface TagSelectWithCreateProps {
  source: string;
  label?: string;
}

/**
 * Pattern F: Complex Quick-Create using footer + Dialog
 * Opens TagDialog for full tag creation (name + color)
 */
export function TagSelectWithCreate({ source, label }: TagSelectWithCreateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState("");
  const [create] = useCreate();
  const { success, error: notifyError } = useSafeNotify();
  const refresh = useRefresh();

  const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
    await create(
      "tags",
      { data },
      {
        onSuccess: () => {
          success("Tag created");
          setDialogOpen(false);
          refresh();
        },
        onError: (error) => {
          notifyError(error);
        },
      }
    );
  };

  const footer = (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-full justify-start text-sm"
      onClick={() => setDialogOpen(true)}
    >
      <PlusIcon className="mr-2 h-4 w-4" />
      Create new tag
    </Button>
  );

  return (
    <>
      <ReferenceInput reference="tags" source={source}>
        <GenericSelectInput
          label={label}
          optionLabel="name"
          onSearchChange={setDefaultName}
          footer={footer}
          searchable
        />
      </ReferenceInput>

      <TagDialog
        open={dialogOpen}
        title="Create a new tag"
        tag={{ name: defaultName, color: "warm" }}
        onSubmit={handleCreateTag}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
