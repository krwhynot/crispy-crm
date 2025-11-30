import * as React from "react";
import { Button } from "@/components/ui/button";
import { SaveButtonGroup } from "./SaveButtonGroup";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface FormActionsProps {
  onCancel: () => void;
  onDelete?: () => void;
  onSaveAndNew?: (data: any) => void | Promise<void>;
  showSaveAndNew?: boolean;
  className?: string;
}

function FormActions({
  onCancel,
  onDelete,
  onSaveAndNew,
  showSaveAndNew = false,
  className,
}: FormActionsProps) {
  const handleSave = (data: any) => {
    return;
  };

  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex items-center gap-4 pt-6 border-t border-border",
        onDelete ? "justify-between" : "justify-end",
        className
      )}
    >
      {onDelete && (
        <div className="flex-shrink-0">
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        {showSaveAndNew && onSaveAndNew ? (
          <SaveButtonGroup onSave={handleSave} onSaveAndNew={onSaveAndNew} />
        ) : (
          <Button type="submit">Save</Button>
        )}
      </div>
    </div>
  );
}

export { FormActions };
export type { FormActionsProps };
