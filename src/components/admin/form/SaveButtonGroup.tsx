import * as React from "react";
import { useCallback } from "react";
import { type FieldValues, useFormContext, useFormState } from "react-hook-form";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SaveAction = "save" | "saveAndNew";

interface SaveButtonGroupProps {
  onSave: (data: FieldValues) => void | Promise<void>;
  onSaveAndNew: (data: FieldValues) => void | Promise<void>;
  className?: string;
}

function SaveButtonGroup({ onSave, onSaveAndNew, className }: SaveButtonGroupProps) {
  const { handleSubmit } = useFormContext();
  const { isSubmitting } = useFormState();

  const createSubmitHandler = useCallback(
    (action: SaveAction) => {
      return handleSubmit((data) => {
        if (action === "saveAndNew") return onSaveAndNew(data);
        return onSave(data);
      });
    },
    [handleSubmit, onSave, onSaveAndNew]
  );

  return (
    <div data-slot="save-button-group" className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        onClick={createSubmitHandler("save")}
        disabled={isSubmitting}
        className={cn("flex items-center gap-2", isSubmitting && "opacity-50 cursor-not-allowed")}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSubmitting}
            aria-label="More save options"
            className={cn(isSubmitting && "opacity-50 cursor-not-allowed")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={createSubmitHandler("save")}>Save</DropdownMenuItem>
          <DropdownMenuItem onSelect={createSubmitHandler("saveAndNew")}>
            Save + Create Another
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SaveButtonGroup };
export type { SaveButtonGroupProps };
