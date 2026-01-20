import { Button } from "@/components/ui/button";
import { SaveButtonGroup } from "./SaveButtonGroup";
import { cn } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";
import { type FieldValues, useFormState } from "react-hook-form";

interface FormActionsProps {
  onCancel: () => void;
  onDelete?: () => void;
  /** Handler for regular Save action (required when showSaveAndNew is true) */
  onSave?: (data: FieldValues) => void | Promise<void>;
  onSaveAndNew?: (data: FieldValues) => void | Promise<void>;
  showSaveAndNew?: boolean;
  className?: string;
}

function FormActions({
  onCancel,
  onDelete,
  onSave,
  onSaveAndNew,
  showSaveAndNew = false,
  className,
}: FormActionsProps) {
  const { isSubmitting } = useFormState();

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

        {showSaveAndNew && onSave && onSaveAndNew ? (
          <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export { FormActions };
export type { FormActionsProps };
